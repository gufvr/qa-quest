import React, { useEffect, useReducer, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  createInitialRegressionState,
  getRegressionCaseStatus,
  getRegressionCheck,
  getRegressionScore,
  REGRESSION_CASES,
  REGRESSION_PRODUCTS,
  REGRESSION_UNIT_PRICE_CENTS,
  regressionTestReducer,
} from "../../../core/regression-test.js";
import {
  RegressionReadOnlyNotice,
  RegressionRoot,
} from "./Regression.styles.js";

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

function RegressionEvidence({ state, id }) {
  const check = getRegressionCheck(state, id);
  return (
    <details
      className="regression-evidence-item"
      data-outcome={check.outcome}
      key={id}
    >
      <summary>
        <strong>
          {check.title} · {check.outcome === "pass" ? "Passou" : "Falhou"}
        </strong>
      </summary>
      {[
        ["Antes · FF-2026.09", check.baseline],
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

function Regression() {
  const [state, dispatch] = useReducer(
    regressionTestReducer,
    undefined,
    createInitialRegressionState,
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
  const id = REGRESSION_CASES[state.step].id;
  const check = getRegressionCheck(state, id);
  const actionDone = state.actions.includes(id);
  const recorded = Boolean(state.records[id]);
  const recordCount = Object.keys(state.records).length;
  const score = getRegressionScore(state);
  const cartTotal =
    state.cart?.total ?? state.quantity * REGRESSION_UNIT_PRICE_CENTS;
  const filterLabel =
    state.filter === "accessories"
      ? "Acessórios"
      : state.filter === "technology"
        ? "Tecnologia"
        : "Todas";

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
    const nextState = regressionTestReducer(state, action);
    if (
      nextState.actions.length > state.actions.length &&
      action.type !== "classify"
    )
      pendingClassificationFocus.current = true;
    dispatch(action);
  }

  function submitCheckout(event) {
    event.preventDefault();
    if (state.finished || !progress.isTracksUnlocked()) {
      setAccess(readAccess());
      return;
    }
    const nextState = regressionTestReducer(state, {
      type: "submit-checkout",
    });
    if (nextState.fieldValidity && !nextState.actions.includes("checkout")) {
      const field = ["address", "cep", "payment"].find(
        (name) => !nextState.fieldValidity[name],
      );
      const inputId =
        field === "address"
          ? "regression-address-input"
          : field === "cep"
            ? "regression-cep"
            : "regression-payment";
      document.getElementById(inputId)?.focus();
    } else if (nextState.actions.includes("checkout")) {
      pendingClassificationFocus.current = true;
    }
    dispatch({ type: "submit-checkout" });
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
    const nextState = regressionTestReducer(state, action);
    if (!state.records[id] && nextState.records[id])
      pendingNextFocus.current = true;
    dispatch(action);
  }

  function nextCase() {
    if (state.finished || !progress.isTracksUnlocked()) {
      setAccess(readAccess());
      return;
    }
    if (state.step < REGRESSION_CASES.length - 1)
      dispatch({ type: "next-case" });
    else reviewDecisionRef.current?.focus();
  }

  function submitReview(event) {
    event.preventDefault();
    if (!progress.isTracksUnlocked()) {
      setAccess(readAccess());
      return;
    }
    const nextState = regressionTestReducer(state, { type: "submit-review" });
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
            "regression",
            getRegressionScore(nextState),
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
      <RegressionRoot>
        <section
          className="regression-locked"
          aria-labelledby="regression-locked-title"
        >
          <span className="label label--cyan">BASE COMUM</span>
          <h1 id="regression-locked-title">
            Conclua a Fase 4 para iniciar esta missão.
          </h1>
          <p>
            Smoke, Sanidade e outras trilhas não são pré-requisitos. O contexto
            necessário está incluído aqui.
          </p>
          <a
            className="button button--primary"
            href={access.phase4Available ? "phase4.html" : "index.html"}
          >
            {access.phase4Available ? "Continuar Fase 4" : "Voltar à jornada"}
          </a>
        </section>
      </RegressionRoot>
    );

  return (
    <RegressionRoot>
      {access.readOnly && (
        <RegressionReadOnlyNotice role="status" aria-live="polite">
          O progresso pertence a uma versão mais recente. Você pode concluir a
          missão, mas o resultado não será salvo.
        </RegressionReadOnlyNotice>
      )}
      <div id="regression-content" hidden={state.finished}>
        <header className="regression-intro">
          <div>
            <span className="label label--cyan">
              TRILHA 02 · CONFIANÇA NA RELEASE
            </span>
            <h1>O que continua funcionando?</h1>
          </div>
          <p>
            O Checkout foi corrigido. Repita cinco casos conhecidos para
            descobrir se as mudanças afetaram outros comportamentos da Fikily.
          </p>
        </header>
        <section
          className="regression-briefing"
          aria-labelledby="regression-briefing-title"
        >
          <div>
            <span className="label">
              CANDIDATA FF-2026.10.2 · SIMULAÇÃO LOCAL
            </span>
            <h2 id="regression-briefing-title">
              Uma correção pode afetar outras áreas.
            </h2>
            <p>
              Na FF-2026.10, o Checkout retornava 503. A Sanidade da
              FF-2026.10.1 confirmou a abertura, mas encontrou R$ 15,00 a mais
              no total. A equipe informa que a FF-2026.10.2 corrige esse
              cálculo. Agora, compare os comportamentos com a última execução
              aprovada desta suíte, na FF-2026.09, anterior às mudanças.
            </p>
            <details className="regression-concepts">
              <summary>Por que esta missão é Regressão?</summary>
              <p>
                <strong>Regressão</strong> repete cenários conhecidos para
                verificar comportamentos que já funcionavam. Aqui, cada caso tem
                uma referência anterior aprovada.
              </p>
              <p>
                <strong>Smoke</strong> verifica rapidamente a disponibilidade
                dos fluxos essenciais. <strong>Sanidade</strong> confirma uma
                correção e seus efeitos próximos. <strong>E2E</strong> acompanha
                uma jornada integrada completa. Uma mesma verificação pode
                integrar mais de um desses escopos; o objetivo desta rodada é
                comparar comportamentos ao longo das versões.
              </p>
            </details>
          </div>
          <aside className="regression-scoring">
            <strong>Até 100 XP</strong>
            <p>
              5 execuções × 8 XP
              <br />
              5 classificações × 8 XP
              <br />
              Parecer: 10 XP
              <br />
              Justificativa: 10 XP
            </p>
            <small>
              Uma resposta corrigida vale metade dos pontos daquele item.
              Repetir preserva o melhor XP.
            </small>
          </aside>
        </section>
        <section
          className="regression-workspace"
          aria-label="Bancada de Teste de Regressão"
        >
          <aside className="regression-panel regression-checklist">
            <span className="label label--cyan">SUÍTE CONHECIDA</span>
            <h2>Cinco casos de proteção.</h2>
            <div className="regression-count">
              <span>Casos registrados</span>
              <strong>{recordCount} / 5</strong>
            </div>
            <div
              id="regression-progress"
              role="progressbar"
              aria-label="Casos registrados"
              aria-valuemin="0"
              aria-valuemax="5"
              aria-valuenow={recordCount}
            >
              <i
                id="regression-bar"
                style={{ width: `${recordCount * 20}%` }}
              ></i>
            </div>
            <ol id="regression-steps">
              {REGRESSION_CASES.map((item, index) => {
                const itemRecord = state.records[item.id];
                return (
                  <li
                    key={item.id}
                    aria-current={index === state.step ? "step" : undefined}
                    data-outcome={
                      itemRecord
                        ? getRegressionCheck(state, item.id).outcome
                        : undefined
                    }
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{getRegressionCaseStatus(state, item.id)}</small>
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="regression-tip">
              Cada caso prepara seus dados de teste. Uma falha não impede
              executar os outros casos isolados para mapear o impacto. Isso não
              libera a candidata.
            </p>
          </aside>
          <section
            className="regression-panel regression-lab"
            aria-labelledby="regression-check-title"
          >
            <header className="regression-lab-heading">
              <span className="label">
                CASO REG-0{state.step + 1} · REPETIR E COMPARAR
              </span>
              <h2 ref={checkTitleRef} id="regression-check-title" tabIndex="-1">
                {check.title}
              </h2>
              <p>{check.instruction}</p>
              <div className="regression-baseline">
                <strong>ANTES · FF-2026.09 · PASSOU</strong>
                <p>{check.baseline}</p>
              </div>
              <p className="regression-expected">
                <strong>Esperado agora:</strong> {check.expected}
              </p>
            </header>
            <div className="regression-browser" aria-label="Fikily fictícia">
              <div className="regression-browser-bar">
                <span aria-hidden="true">● ● ●</span>
                <span id="regression-address">fikily.test/{check.path}</span>
                <small>Simulado</small>
              </div>
              <header className="regression-store-nav">
                <strong>
                  <b>F</b> Fikily
                </strong>
                <span>FF-2026.10.2</span>
              </header>
              <div className="regression-store">
                <section data-regression-view="login" hidden={id !== "login"}>
                  <span className="regression-kicker">CASO REG-01</span>
                  <h3>Acesse sua conta.</h3>
                  <p className="regression-store-note">
                    Conta de teste: qa@fikily.test · Senha: Fvr123!
                  </p>
                  <form
                    hidden={state.loginComplete}
                    noValidate
                    onSubmit={(event) => {
                      event.preventDefault();
                      runAction({ type: "submit-login" });
                    }}
                  >
                    <label className="regression-field">
                      E-mail fictício
                      <input
                        type="email"
                        autoComplete="off"
                        maxLength="80"
                        value={state.email}
                        disabled={actionDone}
                        onChange={(event) =>
                          dispatch({
                            type: "set-login",
                            field: "email",
                            value: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="regression-field">
                      Senha de teste
                      <input
                        type="password"
                        autoComplete="off"
                        maxLength="80"
                        value={state.password}
                        disabled={actionDone}
                        onChange={(event) =>
                          dispatch({
                            type: "set-login",
                            field: "password",
                            value: event.target.value,
                          })
                        }
                      />
                    </label>
                    <p
                      className="regression-store-message"
                      role="status"
                      hidden={!state.loginFeedback}
                    >
                      {state.loginFeedback}
                    </p>
                    <button
                      className="regression-store-button"
                      type="submit"
                      disabled={actionDone}
                    >
                      Entrar na conta de teste
                    </button>
                  </form>
                  {state.loginComplete && (
                    <div className="regression-store-message" role="status">
                      <strong>Painel carregado · Acesso autorizado</strong>
                      <p>
                        Olá, Pessoa de teste. Seus pedidos e endereços estão
                        disponíveis no painel.
                      </p>
                    </div>
                  )}
                </section>
                <section
                  data-regression-view="catalog"
                  hidden={id !== "catalog"}
                >
                  <span className="regression-kicker">CASO REG-02</span>
                  <h3>Encontre uma mochila.</h3>
                  <form
                    noValidate
                    onSubmit={(event) => {
                      event.preventDefault();
                      runAction({ type: "submit-search" });
                    }}
                  >
                    <label className="regression-field">
                      Busca
                      <input
                        type="search"
                        placeholder="Digite Mochila"
                        maxLength="40"
                        value={state.search}
                        readOnly={state.searched}
                        onChange={(event) =>
                          dispatch({
                            type: "set-search",
                            value: event.target.value,
                          })
                        }
                      />
                    </label>
                    <button
                      className="regression-store-button"
                      type="submit"
                      disabled={state.searched || actionDone}
                    >
                      Buscar produtos
                    </button>
                  </form>
                  <p
                    className="regression-store-message"
                    role="status"
                    hidden={!state.catalogFeedback}
                  >
                    {state.catalogFeedback}
                  </p>
                  {state.searched && (
                    <div>
                      <label className="regression-field">
                        Categoria
                        <select
                          value={state.filter}
                          disabled={actionDone}
                          onChange={(event) =>
                            dispatch({
                              type: "set-filter",
                              value: event.target.value,
                            })
                          }
                        >
                          <option value="all">Todas</option>
                          <option value="accessories">Acessórios</option>
                          <option value="technology">Tecnologia</option>
                        </select>
                      </label>
                      <ul className="regression-products">
                        {REGRESSION_PRODUCTS.map((product) => (
                          <li key={product.category}>
                            <strong>{product.name}</strong>
                            <span>
                              {product.label} · {money(product.price)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="regression-store-note" role="status">
                        Categoria: {filterLabel} · 2 resultados
                      </p>
                      <button
                        className="regression-store-button"
                        type="button"
                        disabled={actionDone}
                        onClick={() => runAction({ type: "check-filter" })}
                      >
                        Conferir resultados do filtro
                      </button>
                    </div>
                  )}
                </section>
                <section data-regression-view="cart" hidden={id !== "cart"}>
                  <span className="regression-kicker">
                    CASO REG-03 · CARRINHO PREPARADO PARA ESTE TESTE
                  </span>
                  <h3>Atualize o carrinho.</h3>
                  <p className="regression-store-note">
                    Mochila Urbana · R$ 189,90 por unidade · Frete grátis
                  </p>
                  <button
                    className="regression-store-button"
                    type="button"
                    disabled={state.cartAdded || actionDone}
                    onClick={() => runAction({ type: "add-product" })}
                  >
                    Adicionar Mochila Urbana
                  </button>
                  {!state.cartAdded && (
                    <p className="regression-store-note">Carrinho vazio.</p>
                  )}
                  {state.cartAdded && (
                    <div>
                      <label className="regression-field">
                        Quantidade
                        <select
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
                      <div className="regression-total">
                        <span>Total do carrinho</span>
                        <strong>{money(cartTotal)}</strong>
                      </div>
                      <button
                        className="regression-store-button"
                        type="button"
                        disabled={actionDone}
                        onClick={() => runAction({ type: "check-cart" })}
                      >
                        Conferir quantidade e total
                      </button>
                    </div>
                  )}
                  <p
                    className="regression-store-message"
                    role="status"
                    hidden={!state.cartFeedback}
                  >
                    {state.cartFeedback}
                  </p>
                </section>
                <section
                  data-regression-view="checkout"
                  hidden={id !== "checkout"}
                >
                  <span className="regression-kicker">
                    CASO REG-04 · CHECKOUT PREPARADO
                  </span>
                  <h3>Confira a correção.</h3>
                  <p className="regression-store-note">
                    Este caso usa uma cópia do carrinho registrado, sem executar
                    uma compra real.
                  </p>
                  <p className="regression-store-message">
                    200 OK · Entrega e pagamento carregados
                  </p>
                  <div className="regression-reference">
                    <span>Carrinho de referência</span>
                    <strong>
                      {state.cart &&
                        `${state.cart.quantity} × Mochila Urbana · ${money(state.cart.total)}`}
                    </strong>
                  </div>
                  <form noValidate onSubmit={submitCheckout}>
                    <label className="regression-field">
                      Endereço fictício
                      <input
                        id="regression-address-input"
                        autoComplete="off"
                        placeholder="Rua Fikily, 101"
                        maxLength="160"
                        value={state.address}
                        readOnly={actionDone}
                        aria-invalid={
                          state.fieldValidity
                            ? String(!state.fieldValidity.address)
                            : undefined
                        }
                        onChange={(event) =>
                          dispatch({
                            type: "set-checkout-field",
                            field: "address",
                            value: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="regression-field">
                      CEP fictício
                      <input
                        id="regression-cep"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="01001-000"
                        maxLength="9"
                        value={state.cep}
                        readOnly={actionDone}
                        aria-invalid={
                          state.fieldValidity
                            ? String(!state.fieldValidity.cep)
                            : undefined
                        }
                        onChange={(event) =>
                          dispatch({
                            type: "set-checkout-field",
                            field: "cep",
                            value: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="regression-field">
                      Pagamento simulado
                      <select
                        id="regression-payment"
                        value={state.payment}
                        disabled={actionDone}
                        aria-invalid={
                          state.fieldValidity
                            ? String(!state.fieldValidity.payment)
                            : undefined
                        }
                        onChange={(event) =>
                          dispatch({
                            type: "set-checkout-field",
                            field: "payment",
                            value: event.target.value,
                          })
                        }
                      >
                        <option value="">Selecione</option>
                        <option value="pix">Pix de teste</option>
                        <option value="card">
                          Cartão de teste · final 4242
                        </option>
                      </select>
                    </label>
                    <p className="regression-store-note">
                      Frete grátis · Taxas adicionais: R$ 0,00
                    </p>
                    <div className="regression-total">
                      <span>Total no Checkout</span>
                      <strong>{state.cart && money(state.cart.total)}</strong>
                    </div>
                    <p
                      className="regression-store-message"
                      role="status"
                      hidden={!state.checkoutFeedback}
                    >
                      {state.checkoutFeedback}
                    </p>
                    <button
                      className="regression-store-button"
                      type="submit"
                      disabled={actionDone}
                    >
                      Conferir entrega, pagamento e total
                    </button>
                  </form>
                </section>
                <section
                  data-regression-view="history"
                  hidden={id !== "history"}
                >
                  <span className="regression-kicker">
                    CASO REG-05 · PEDIDO ISOLADO DE TESTE
                  </span>
                  <h3>Compare a confirmação.</h3>
                  <p className="regression-store-note">
                    Crie um pedido apenas nesta simulação, com os dados de teste
                    preparados. Nenhum pagamento é processado e a candidata
                    continua sem aprovação.
                  </p>
                  <button
                    className="regression-store-button"
                    type="button"
                    disabled={Boolean(state.order) || actionDone}
                    onClick={() => runAction({ type: "create-order" })}
                  >
                    Criar pedido de teste local
                  </button>
                  {state.order && (
                    <div>
                      <div className="regression-reference">
                        <span>Confirmação · FF-REG-1042</span>
                        <strong>
                          {state.order.quantity} × Mochila Urbana ·{" "}
                          {money(state.order.total)} · {state.order.payment}
                        </strong>
                      </div>
                      <div className="regression-reference">
                        <span>Histórico · FF-REG-1042 · Confirmado</span>
                        <strong>
                          {state.order.quantity} × Mochila Urbana ·{" "}
                          {money(state.order.total)} · {state.order.payment}
                        </strong>
                      </div>
                      <button
                        className="regression-store-button"
                        type="button"
                        disabled={actionDone}
                        onClick={() => runAction({ type: "check-history" })}
                      >
                        Conferir histórico com a confirmação
                      </button>
                    </div>
                  )}
                </section>
              </div>
            </div>
            <section
              className="regression-observation"
              aria-labelledby="regression-observed-title"
              hidden={!actionDone}
            >
              <h3 id="regression-observed-title">Resultado observado</h3>
              <p>{actionDone ? check.observed : ""}</p>
            </section>
            <form
              className="regression-classification"
              hidden={!actionDone}
              onSubmit={submitClassification}
            >
              <fieldset>
                <legend>O comportamento conhecido foi preservado?</legend>
                <div>
                  <button
                    ref={classificationButtonRef}
                    type="submit"
                    value="pass"
                    disabled={recorded}
                  >
                    Passou
                  </button>
                  <button type="submit" value="fail" disabled={recorded}>
                    Falhou
                  </button>
                </div>
              </fieldset>
              <p
                className="regression-feedback"
                role="status"
                hidden={!state.classificationFeedback}
              >
                {state.classificationFeedback}
              </p>
            </form>
            <button
              ref={nextButtonRef}
              className="button button--ghost regression-next"
              type="button"
              hidden={!recorded}
              onClick={nextCase}
            >
              {state.step === REGRESSION_CASES.length - 1
                ? "Emitir parecer →"
                : "Próximo caso →"}
            </button>
          </section>
          <aside className="regression-panel regression-report">
            <span className="label label--cyan">PARECER DA CANDIDATA</span>
            <h2>Qual comportamento regrediu?</h2>
            <p
              className="regression-status"
              data-failed={String(Boolean(state.records.catalog))}
              role="status"
            >
              {state.records.catalog
                ? "FF-2026.10.2 · Regressão no filtro registrada. Continue os casos isolados para mapear o impacto; a candidata permanece sem aprovação."
                : `FF-2026.10.2 · ${recordCount} de 5 casos registrados. Parecer pendente.`}
            </p>
            <div id="regression-evidence" aria-live="polite">
              {recordCount ? (
                REGRESSION_CASES.filter((item) => state.records[item.id]).map(
                  (item) => (
                    <RegressionEvidence
                      key={item.id}
                      state={state}
                      id={item.id}
                    />
                  ),
                )
              ) : (
                <p className="regression-tip">
                  Suas evidências aparecerão aqui com antes, esperado, observado
                  e impacto.
                </p>
              )}
            </div>
            {recordCount !== REGRESSION_CASES.length && (
              <p className="regression-tip">
                Registre os cinco casos antes de emitir o parecer.
              </p>
            )}
            <form
              className="regression-review"
              hidden={recordCount !== REGRESSION_CASES.length}
              onSubmit={submitReview}
            >
              <fieldset>
                <legend>
                  Qual é o parecer sobre a FF-2026.10.2 nesta suíte?
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
                  Aprovar a candidata na regressão: todos os cinco casos
                  passaram.
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
                  Reprovar a candidata na regressão e devolver para investigação
                  ou ajuste.
                </label>
              </fieldset>
              <fieldset>
                <legend>Qual evidência justifica seu parecer?</legend>
                <label>
                  <input
                    type="radio"
                    name="reason"
                    value="filter"
                    required
                    checked={state.reason === "filter"}
                    onChange={() =>
                      dispatch({
                        type: "set-review",
                        field: "reason",
                        value: "filter",
                      })
                    }
                  />
                  O filtro funcionava na referência anterior, mas agora mantém
                  produtos fora da categoria selecionada.
                </label>
                <label>
                  <input
                    type="radio"
                    name="reason"
                    value="checkout"
                    required
                    checked={state.reason === "checkout"}
                    onChange={() =>
                      dispatch({
                        type: "set-review",
                        field: "reason",
                        value: "checkout",
                      })
                    }
                  />
                  O Checkout continua com 503 e R$ 15,00 indevidos.
                </label>
                <label>
                  <input
                    type="radio"
                    name="reason"
                    value="production"
                    required
                    checked={state.reason === "production"}
                    onChange={() =>
                      dispatch({
                        type: "set-review",
                        field: "reason",
                        value: "production",
                      })
                    }
                  />
                  Quatro casos passaram, então a aplicação está aprovada para
                  produção.
                </label>
              </fieldset>
              <p
                className="regression-feedback"
                role="status"
                hidden={!state.reviewFeedback}
              >
                {state.reviewFeedback}
              </p>
              <button className="button button--primary" type="submit">
                Concluir missão com parecer
              </button>
            </form>
          </aside>
        </section>
      </div>
      {state.finished && (
        <section
          className="regression-result regression-panel"
          aria-labelledby="regression-result-title"
        >
          <span className="label label--cyan">
            MISSÃO CONCLUÍDA · PARECER CORRETO
          </span>
          <h2 ref={resultTitleRef} id="regression-result-title" tabIndex="-1">
            Checkout corrigido. Filtro com regressão.
          </h2>
          <p>
            Login, Carrinho, Checkout e Histórico passaram. O filtro funcionava
            na referência anterior e falhou na candidata FF-2026.10.2. A suíte
            de regressão reprovou esta candidata: investigue a mudança e ajuste
            o comportamento antes de uma nova rodada.
          </p>
          <div className="regression-result-stats">
            <div>
              <span>CASOS</span>
              <strong>5 / 5</strong>
            </div>
            <div>
              <span>FALHAS</span>
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
            <RegressionReadOnlyNotice role="status" aria-live="polite">
              O resultado desta tentativa não foi salvo porque o progresso
              pertence a uma versão mais recente.
            </RegressionReadOnlyNotice>
          )}
          <details
            id="regression-result-evidence"
            className="regression-result-evidence"
          >
            <summary>Revisar as cinco evidências</summary>
            <div>
              {REGRESSION_CASES.map((item) => (
                <RegressionEvidence key={item.id} state={state} id={item.id} />
              ))}
            </div>
          </details>
          <p className="regression-learning">
            Você concluiu corretamente ao encontrar e justificar a regressão.
            Corrigir o Checkout não garante que outros comportamentos estejam
            preservados. A comparação entre versões demonstra a mudança no
            filtro; investigar a causa raiz ainda exige trabalho da equipe.
            Concluir a missão ou aprovar uma suíte isolada não representa
            aprovação para produção.
          </p>
          <div className="regression-result-actions">
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
    </RegressionRoot>
  );
}

export function mountRegression(element) {
  createRoot(element).render(<Regression />);
}
