import React, { useEffect, useReducer, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ANA,
  BRUNO,
  createInitialSecurityState,
  getSecurityScore,
  getSecuritySnapshot,
  SECURITY_ADDRESSES,
  SECURITY_CASES,
  securityLabReducer,
} from "../../../core/security-lab.js";
import { SecurityReadOnlyNotice, SecurityRoot } from "./Security.styles.js";

const progress = window.QAQuestProgress;

function readAccess() {
  return {
    tracksUnlocked: progress.isTracksUnlocked(),
    phase4Available: progress.isPhaseUnlocked(4),
    readOnly: progress.isReadOnly(),
  };
}

function ForeignOrder({ address }) {
  return (
    <div>
      <h4>Detalhe do Pedido · {BRUNO.order}</h4>
      <dl>
        {[
          ["Titular", BRUNO.name],
          ["Conta", BRUNO.email],
          ["Item", BRUNO.item],
          ["Total", BRUNO.total],
          ["Entrega", address],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="security-store-note">
        Dados fictícios exibidos para a sessão de Ana.
      </p>
    </div>
  );
}

function SecurityEvidence({ state, id }) {
  const test = SECURITY_CASES.find((item) => item.id === id);
  const data = state.executions[id];
  return (
    <details
      className="security-evidence-item"
      data-finding={String(id !== "own")}
    >
      <summary>
        {test.title} ·{" "}
        {state.records[id]
          ? id === "own"
            ? "Controle correto"
            : "Achado confirmado"
          : "Classificação pendente"}
      </summary>
      {[
        ["Sessão / identidade", data.identity],
        ["Ação", data.action],
        ["Esperado", test.expected],
        ["Observado", data.observed],
        ["Controle", test.control],
        ["Impacto", data.impact],
      ].map(([label, value]) => (
        <p key={label}>
          <b>{label}: </b>
          {value}
        </p>
      ))}
    </details>
  );
}

function Security() {
  const [state, dispatch] = useReducer(
    securityLabReducer,
    undefined,
    createInitialSecurityState,
  );
  const [access, setAccess] = useState(readAccess);
  const [savedProgress, setSavedProgress] = useState(null);
  const [saveBlocked, setSaveBlocked] = useState(false);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const conceptRef = useRef(null);
  const checkTitleRef = useRef(null);
  const classificationRef = useRef(null);
  const nextRef = useRef(null);
  const reviewTitleRef = useRef(null);
  const resultTitleRef = useRef(null);
  const saveStatusRef = useRef(null);
  const previousStepRef = useRef(state.step);
  const test = SECURITY_CASES[state.step];
  const executed = Boolean(state.executions[test.id]);
  const recorded = Boolean(state.records[test.id]);
  const recordCount = Object.keys(state.records).length;
  const score = getSecurityScore(state);

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

  function finishConcept(event) {
    event.preventDefault();
    if (!progress.isTracksUnlocked()) {
      setAccess(readAccess());
      return;
    }
    const value = new FormData(event.currentTarget).get("concept");
    dispatch({ type: "submit-concept", value });
  }

  function submitClassification(event) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("classification");
    dispatch({ type: "classify", value });
  }

  function nextCase() {
    if (state.step < SECURITY_CASES.length - 1) dispatch({ type: "next" });
    else reviewTitleRef.current?.focus();
  }

  function submitAddress(event) {
    event.preventDefault();
    if (!state.selectedAddress) return;
    dispatch({ type: "execute", id: "write" });
  }

  function finishReview(event) {
    event.preventDefault();
    if (!progress.isTracksUnlocked()) {
      setAccess(readAccess());
      return;
    }
    const nextState = securityLabReducer(state, { type: "submit-review" });
    if (nextState.finished && !state.finished) {
      setSaveBlocked(false);
      setSavedProgress(null);
      saveStatusRef.current?.reset();
      if (progress.isReadOnly()) {
        setSaveBlocked(true);
        setAccess(readAccess());
      } else {
        let result;
        try {
          result = progress.saveMissionResult(
            "security",
            getSecurityScore(nextState),
          );
        } catch (error) {
          if (!progress.isReadOnly()) throw error;
          setSaveBlocked(true);
          setAccess(readAccess());
        }
        if (result) setSavedProgress(result);
      }
    }
    dispatch({ type: "submit-review" });
  }

  function restartMission() {
    setSavedProgress(null);
    setSaveBlocked(false);
    setAttemptNumber((current) => current + 1);
    saveStatusRef.current?.reset();
    dispatch({ type: "restart" });
  }

  if (!access.tracksUnlocked)
    return (
      <SecurityRoot>
        <section
          className="security-locked"
          aria-labelledby="security-locked-title"
        >
          <span className="label label--cyan">BASE COMUM</span>
          <h1 id="security-locked-title">
            Conclua a Fase 4 para iniciar esta missão.
          </h1>
          <p>
            Segurança independe de Performance e das outras trilhas. O contexto
            necessário está incluído aqui.
          </p>
          <a
            className="button button--primary"
            href={access.phase4Available ? "phase4.html" : "index.html"}
          >
            {access.phase4Available ? "Continuar Fase 4" : "Voltar à jornada"}
          </a>
        </section>
      </SecurityRoot>
    );

  const reviewVisible =
    recordCount === SECURITY_CASES.length &&
    state.step === SECURITY_CASES.length - 1 &&
    recorded;

  return (
    <SecurityRoot>
      {access.readOnly && (
        <SecurityReadOnlyNotice role="status" aria-live="polite">
          O progresso pertence a uma versão mais recente. Você pode concluir a
          missão, mas o resultado não será salvo.
        </SecurityReadOnlyNotice>
      )}
      <div id="security-content" hidden={state.finished}>
        <header className="security-intro">
          <div>
            <span className="label label--cyan">
              TRILHA 03 · QUALIDADE ESPECIALIZADA
            </span>
            <h1>Quem pode acessar o quê?</h1>
          </div>
          <p>
            Entre com uma conta de teste, confira os limites de acesso e
            fundamente seu parecer com evidências.
          </p>
        </header>
        <section
          className="security-panel security-briefing"
          aria-labelledby="security-briefing-title"
        >
          <div>
            <span className="label">FIKILY · CANDIDATA FF-2026.11.1</span>
            <h2 id="security-briefing-title">
              Entrar é apenas o primeiro controle.
            </h2>
            <p>
              Ana Lima e Bruno Costa são personagens fictícios. O time precisa
              confirmar que cada conta acessa apenas os próprios pedidos.
            </p>
            <div className="security-accounts">
              <p>
                <strong>Ana Lima</strong>
                <span>{ANA.email}</span>
                <span>Pedido {ANA.order}</span>
              </p>
              <p>
                <strong>Bruno Costa</strong>
                <span>{BRUNO.email}</span>
                <span>Pedido {BRUNO.order}</span>
              </p>
            </div>
            <p className="security-note">
              Todos os dados são fictícios. As ações acontecem apenas nesta
              tela, sem requisições à Fikily.
            </p>
          </div>
          <aside className="security-scoring">
            <strong>Até 100 XP</strong>
            <p>
              Conceito: 10
              <br />
              Execuções: 10 + 5 + 5 + 10
              <br />4 classificações: 40
              <br />
              Parecer + justificativa: 20
            </p>
          </aside>
        </section>
        {!state.concept && (
          <section className="security-panel security-concept-panel">
            <form onSubmit={finishConcept}>
              <fieldset>
                <legend>
                  Qual é a diferença entre autenticação e autorização?
                </legend>
                <label>
                  <input
                    type="radio"
                    name="concept"
                    value="identity"
                    required
                  />{" "}
                  Autenticação confirma a identidade; autorização limita os
                  dados e ações permitidos para essa identidade.
                </label>
                <label>
                  <input
                    type="radio"
                    name="concept"
                    value="performance"
                    required
                  />{" "}
                  Autenticação mede tempo de resposta; autorização conta
                  requisições.
                </label>
                <label>
                  <input
                    type="radio"
                    name="concept"
                    value="regression"
                    required
                  />{" "}
                  Autenticação repete cenários conhecidos; autorização compara
                  versões.
                </label>
              </fieldset>
              <p
                className="security-feedback"
                role="status"
                hidden={!state.conceptFeedback}
              >
                {state.conceptFeedback}
              </p>
              <button className="button button--primary" type="submit">
                Começar a revisão
              </button>
            </form>
          </section>
        )}
        {state.concept && (
          <section
            className="security-workspace"
            aria-label="Bancada de segurança"
          >
            <aside className="security-panel security-checklist">
              <span className="label label--cyan">QUATRO CENÁRIOS</span>
              <h2>Identidade, permissão e dados.</h2>
              <p className="security-counter">
                Evidências classificadas <strong>{recordCount} / 4</strong>
              </p>
              <div
                role="progressbar"
                aria-label="Evidências classificadas"
                aria-valuemin="0"
                aria-valuemax="4"
                aria-valuenow={recordCount}
              >
                <i
                  id="security-bar"
                  style={{ width: `${(recordCount / 4) * 100}%` }}
                ></i>
              </div>
              <ol id="security-steps">
                {SECURITY_CASES.map((item, index) => (
                  <li
                    key={item.id}
                    aria-current={index === state.step ? "step" : undefined}
                  >
                    <strong>
                      {String(index + 1).padStart(2, "0")} · {item.title}
                    </strong>
                    <small>
                      {state.records[item.id]
                        ? item.id === "own"
                          ? "✓ Controle correto"
                          : "✓ Achado confirmado"
                        : state.executions[item.id]
                          ? "Classifique a evidência"
                          : index === state.step
                            ? `Em execução · ${item.points} XP`
                            : `Aguardando · ${item.points} XP`}
                    </small>
                  </li>
                ))}
              </ol>
            </aside>
            <section
              className="security-panel security-lab"
              aria-labelledby="security-check-title"
            >
              <div className="security-lab-heading">
                <span className="label label--cyan">
                  CASO SEC-0{state.step + 1} · {test.control}
                </span>
                <h2 ref={checkTitleRef} id="security-check-title" tabIndex="-1">
                  {test.title}
                </h2>
                <p>{test.instruction}</p>
                <div className="security-expected">
                  <strong>Esperado:</strong>
                  <p>{test.expected}</p>
                </div>
              </div>
              <div className="security-browser" aria-label="Fikily fictícia">
                <div className="security-browser-bar">
                  <span aria-hidden="true">● ● ●</span>
                  <span>fikily.test/{test.path}</span>
                  <small>Simulado</small>
                </div>
                <header className="security-store-nav">
                  <strong>
                    <b>F</b> Fikily
                  </strong>
                  <span>FF-2026.11.1</span>
                </header>
                <p className="security-session" role="status">
                  {state.session === "ana"
                    ? `Sessão: Ana Lima · ${ANA.email} · autenticada (simulada).`
                    : "Sessão: sem autenticação."}
                </p>
                <div className="security-store">
                  {test.id === "own" && (
                    <section>
                      <span className="security-kicker">
                        CASO SEC-01 · DADOS PRÓPRIOS
                      </span>
                      <h3>Confira os dois controles.</h3>
                      {!state.guestDenied && (
                        <button
                          className="security-store-button"
                          type="button"
                          onClick={() => dispatch({ type: "deny-guest" })}
                        >
                          Abrir Minha Conta sem sessão
                        </button>
                      )}
                      {state.guestDenied && !state.session && (
                        <form
                          onSubmit={(event) => {
                            event.preventDefault();
                            dispatch({ type: "login-ana" });
                          }}
                        >
                          <p className="security-store-message" role="status">
                            401 simulado · Acesso negado. Entre para ver Minha
                            Conta. Nenhum dado privado foi exibido.
                          </p>
                          <label className="security-field">
                            E-mail fictício
                            <input value={ANA.email} readOnly />
                          </label>
                          <label className="security-field">
                            Senha fictícia de laboratório
                            <input value="AnaTeste123!" readOnly />
                          </label>
                          <button
                            className="security-store-button"
                            type="submit"
                          >
                            Entrar como Ana
                          </button>
                        </form>
                      )}
                      {state.session === "ana" && (
                        <div>
                          <div className="security-store-card">
                            <h4>Minha Conta</h4>
                            <p>
                              Ana Lima
                              <br />
                              {ANA.email}
                            </p>
                          </div>
                          <div className="security-store-card">
                            <h4>Histórico de Pedidos</h4>
                            <p>{ANA.order} · 1 × Mochila Urbana · R$ 189,90</p>
                            <small>1 pedido · titular: Ana Lima</small>
                          </div>
                          <button
                            className="security-store-button"
                            type="button"
                            disabled={executed}
                            onClick={() =>
                              dispatch({ type: "execute", id: "own" })
                            }
                          >
                            Conferir Minha Conta e Histórico
                          </button>
                        </div>
                      )}
                    </section>
                  )}
                  {test.id === "read" && (
                    <section>
                      <span className="security-kicker">
                        CASO SEC-02 · LEITURA DE TERCEIROS
                      </span>
                      <h3>Um pedido de outra pessoa.</h3>
                      <p className="security-store-note">
                        O time forneceu o pedido {BRUNO.order} de Bruno como
                        dado de teste.
                      </p>
                      <button
                        className="security-store-button"
                        type="button"
                        disabled={executed}
                        onClick={() =>
                          dispatch({ type: "execute", id: "read" })
                        }
                      >
                        Tentar abrir {BRUNO.order} como Ana
                      </button>
                      {executed && (
                        <div className="security-store-card">
                          <ForeignOrder address={state.address} />
                        </div>
                      )}
                    </section>
                  )}
                  {test.id === "write" && (
                    <section>
                      <span className="security-kicker">
                        CASO SEC-03 · ALTERAÇÃO DE TERCEIROS
                      </span>
                      <h3>Uma alteração não permitida.</h3>
                      <div className="security-store-card">
                        <ForeignOrder address={state.address} />
                      </div>
                      <form onSubmit={submitAddress}>
                        <label className="security-field">
                          Novo endereço fictício
                          <select
                            value={state.selectedAddress}
                            required
                            onChange={(event) =>
                              dispatch({
                                type: "set-address",
                                value: event.target.value,
                              })
                            }
                          >
                            <option value="">Selecione um dado de teste</option>
                            <option value="lab">
                              {SECURITY_ADDRESSES.lab}
                            </option>
                            <option value="simulation">
                              {SECURITY_ADDRESSES.simulation}
                            </option>
                          </select>
                        </label>
                        <button
                          className="security-store-button"
                          type="submit"
                          disabled={executed}
                        >
                          Tentar salvar endereço como Ana
                        </button>
                      </form>
                      <p
                        className="security-store-message"
                        role="status"
                        hidden={!state.addressFeedback}
                      >
                        {state.addressFeedback}
                      </p>
                    </section>
                  )}
                  {test.id === "message" && (
                    <section>
                      <span className="security-kicker">
                        CASO SEC-04 · RESPOSTAS DE LOGIN
                      </span>
                      <h3>Negar a entrada é suficiente?</h3>
                      <div className="security-store-card">
                        <h4>Conta cadastrada + senha incorreta</h4>
                        <p>
                          {ANA.email}
                          <br />
                          Senha incorreta fictícia: OutraSenhaTeste!
                        </p>
                        <button
                          className="security-store-button"
                          type="button"
                          disabled={state.knownDenied}
                          onClick={() => dispatch({ type: "test-known" })}
                        >
                          Testar senha incorreta para Ana
                        </button>
                        {state.knownDenied && (
                          <p className="security-store-message" role="status">
                            Senha incorreta
                          </p>
                        )}
                      </div>
                      <div className="security-store-card">
                        <h4>Conta inexistente</h4>
                        <p>
                          cliente.inexistente@fikily.test
                          <br />
                          Senha fictícia: OutraSenhaTeste!
                        </p>
                        <button
                          className="security-store-button"
                          type="button"
                          disabled={!state.knownDenied || state.unknownDenied}
                          onClick={() => {
                            dispatch({ type: "test-unknown" });
                            dispatch({ type: "execute", id: "message" });
                          }}
                        >
                          Testar conta inexistente
                        </button>
                        {state.unknownDenied && (
                          <p className="security-store-message" role="status">
                            Esta conta não existe
                          </p>
                        )}
                      </div>
                    </section>
                  )}
                </div>
              </div>
              {executed && (
                <section className="security-observation">
                  <h3>Resultado observado</h3>
                  <p>{getSecuritySnapshot(state, test.id).observed}</p>
                </section>
              )}
              {executed && (
                <form ref={classificationRef} onSubmit={submitClassification}>
                  <fieldset>
                    <legend>Como você classifica o controle observado?</legend>
                    {test.id === "own" &&
                      [
                        [
                          "allowed",
                          "Controles corretos: sem sessão o acesso foi negado; Ana autenticada acessou apenas os próprios dados.",
                        ],
                        [
                          "authentication",
                          "Falha de autenticação: a área privada abriu sem sessão.",
                        ],
                        [
                          "exposure",
                          "Exposição de dados: o Histórico mostrou dados de outra conta.",
                        ],
                      ].map(([value, label]) => (
                        <label key={value}>
                          <input
                            type="radio"
                            name="classification"
                            value={value}
                            required
                            disabled={recorded}
                          />{" "}
                          {label}
                        </label>
                      ))}
                    {test.id === "read" &&
                      [
                        [
                          "unauthorized-read",
                          "Falha de autorização com exposição indevida: Ana conseguiu ler dados de Bruno.",
                        ],
                        [
                          "allowed",
                          "Acesso permitido: Ana também pode ler todos os pedidos.",
                        ],
                        [
                          "denied",
                          "Acesso negado corretamente: nenhum dado foi exibido.",
                        ],
                      ].map(([value, label]) => (
                        <label key={value}>
                          <input
                            type="radio"
                            name="classification"
                            value={value}
                            required
                            disabled={recorded}
                          />{" "}
                          {label}
                        </label>
                      ))}
                    {test.id === "write" &&
                      [
                        [
                          "unauthorized-write",
                          "Alteração não autorizada: o endereço de Bruno mudou sob Ana.",
                        ],
                        [
                          "denied",
                          "Alteração negada corretamente: o endereço foi preservado.",
                        ],
                        [
                          "authentication",
                          "Falha de autenticação: Bruno entrou com senha incorreta.",
                        ],
                      ].map(([value, label]) => (
                        <label key={value}>
                          <input
                            type="radio"
                            name="classification"
                            value={value}
                            required
                            disabled={recorded}
                          />{" "}
                          {label}
                        </label>
                      ))}
                    {test.id === "message" &&
                      [
                        [
                          "revealing-message",
                          "Mensagens excessivamente específicas permitiram distinguir conta cadastrada de inexistente.",
                        ],
                        [
                          "authentication",
                          "Falha de autenticação: a conta inexistente entrou.",
                        ],
                        [
                          "safe",
                          "Resposta segura: negar a entrada permite revelar livremente quais contas existem.",
                        ],
                      ].map(([value, label]) => (
                        <label key={value}>
                          <input
                            type="radio"
                            name="classification"
                            value={value}
                            required
                            disabled={recorded}
                          />{" "}
                          {label}
                        </label>
                      ))}
                  </fieldset>
                  <p
                    className="security-feedback"
                    role="status"
                    hidden={
                      !state.mistakes.includes(test.id) &&
                      Boolean(state.records[test.id])
                    }
                  >
                    {state.records[test.id]
                      ? getSecuritySnapshot(state, test.id).learning +
                        ` +${state.records[test.id]} XP pela classificação.`
                      : "Compare novamente os dados e a resposta esperada."}
                  </p>
                  <button
                    ref={nextRef}
                    className="button button--ghost"
                    type="submit"
                    disabled={recorded}
                  >
                    Registrar evidência
                  </button>
                </form>
              )}
              {recorded && (
                <button
                  className="button button--ghost security-next"
                  type="button"
                  onClick={nextCase}
                >
                  {state.step === SECURITY_CASES.length - 1
                    ? "Emitir parecer →"
                    : "Próximo cenário →"}
                </button>
              )}
            </section>
            <aside className="security-panel security-report">
              <span className="label label--cyan">CADERNO DE EVIDÊNCIAS</span>
              <h2>Fundamente seu parecer.</h2>
              <p className="security-status" role="status">
                FF-2026.11.1 · {recordCount} de 4 cenários classificados.
                {state.records.read
                  ? " Falha de autorização registrada; candidata sem aprovação."
                  : " Parecer pendente."}
              </p>
              <div>
                {Object.keys(state.executions).map((id) => (
                  <SecurityEvidence key={id} state={state} id={id} />
                ))}
                {Object.keys(state.executions).length === 0 && (
                  <p className="security-note">
                    Suas evidências aparecerão aqui após as ações.
                  </p>
                )}
              </div>
              {recordCount !== SECURITY_CASES.length && (
                <p className="security-note">
                  Classifique os quatro cenários para emitir o parecer.
                </p>
              )}
              {reviewVisible && (
                <form onSubmit={finishReview}>
                  <fieldset>
                    <legend ref={reviewTitleRef} tabIndex="-1">
                      Qual é o parecer sobre a FF-2026.11.1 neste escopo?
                    </legend>
                    <label>
                      <input
                        type="radio"
                        name="decision"
                        value="return"
                        required
                        checked={state.review.decision === "return"}
                        onChange={() =>
                          dispatch({
                            type: "set-review",
                            field: "decision",
                            value: "return",
                          })
                        }
                      />{" "}
                      Reprovar a candidata neste escopo e devolver para
                      correção.
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="decision"
                        value="accept"
                        required
                        checked={state.review.decision === "accept"}
                        onChange={() =>
                          dispatch({
                            type: "set-review",
                            field: "decision",
                            value: "accept",
                          })
                        }
                      />{" "}
                      Aceitar a candidata porque o login válido funciona.
                    </label>
                  </fieldset>
                  <fieldset>
                    <legend>Qual evidência sustenta esse parecer?</legend>
                    <label>
                      <input
                        type="radio"
                        name="reason"
                        value="controls"
                        required
                        checked={state.review.reason === "controls"}
                        onChange={() =>
                          dispatch({
                            type: "set-review",
                            field: "reason",
                            value: "controls",
                          })
                        }
                      />{" "}
                      Ana consegue ler e alterar o pedido de Bruno; mensagens
                      distinguem contas.
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="reason"
                        value="smoke"
                        required
                        checked={state.review.reason === "smoke"}
                        onChange={() =>
                          dispatch({
                            type: "set-review",
                            field: "reason",
                            value: "smoke",
                          })
                        }
                      />{" "}
                      Um Smoke com a Home disponível garante proteção dos dados.
                    </label>
                  </fieldset>
                  <p
                    className="security-feedback"
                    role="status"
                    hidden={!state.reviewFeedback}
                  >
                    {state.reviewFeedback}
                  </p>
                  <button className="button button--primary" type="submit">
                    Concluir missão com parecer
                  </button>
                </form>
              )}
            </aside>
          </section>
        )}
      </div>
      {state.finished && (
        <section
          className="security-panel security-result"
          aria-labelledby="security-result-title"
        >
          <span className="label label--cyan">
            MISSÃO CONCLUÍDA · PARECER CORRETO
          </span>
          <h2 ref={resultTitleRef} id="security-result-title" tabIndex="-1">
            Identidade confirmada. Permissões falharam.
          </h2>
          <p>
            O acesso próprio de Ana funciona e as tentativas inválidas são
            negadas. Porém, Ana consegue ler e alterar o pedido de Bruno, e os
            erros revelam se uma conta existe.
          </p>
          <div className="security-result-stats">
            <div>
              <span>CENÁRIOS</span>
              <strong>4 / 4</strong>
            </div>
            <div>
              <span>ACHADOS</span>
              <strong>3</strong>
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
            <SecurityReadOnlyNotice role="status">
              O resultado desta tentativa não foi salvo porque o progresso
              pertence a uma versão mais recente.
            </SecurityReadOnlyNotice>
          )}
          <details className="security-result-evidence">
            <summary>Revisar as quatro evidências</summary>
            <div>
              {SECURITY_CASES.map((item) => (
                <SecurityEvidence key={item.id} state={state} id={item.id} />
              ))}
            </div>
          </details>
          <p className="security-learning">
            A autenticação confirmou Ana, mas a autorização deveria impedir
            leitura e alteração do pedido de Bruno.
          </p>
          <div className="security-result-actions">
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
    </SecurityRoot>
  );
}

export function mountSecurity(element) {
  createRoot(element).render(<Security />);
}
