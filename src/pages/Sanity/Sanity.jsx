import React, { useEffect, useReducer, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  createInitialSanityState,
  getSanityCheck,
  getSanityScore,
  getSanityStepId,
  SANITY_STEP_IDS,
  SANITY_STEP_INSTRUCTIONS,
  SANITY_STEP_LABELS,
  SANITY_UNIT_PRICE_CENTS,
  sanityTestReducer,
} from "../../../core/sanity-test.js";
import { SanityReadOnlyNotice, SanityRoot } from "./Sanity.styles.js";

const progress = window.QAQuestProgress;
const money = (cents) =>
  (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

function readAccess() {
  return {
    tracksUnlocked: progress.isTracksUnlocked(),
    phase4Available: progress.isPhaseUnlocked(4),
    readOnly: progress.isReadOnly(),
  };
}

function SanityEvidence({ state, id }) {
  const check = getSanityCheck(state, id);
  return (
    <details
      className="sanity-evidence-item"
      data-outcome={check.outcome}
      key={id}
    >
      <summary>
        <strong>
          {check.title} · {check.outcome === "pass" ? "Passou" : "Falhou"}
        </strong>
      </summary>
      {[
        ["Ação", check.action],
        ["Esperado", check.expected],
        ["Observado", check.observed],
        ["Impacto", check.impact],
      ].map(([label, value]) => (
        <p key={label}>
          <b>{label}: </b>
          {value}
        </p>
      ))}
    </details>
  );
}

function Sanity() {
  const [state, dispatch] = useReducer(
    sanityTestReducer,
    undefined,
    createInitialSanityState,
  );
  const [access, setAccess] = useState(readAccess);
  const [savedProgress, setSavedProgress] = useState(null);
  const [saveBlocked, setSaveBlocked] = useState(false);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const checkTitleRef = useRef(null);
  const classificationButtonRef = useRef(null);
  const nextButtonRef = useRef(null);
  const reviewDecisionRef = useRef(null);
  const resultTitleRef = useRef(null);
  const saveStatusRef = useRef(null);
  const previousStepRef = useRef(state.step);
  const pendingClassificationFocus = useRef(false);
  const pendingNextFocus = useRef(false);
  const id = getSanityStepId(state);
  const actionDone = state.actions.includes(id);
  const check = actionDone ? getSanityCheck(state, id) : null;
  const recorded = Boolean(state.records[id]);
  const recordCount = Object.keys(state.records).length;
  const score = getSanityScore(state);
  const checkoutView = id !== "empty" && (id !== "open" || actionDone);

  useEffect(() => {
    const headerXp = document.querySelector("#header-xp");
    if (headerXp) headerXp.textContent = String(score);
  }, [score]);

  useEffect(() => {
    const refreshAccess = () => setAccess(readAccess());
    const refreshFromStorage = (event) => {
      if (event.key === progress.storageKey || event.key === null)
        refreshAccess();
    };
    const refreshWhenVisible = () => {
      if (!document.hidden) refreshAccess();
    };

    window.addEventListener("qaquest:progress", refreshAccess);
    window.addEventListener("storage", refreshFromStorage);
    window.addEventListener("pageshow", refreshAccess);
    window.addEventListener("focus", refreshAccess);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.removeEventListener("qaquest:progress", refreshAccess);
      window.removeEventListener("storage", refreshFromStorage);
      window.removeEventListener("pageshow", refreshAccess);
      window.removeEventListener("focus", refreshAccess);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  useEffect(() => {
    if (previousStepRef.current !== state.step || attemptNumber > 0)
      checkTitleRef.current?.focus();
    previousStepRef.current = state.step;
  }, [state.step, attemptNumber]);

  useEffect(() => {
    if (!pendingClassificationFocus.current) return;
    pendingClassificationFocus.current = false;
    classificationButtonRef.current?.focus();
  }, [state.actions]);

  useEffect(() => {
    if (!pendingNextFocus.current) return;
    pendingNextFocus.current = false;
    nextButtonRef.current?.focus();
  }, [state.records]);

  useEffect(() => {
    if (state.finished) resultTitleRef.current?.focus();
  }, [state.finished]);

  useEffect(() => {
    if (!state.finished) return;
    if (!savedProgress) {
      saveStatusRef.current?.reset();
      return;
    }
    if (!saveStatusRef.current)
      throw new Error("Componente de status de salvamento não encontrado.");
    saveStatusRef.current.show(savedProgress);
  }, [state.finished, savedProgress]);

  function runAction(action) {
    if (state.finished || !progress.isTracksUnlocked()) {
      setAccess(readAccess());
      return;
    }
    const nextState = sanityTestReducer(state, action);
    if (!state.actions.includes(id) && nextState.actions.includes(id))
      pendingClassificationFocus.current = true;
    dispatch(action);
  }

  function submitFields(event) {
    event.preventDefault();
    if (state.finished || !progress.isTracksUnlocked()) {
      setAccess(readAccess());
      return;
    }
    const nextState = sanityTestReducer(state, { type: "submit-fields" });
    if (nextState.fieldValidity && !nextState.actions.includes("fields")) {
      const field = ["address", "cep", "payment"].find(
        (name) => !nextState.fieldValidity[name],
      );
      document
        .getElementById(
          `sanity-${field === "address" ? "address-input" : field === "cep" ? "cep-input" : "payment-input"}`,
        )
        ?.focus();
    } else if (nextState.actions.includes("fields")) {
      pendingClassificationFocus.current = true;
    }
    dispatch({ type: "submit-fields" });
  }

  function submitClassification(event) {
    event.preventDefault();
    if (state.finished || !progress.isTracksUnlocked()) {
      setAccess(readAccess());
      return;
    }
    const action = {
      type: "classify",
      value: event.nativeEvent.submitter?.value,
    };
    const nextState = sanityTestReducer(state, action);
    if (!state.records[id] && nextState.records[id])
      pendingNextFocus.current = true;
    dispatch(action);
  }

  function nextStep() {
    if (state.finished || !progress.isTracksUnlocked()) {
      setAccess(readAccess());
      return;
    }
    if (state.step < SANITY_STEP_IDS.length - 1)
      dispatch({ type: "next-step" });
    else reviewDecisionRef.current?.focus();
  }

  function submitReview(event) {
    event.preventDefault();
    if (!progress.isTracksUnlocked()) {
      setAccess(readAccess());
      return;
    }
    const nextState = sanityTestReducer(state, { type: "submit-review" });
    if (nextState.finished && !state.finished) {
      setSaveBlocked(false);
      setSavedProgress(null);
      saveStatusRef.current?.reset();
      if (progress.isReadOnly()) {
        setAccess(readAccess());
        setSaveBlocked(true);
      } else {
        let result;
        try {
          result = progress.saveMissionResult(
            "sanity",
            getSanityScore(nextState),
          );
        } catch (error) {
          if (!progress.isReadOnly()) throw error;
          setAccess(readAccess());
          setSaveBlocked(true);
        }
        if (result) setSavedProgress(result);
      }
    }
    dispatch({ type: "submit-review" });
  }

  function restartMission() {
    if (!progress.isTracksUnlocked()) {
      setAccess(readAccess());
      return;
    }
    setSavedProgress(null);
    setSaveBlocked(false);
    setAccess(readAccess());
    setAttemptNumber((current) => current + 1);
    saveStatusRef.current?.reset();
    dispatch({ type: "restart" });
  }

  if (!access.tracksUnlocked)
    return (
      <SanityRoot>
        <section
          className="sanity-locked"
          id="sanity-locked"
          aria-labelledby="sanity-locked-title"
        >
          <span className="label label--cyan">BASE COMUM</span>
          <h1 id="sanity-locked-title">
            Conclua a Fase 4 para iniciar esta missão.
          </h1>
          <p>
            Você pode começar a Sanidade sem concluir Smoke Test ou outra
            trilha. O contexto do defeito anterior está incluído aqui.
          </p>
          <a
            className="button button--primary"
            id="sanity-locked-link"
            href={access.phase4Available ? "phase4.html" : "index.html"}
          >
            {access.phase4Available ? "Continuar Fase 4" : "Voltar à jornada"}
          </a>
        </section>
      </SanityRoot>
    );

  return (
    <SanityRoot>
      {access.readOnly && (
        <SanityReadOnlyNotice role="status" aria-live="polite">
          O progresso pertence a uma versão mais recente. Você pode concluir a
          missão, mas o resultado não será salvo.
        </SanityReadOnlyNotice>
      )}
      <div id="sanity-content" hidden={state.finished}>
        <header className="sanity-intro">
          <div>
            <span className="label label--cyan">
              TRILHA 02 · CONFIANÇA NA RELEASE
            </span>
            <h1>O ajuste resolveu?</h1>
          </div>
          <p>
            A equipe corrigiu a abertura do Checkout da Fikily. Confirme
            separadamente se o 503 foi resolvido e se a candidata inteira pode
            ser aceita.
          </p>
        </header>
        <section
          className="sanity-briefing"
          aria-labelledby="sanity-briefing-title"
        >
          <div>
            <span className="label">
              DEFEITO FF-CHECKOUT-503 · CENÁRIO FICTÍCIO
            </span>
            <h2 id="sanity-briefing-title">Uma correção. Um escopo focado.</h2>
            <p>
              Esta Sanidade reúne a confirmação do defeito original e
              verificações próximas da área alterada. Você não precisa repetir
              Home, Login ou a jornada de compra completa. Use apenas dados
              fictícios; nenhum pedido ou pagamento será realizado.
            </p>
            <div className="sanity-releases">
              <div>
                <span>ANTES · FF-2026.10</span>
                <strong>Checkout indisponível</strong>
                <p>
                  Evidência do Smoke: GET /checkout → 503. Entrega e pagamento
                  não carregavam.
                </p>
              </div>
              <div>
                <span>AGORA · FF-2026.10.1</span>
                <strong>Correção entregue para validar</strong>
                <p>
                  A equipe informa que o Checkout voltou a abrir. Item,
                  quantidade e total devem ser preservados, com frete grátis.
                </p>
              </div>
            </div>
          </div>
          <aside className="sanity-scoring">
            <strong>Até 100 XP</strong>
            <p>
              4 ações × 10 XP
              <br />
              4 classificações × 10 XP
              <br />
              Parecer e justificativa: 20 XP
            </p>
            <small>
              Uma resposta corrigida vale metade dos pontos daquele item. O
              parecer vale apenas para esta candidata, não para o produto
              inteiro.
            </small>
          </aside>
        </section>
        <section
          className="sanity-workspace"
          id="sanity-workspace"
          aria-label="Bancada de Teste de Sanidade"
        >
          <aside
            className="sanity-panel sanity-checklist"
            aria-labelledby="sanity-checks-title"
          >
            <span className="label label--cyan">ÁREA ALTERADA: CHECKOUT</span>
            <h2 id="sanity-checks-title">Confira a correção.</h2>
            <div className="sanity-progress-copy">
              <span>Checks registrados</span>
              <strong>{recordCount} / 4</strong>
            </div>
            <div
              id="sanity-progress"
              role="progressbar"
              aria-label="Checks registrados"
              aria-valuemin="0"
              aria-valuemax="4"
              aria-valuenow={recordCount}
            >
              <i
                id="sanity-bar"
                style={{ width: `${(recordCount / 4) * 100}%` }}
              ></i>
            </div>
            <ol id="sanity-steps">
              {SANITY_STEP_IDS.map((stepId, index) => {
                const stepRecord = state.records[stepId];
                const done = state.actions.includes(stepId);
                const status = stepRecord
                  ? stepId === "consistency"
                    ? "Falhou · total divergente"
                    : "Passou"
                  : done
                    ? "Classifique o resultado"
                    : index === state.step
                      ? "Em verificação"
                      : "Próximo";
                return (
                  <li
                    key={stepId}
                    className={index === state.step ? "is-current" : ""}
                    aria-current={index === state.step ? "step" : undefined}
                    data-outcome={
                      stepRecord
                        ? getSanityCheck(state, stepId).outcome
                        : undefined
                    }
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <strong>{SANITY_STEP_LABELS[index]}</strong>
                      <small>{status}</small>
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="sanity-tip">
              Acompanhe a expectativa de cada check. A abertura da tela e a
              coerência dos dados são verificações diferentes.
            </p>
          </aside>
          <section
            className="sanity-panel sanity-lab"
            aria-labelledby="sanity-check-title"
          >
            <header className="sanity-lab__heading">
              <span className="label">CHECK FOCADO</span>
              <h2 ref={checkTitleRef} id="sanity-check-title" tabIndex="-1">
                {SANITY_STEP_LABELS[state.step]}
              </h2>
              <p>{SANITY_STEP_INSTRUCTIONS[state.step]}</p>
            </header>
            <div className="sanity-browser" aria-label="Loja fictícia Fikily">
              <div className="sanity-browser__bar">
                <span aria-hidden="true">● ● ●</span>
                <span id="sanity-address">
                  fikily.test/{checkoutView ? "checkout" : "cart"}
                </span>
                <small>Simulado</small>
              </div>
              <header className="sanity-store-nav">
                <strong>
                  <b>F</b> Fikily
                </strong>
                <span>FF-2026.10.1</span>
              </header>
              <div className="sanity-store">
                <section data-sanity-view="cart" hidden={checkoutView}>
                  <span className="sanity-store-kicker">CARRINHO DE TESTE</span>
                  <h3>Prepare o caso da correção.</h3>
                  <article className="sanity-product">
                    <strong>Mochila Urbana</strong>
                    <span>R$ 189,90 por unidade · Frete grátis</span>
                    <label htmlFor="sanity-quantity">
                      Quantidade
                      <select
                        id="sanity-quantity"
                        value={state.quantity}
                        disabled={actionDone}
                        onChange={(event) =>
                          dispatch({
                            type: "set-quantity",
                            value: Number(event.target.value),
                          })
                        }
                      >
                        <option value="1">1 unidade</option>
                        <option value="2">2 unidades</option>
                        <option value="3">3 unidades</option>
                      </select>
                    </label>
                  </article>
                  <div className="sanity-store-total">
                    <span>Total do carrinho</span>
                    <strong>
                      {money(state.quantity * SANITY_UNIT_PRICE_CENTS)}
                    </strong>
                  </div>
                  <button
                    className="sanity-store-button"
                    type="button"
                    disabled={actionDone}
                    onClick={() => runAction({ type: "open-checkout" })}
                  >
                    Abrir Checkout com este carrinho
                  </button>
                </section>
                <section data-sanity-view="checkout" hidden={!checkoutView}>
                  <span className="sanity-store-kicker">
                    CHECKOUT · RESPOSTA SIMULADA
                  </span>
                  <h3>A tela de entrega voltou.</h3>
                  <p className="sanity-http">200 OK · Checkout carregado</p>
                  <div className="sanity-reference">
                    <span>Referência do carrinho</span>
                    <strong>
                      {state.cart &&
                        `${state.cart.quantity} × Mochila Urbana · ${money(state.cart.total)}`}
                    </strong>
                  </div>
                  <div className="sanity-order-row">
                    <span>
                      Mochila Urbana
                      <small>
                        {state.cart && `${state.cart.quantity} unidade(s)`}
                      </small>
                    </span>
                    <strong>{state.cart && money(state.cart.total)}</strong>
                  </div>
                  <p className="sanity-store-note">
                    Frete grátis · sem taxas adicionais contratadas.
                  </p>
                  <form
                    id="sanity-fields-form"
                    noValidate
                    onSubmit={submitFields}
                  >
                    <label
                      className="sanity-field"
                      htmlFor="sanity-address-input"
                    >
                      Endereço fictício
                      <input
                        id="sanity-address-input"
                        type="text"
                        placeholder="Rua Fikily, 101"
                        autoComplete="off"
                        maxLength="160"
                        value={state.address}
                        readOnly={state.actions.includes("fields")}
                        aria-invalid={
                          state.fieldValidity
                            ? String(!state.fieldValidity.address)
                            : undefined
                        }
                        onChange={(event) =>
                          dispatch({
                            type: "set-field",
                            field: "address",
                            value: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="sanity-field" htmlFor="sanity-cep-input">
                      CEP fictício
                      <input
                        id="sanity-cep-input"
                        type="text"
                        placeholder="01001-000"
                        autoComplete="off"
                        inputMode="numeric"
                        maxLength="9"
                        value={state.cep}
                        readOnly={state.actions.includes("fields")}
                        aria-invalid={
                          state.fieldValidity
                            ? String(!state.fieldValidity.cep)
                            : undefined
                        }
                        onChange={(event) =>
                          dispatch({
                            type: "set-field",
                            field: "cep",
                            value: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label
                      className="sanity-field"
                      htmlFor="sanity-payment-input"
                    >
                      Pagamento simulado
                      <select
                        id="sanity-payment-input"
                        value={state.payment}
                        disabled={state.actions.includes("fields")}
                        aria-invalid={
                          state.fieldValidity
                            ? String(!state.fieldValidity.payment)
                            : undefined
                        }
                        onChange={(event) =>
                          dispatch({
                            type: "set-field",
                            field: "payment",
                            value: event.target.value,
                          })
                        }
                      >
                        <option value="">Selecione uma forma</option>
                        <option value="pix">Pix de teste</option>
                        <option value="card">
                          Cartão de teste · final 4242
                        </option>
                      </select>
                    </label>
                    <p
                      className="sanity-field-feedback"
                      role="status"
                      aria-live="polite"
                      hidden={!state.fieldsFeedback}
                    >
                      {state.fieldsFeedback}
                    </p>
                    <button
                      className="sanity-store-button"
                      id="validate-sanity-fields"
                      type="submit"
                      hidden={id !== "fields" || actionDone}
                    >
                      Verificar campos preenchidos
                    </button>
                  </form>
                  <div className="sanity-store-total">
                    <span>Total no Checkout</span>
                    <strong>
                      {state.checkoutTotal !== null &&
                        money(state.checkoutTotal)}
                    </strong>
                  </div>
                  <button
                    className="sanity-store-button"
                    type="button"
                    hidden={id !== "consistency" || actionDone}
                    disabled={actionDone}
                    onClick={() => runAction({ type: "compare-data" })}
                  >
                    Comparar dados com o carrinho
                  </button>
                  <div
                    className="sanity-comparison"
                    hidden={!state.actions.includes("consistency")}
                  >
                    <p>
                      <strong>Carrinho: </strong>
                      {state.cart &&
                        `${state.cart.quantity} × Mochila Urbana · ${money(state.cart.total)}`}
                    </p>
                    <p>
                      <strong>Checkout: </strong>
                      {state.cart &&
                        `${state.cart.quantity} × Mochila Urbana · ${money(state.checkoutTotal)}`}
                    </p>
                  </div>
                </section>
                <section data-sanity-view="empty" hidden={id !== "empty"}>
                  <span className="sanity-store-kicker">CONDIÇÃO PRÓXIMA</span>
                  <h3>E se o carrinho estiver vazio?</h3>
                  <p className="sanity-store-note">
                    Este caso começa com um carrinho vazio separado. Ele não
                    altera a evidência do carrinho anterior.
                  </p>
                  <div className="sanity-empty-cart">
                    Seu carrinho está vazio.
                  </div>
                  <button
                    className="sanity-store-button"
                    type="button"
                    disabled={actionDone}
                    onClick={() => runAction({ type: "open-empty-checkout" })}
                  >
                    Tentar abrir Checkout vazio
                  </button>
                  <div
                    className="sanity-empty-guard"
                    role="status"
                    hidden={!state.emptyGuard}
                  >
                    <strong>Adicione um item antes de continuar.</strong>
                    <p>
                      O Checkout não foi aberto. A loja manteve o cliente no
                      carrinho.
                    </p>
                  </div>
                </section>
              </div>
            </div>
            <section
              className="sanity-observation"
              aria-labelledby="sanity-observed-title"
              hidden={!actionDone}
            >
              <h3 id="sanity-observed-title">Resultado observado</h3>
              <p>{actionDone ? check.observed : ""}</p>
            </section>
            <form
              className="sanity-classification"
              id="sanity-classification"
              hidden={!actionDone}
              onSubmit={submitClassification}
            >
              <fieldset>
                <legend>Este check atendeu ao resultado esperado?</legend>
                <div>
                  <button
                    ref={classificationButtonRef}
                    type="submit"
                    name="classification"
                    value="pass"
                    disabled={recorded}
                  >
                    Passou
                  </button>
                  <button
                    type="submit"
                    name="classification"
                    value="fail"
                    disabled={recorded}
                  >
                    Falhou
                  </button>
                </div>
              </fieldset>
              <p
                className="sanity-feedback"
                role="status"
                aria-live="polite"
                hidden={!state.classificationFeedback}
              >
                {state.classificationFeedback}
              </p>
            </form>
            <button
              ref={nextButtonRef}
              className="button button--ghost sanity-next"
              type="button"
              hidden={!recorded}
              onClick={nextStep}
            >
              {state.step === SANITY_STEP_IDS.length - 1
                ? "Emitir parecer →"
                : "Continuar verificação →"}
            </button>
          </section>
          <aside
            className="sanity-panel sanity-report"
            aria-labelledby="sanity-report-title"
          >
            <span className="label label--cyan">EVIDÊNCIAS DA CANDIDATA</span>
            <h2 id="sanity-report-title">O que mudou de verdade?</h2>
            <p
              className="sanity-candidate-status"
              data-failed={String(Boolean(state.records.consistency))}
              role="status"
            >
              {state.records.consistency
                ? "FF-2026.10.1 · Total divergente. O 503 foi corrigido, mas esta candidata precisa voltar para ajuste."
                : state.records.open
                  ? "FF-2026.10.1 · O 503 não se reproduz. Continue as verificações próximas antes de emitir parecer sobre a candidata inteira."
                  : "FF-2026.10.1 · Aguardando verificações focadas."}
            </p>
            <div id="sanity-evidence" aria-live="polite">
              {recordCount ? (
                SANITY_STEP_IDS.filter((stepId) => state.records[stepId]).map(
                  (stepId) => (
                    <SanityEvidence key={stepId} state={state} id={stepId} />
                  ),
                )
              ) : (
                <p className="sanity-tip">
                  As evidências registradas poderão ser abertas aqui.
                </p>
              )}
            </div>
            {recordCount !== SANITY_STEP_IDS.length && (
              <p className="sanity-tip">
                Registre os quatro checks antes do parecer.
              </p>
            )}
            <form
              className="sanity-review"
              hidden={recordCount !== SANITY_STEP_IDS.length}
              onSubmit={submitReview}
            >
              <fieldset>
                <legend>
                  Qual é o parecer sobre a candidata inteira FF-2026.10.1?
                </legend>
                <label>
                  <input
                    type="radio"
                    name="decision"
                    value="accept"
                    required
                    checked={state.decision === "accept"}
                    onChange={() =>
                      dispatch({
                        type: "set-review",
                        field: "decision",
                        value: "accept",
                      })
                    }
                  />
                  Aceitar a candidata inteira: todos os checks focados atendem
                  ao esperado
                </label>
                <label>
                  <input
                    ref={reviewDecisionRef}
                    type="radio"
                    name="decision"
                    value="return"
                    required
                    checked={state.decision === "return"}
                    onChange={() =>
                      dispatch({
                        type: "set-review",
                        field: "decision",
                        value: "return",
                      })
                    }
                  />
                  Devolver a candidata para ajuste: a divergência no total
                  impede aceitá-la
                </label>
              </fieldset>
              <fieldset>
                <legend>
                  Qual evidência define se a candidata inteira pode ser aceita?
                </legend>
                <label>
                  <input
                    type="radio"
                    name="reason"
                    value="http"
                    required
                    checked={state.reason === "http"}
                    onChange={() =>
                      dispatch({
                        type: "set-review",
                        field: "reason",
                        value: "http",
                      })
                    }
                  />{" "}
                  O Checkout ainda retorna 503 e não abre.
                </label>
                <label>
                  <input
                    type="radio"
                    name="reason"
                    value="total"
                    required
                    checked={state.reason === "total"}
                    onChange={() =>
                      dispatch({
                        type: "set-review",
                        field: "reason",
                        value: "total",
                      })
                    }
                  />{" "}
                  O Checkout abre, mas o total difere do carrinho sem uma taxa
                  contratada.
                </label>
                <label>
                  <input
                    type="radio"
                    name="reason"
                    value="regression"
                    required
                    checked={state.reason === "regression"}
                    onChange={() =>
                      dispatch({
                        type: "set-review",
                        field: "reason",
                        value: "regression",
                      })
                    }
                  />{" "}
                  Era obrigatório executar toda a regressão para validar esta
                  correção.
                </label>
              </fieldset>
              <p
                className="sanity-feedback"
                role="status"
                aria-live="polite"
                hidden={!state.reviewFeedback}
              >
                {state.reviewFeedback}
              </p>
              <button className="button button--primary" type="submit">
                Concluir Sanidade com parecer
              </button>
            </form>
          </aside>
        </section>
      </div>
      {state.finished && (
        <section
          className="sanity-result sanity-panel"
          aria-labelledby="sanity-result-title"
        >
          <span className="label label--cyan">
            MISSÃO CONCLUÍDA · PARECER CORRETO
          </span>
          <h2 ref={resultTitleRef} id="sanity-result-title" tabIndex="-1">
            O 503 foi corrigido; a candidata precisa de ajuste.
          </h2>
          <p>
            <strong>Verificação do defeito original: passou.</strong> O Checkout
            abriu e o HTTP 503 não se reproduziu.
            <strong>Parecer sobre a candidata: reprovada na Sanidade.</strong> O
            total divergiu do carrinho sem taxa contratada, então a FF-2026.10.1
            deve voltar para ajuste.
            <strong>Missão: concluída corretamente</strong> ao identificar essa
            diferença e justificar a devolução. O parecer vale para esta versão;
            não reprova a Fikily como produto.
          </p>
          <div className="sanity-result__stats">
            <div>
              <span>CHECKS</span>
              <strong>4 / 4</strong>
            </div>
            <div>
              <span>INCONSISTÊNCIA</span>
              <strong>1</strong>
            </div>
            <div>
              <span>NESTA TENTATIVA</span>
              <strong>{score} XP</strong>
            </div>
          </div>
          <p>
            {savedProgress
              ? `Melhor resultado: ${savedProgress.bestXp} XP · Tentativas concluídas: ${savedProgress.attempts} · XP compartilhado: ${savedProgress.totalXp}.`
              : "A missão foi concluída em modo somente leitura e o resultado não foi salvo."}
          </p>
          <qa-save-status ref={saveStatusRef}></qa-save-status>
          {saveBlocked && (
            <SanityReadOnlyNotice role="status" aria-live="polite">
              O resultado desta tentativa não foi salvo porque o progresso
              pertence a uma versão mais recente.
            </SanityReadOnlyNotice>
          )}
          <details
            id="sanity-result-evidence"
            className="sanity-result__evidence"
          >
            <summary>Revisar as quatro evidências</summary>
            <div>
              {SANITY_STEP_IDS.map((stepId) => (
                <SanityEvidence key={stepId} state={state} id={stepId} />
              ))}
            </div>
          </details>
          <p className="sanity-learning">
            A correção específica do 503 passou, mas isso não aprova a candidata
            inteira: o total divergente exige ajuste e nova validação focada.
            Smoke verifica rapidamente os fluxos essenciais da versão; E2E
            acompanha uma jornada completa. Depois de corrigir os impedimentos,
            a regressão verifica funcionalidades que já funcionavam. Concluir
            esta missão registra o acerto do seu parecer, não a aprovação da
            versão para produção.
          </p>
          <div className="sanity-result__actions">
            <button
              className="button button--primary"
              type="button"
              onClick={restartMission}
            >
              Repetir missão
            </button>
            <a className="button button--ghost" href="tracks.html">
              Voltar às trilhas
            </a>
          </div>
        </section>
      )}
    </SanityRoot>
  );
}

export function mountSanity(element) {
  createRoot(element).render(<Sanity />);
}
