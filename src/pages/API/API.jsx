import React, { useEffect, useReducer, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  API_CASES,
  apiLabReducer,
  createInitialApiState,
  getApiScore,
  prettyApiJson,
} from "../../../core/api-lab.js";
import { APIReadOnlyNotice, APIRoot } from "./API.styles.js";

const progress = window.QAQuestProgress;

function readAccess() {
  return {
    tracksUnlocked: progress.isTracksUnlocked(),
    phase4Available: progress.isPhaseUnlocked(4),
    readOnly: progress.isReadOnly(),
  };
}

function fullPath(test) {
  return test.path + (test.query ? "?" + test.query : "");
}

function API() {
  const [state, dispatch] = useReducer(
    apiLabReducer,
    undefined,
    createInitialApiState,
  );
  const [access, setAccess] = useState(readAccess);
  const [savedProgress, setSavedProgress] = useState(null);
  const [saveBlocked, setSaveBlocked] = useState(false);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const checkTitleRef = useRef(null);
  const reviewTitleRef = useRef(null);
  const resultTitleRef = useRef(null);
  const saveStatusRef = useRef(null);
  const previousStepRef = useRef(state.step);
  const test = API_CASES[state.step];
  const executed = Boolean(state.executions[test.id]);
  const recorded = Boolean(state.records[test.id]);
  const recordCount = Object.keys(state.records).length;
  const score = getApiScore(state);
  const reviewVisible =
    recordCount === API_CASES.length &&
    state.step === API_CASES.length - 1 &&
    recorded;

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

  function submitConcept(event) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("concept");
    dispatch({ type: "submit-concept", value });
  }

  function runReference() {
    dispatch({ type: "run-reference" });
  }

  function executeRequest(event) {
    event.preventDefault();
    dispatch({ type: "execute" });
  }

  function submitClassification(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget).getAll("classification");
    dispatch({ type: "classify", values });
  }

  function nextCase() {
    if (state.step < API_CASES.length - 1) dispatch({ type: "next" });
    else reviewTitleRef.current?.focus();
  }

  function submitReview(event) {
    event.preventDefault();
    const nextState = apiLabReducer(state, { type: "submit-review" });
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
          result = progress.saveMissionResult("api", getApiScore(nextState));
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
      <APIRoot>
        <section className="api-locked" aria-labelledby="api-locked-title">
          <span className="label label--cyan">BASE COMUM</span>
          <h1 id="api-locked-title">
            Conclua a Fase 4 para investigar estes contratos.
          </h1>
          <p>
            Esta missão independe de Relato de Defeitos e de outras trilhas.
          </p>
          <a
            className="button button--primary"
            href={access.phase4Available ? "phase4.html" : "index.html"}
          >
            {access.phase4Available ? "Continuar Fase 4" : "Voltar à jornada"}
          </a>
        </section>
      </APIRoot>
    );

  return (
    <APIRoot>
      {access.readOnly && (
        <APIReadOnlyNotice role="status" aria-live="polite">
          O progresso pertence a uma versão mais recente. Você pode concluir a
          missão, mas o resultado não será salvo.
        </APIReadOnlyNotice>
      )}
      <div id="api-content" hidden={state.finished}>
        <header className="api-intro">
          <div>
            <span className="label label--cyan">
              TRILHA 04 · PRÁTICA PROFISSIONAL
            </span>
            <h1>O status conta só uma parte.</h1>
          </div>
          <p>
            Leia a requisição, compare a resposta com o contrato e fundamente o
            parecer.
          </p>
        </header>
        <section className="api-panel api-briefing">
          <div>
            <span className="label">FIKILY · CANDIDATA FF-2026.12.0</span>
            <h2>O que a interface espera do serviço?</h2>
            <p>
              Confira status, campos obrigatórios e regras de negócio antes da
              próxima rodada integrada.
            </p>
            <p>
              <strong>Pergunta do teste:</strong> estas respostas atendem ao
              contrato que seus consumidores esperam?
            </p>
            <details className="api-glossary">
              <summary>Glossário e relação com as outras missões</summary>
              <p>
                <strong>Método:</strong> operação como GET ou POST.
                <strong> Rota:</strong> caminho do recurso.
              </p>
              <p>
                <strong>Contrato:</strong> acordo sobre entrada, status, campos,
                tipos e regras.
              </p>
            </details>
          </div>
          <aside className="api-scoring">
            <strong>Até 100 XP</strong>
            <p>
              Conceito: 10
              <br />
              Execuções: 10 + 5 + 5 + 10
              <br />
              4 classificações: 40
              <br />
              Parecer + justificativa: 20
            </p>
          </aside>
        </section>
        {!state.concept && (
          <section className="api-panel">
            <form onSubmit={submitConcept}>
              <fieldset>
                <legend>O que permite validar um contrato de API?</legend>
                <label>
                  <input
                    type="radio"
                    name="concept"
                    value="contract"
                    required
                  />{" "}
                  Comparar método, rota e dados enviados com status, campos e
                  regras da resposta esperada.
                </label>
                <label>
                  <input type="radio" name="concept" value="e2e" required /> Ver
                  apenas se uma compra completa chega ao final.
                </label>
                <label>
                  <input
                    type="radio"
                    name="concept"
                    value="regression"
                    required
                  />{" "}
                  Repetir telas sem inspecionar a resposta.
                </label>
              </fieldset>
              <p
                className="api-feedback"
                role="status"
                hidden={!state.conceptFeedback}
              >
                {state.conceptFeedback}
              </p>
              <button className="button button--primary" type="submit">
                Abrir laboratório
              </button>
            </form>
          </section>
        )}
        {state.concept && (
          <section
            className="api-workspace"
            aria-label="Laboratório de contratos"
          >
            <aside className="api-panel api-checklist">
              <span className="label label--cyan">QUATRO CENÁRIOS</span>
              <h2>Requisitar, ler e comparar.</h2>
              <p className="api-counter">
                Classificados <strong>{recordCount} / 4</strong>
              </p>
              <div
                role="progressbar"
                aria-label="Cenários classificados"
                aria-valuemin="0"
                aria-valuemax="4"
                aria-valuenow={recordCount}
              >
                <i
                  id="api-progress-bar"
                  style={{ width: `${recordCount * 25}%` }}
                ></i>
              </div>
              <ol>
                {API_CASES.map((item, index) => (
                  <li
                    key={item.id}
                    aria-current={index === state.step ? "step" : undefined}
                  >
                    <strong>
                      {String(index + 1).padStart(2, "0")} · {item.title}
                    </strong>
                    <small>
                      {state.records[item.id]
                        ? item.id === "created"
                          ? "Contrato atendido"
                          : "Falha registrada"
                        : state.executions[item.id]
                          ? "Classifique a evidência"
                          : index === state.step
                            ? "Em execução"
                            : "Próximo caso"}
                    </small>
                  </li>
                ))}
              </ol>
            </aside>
            <section
              className="api-panel api-lab"
              aria-labelledby="api-case-title"
            >
              <span className="label label--cyan">
                CASO API-0{state.step + 1} · CONTRATO LOCAL
              </span>
              <h2 ref={checkTitleRef} id="api-case-title" tabIndex="-1">
                {test.title}
              </h2>
              <p>{test.instruction}</p>
              <div className="api-contract">
                <strong>Contrato deste caso</strong>
                <p>{test.contract}</p>
                <details>
                  <summary>Consultar resposta de exemplo aderente</summary>
                  <pre>
                    {test.expectedStatus}
                    {"\n\n"}
                    {prettyApiJson(test.expectedBody)}
                  </pre>
                </details>
              </div>
              <div className="api-console">
                <header className="api-console-heading">
                  <strong>Fikily · API Lab</strong>
                  <span>Dados locais · FF-2026.12.0</span>
                </header>
                <p className="api-profile">{test.profile}</p>
                <form onSubmit={executeRequest}>
                  <div className="api-request-line">
                    <label>
                      Método
                      <select
                        value={state.method}
                        disabled={executed || state.referenceDone}
                        required
                        onChange={(event) =>
                          dispatch({
                            type: "set-method",
                            value: event.target.value,
                          })
                        }
                      >
                        <option value="">Selecionar</option>
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                      </select>
                    </label>
                    <div>
                      <span className="api-field-label">Destino fictício</span>
                      <code>fikily.test{fullPath(test)}</code>
                    </div>
                  </div>
                  {test.body && (
                    <details open>
                      <summary>Request body · dados enviados</summary>
                      <pre>{prettyApiJson(test.body)}</pre>
                    </details>
                  )}
                  {test.reference && !state.referenceDone && (
                    <button
                      className="api-console-button"
                      type="button"
                      onClick={runReference}
                    >
                      1. Simular referência aderente
                    </button>
                  )}
                  <button
                    className="api-console-button"
                    type="submit"
                    disabled={
                      executed || (test.reference && !state.referenceDone)
                    }
                  >
                    {test.reference
                      ? "2. Simular candidata"
                      : "Simular resposta deste perfil"}
                  </button>
                </form>
                {executed && (
                  <div
                    className="api-responses"
                    aria-label="Respostas simuladas"
                    aria-live="polite"
                  >
                    {test.reference && (
                      <section className="api-response">
                        <h3>{test.reference.label}</h3>
                        <span>{test.reference.status}</span>
                        <pre>{prettyApiJson(test.reference.body)}</pre>
                      </section>
                    )}
                    <section className="api-response">
                      <h3>{test.response.label}</h3>
                      <span>{test.response.status}</span>
                      <pre>{prettyApiJson(test.response.body)}</pre>
                    </section>
                  </div>
                )}
              </div>
              {executed && (
                <section className="api-observation">
                  <h3>Resultado observado</h3>
                  <p>{test.observed}</p>
                </section>
              )}
              {executed && (
                <form onSubmit={submitClassification}>
                  <fieldset>
                    <legend>
                      Quais classificações correspondem às respostas?
                    </legend>
                    <p className="api-note">
                      Selecione todas as opções que se aplicam.
                    </p>
                    {test.options.map(([value, label]) => (
                      <label key={value}>
                        <input
                          type="checkbox"
                          name="classification"
                          value={value}
                          disabled={recorded}
                        />
                        {label}
                      </label>
                    ))}
                  </fieldset>
                  {recorded ? (
                    <p className="api-feedback" role="status">
                      Evidência classificada: {test.classification} +
                      {state.records[test.id]} XP.
                    </p>
                  ) : (
                    <button className="button button--ghost" type="submit">
                      Registrar classificação
                    </button>
                  )}
                </form>
              )}
              {recorded && (
                <button
                  className="button button--ghost api-next"
                  type="button"
                  onClick={nextCase}
                >
                  {state.step === API_CASES.length - 1
                    ? "Emitir parecer →"
                    : "Próximo cenário →"}
                </button>
              )}
            </section>
            <aside className="api-panel api-report">
              <span className="label label--cyan">CADERNO DE EVIDÊNCIAS</span>
              <h2>Contrato e impacto.</h2>
              <p className="api-status" role="status">
                FF-2026.12.0 · {recordCount} de 4 casos classificados.
              </p>
              {Object.keys(state.executions).map((id) => {
                const item = API_CASES.find((caseItem) => caseItem.id === id);
                return (
                  <details key={id} className="api-evidence-item">
                    <summary>
                      {item.title} ·{" "}
                      {state.records[id]
                        ? item.classification
                        : "Classificação pendente"}
                    </summary>
                    <dl>
                      <div>
                        <dt>Perfil</dt>
                        <dd>{item.profile}</dd>
                      </div>
                      <div>
                        <dt>Observado</dt>
                        <dd>{item.observed}</dd>
                      </div>
                      <div>
                        <dt>Impacto</dt>
                        <dd>{item.impact}</dd>
                      </div>
                    </dl>
                  </details>
                );
              })}
              {recordCount !== API_CASES.length && (
                <p className="api-note">
                  Classifique os quatro cenários antes de emitir o parecer.
                </p>
              )}
              {reviewVisible && (
                <form onSubmit={submitReview}>
                  <fieldset>
                    <legend ref={reviewTitleRef} tabIndex="-1">
                      Qual é o parecer sobre a FF-2026.12.0 neste escopo?
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
                      Reprovar a candidata e devolver para ajuste.
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
                      Aprovar todos os contratos porque há 2xx e JSON válido.
                    </label>
                  </fieldset>
                  <fieldset>
                    <legend>Qual justificativa sustenta o parecer?</legend>
                    <label>
                      <input
                        type="radio"
                        name="reason"
                        value="contracts"
                        required
                        checked={state.review.reason === "contracts"}
                        onChange={() =>
                          dispatch({
                            type: "set-review",
                            field: "reason",
                            value: "contracts",
                          })
                        }
                      />{" "}
                      A criação passou, mas filtro, status, total e campo
                      ausente falharam.
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
                      A Home disponível no Smoke garante os campos das
                      respostas.
                    </label>
                  </fieldset>
                  <p
                    className="api-feedback"
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
          className="api-panel api-result"
          aria-labelledby="api-result-title"
        >
          <span className="label label--cyan">
            MISSÃO CONCLUÍDA · PARECER FUNDAMENTADO
          </span>
          <h2 ref={resultTitleRef} id="api-result-title" tabIndex="-1">
            Respostas recebidas. Contratos falharam.
          </h2>
          <p>
            A criação aderiu ao contrato em um caso; filtro, status, total e
            campo ausente revelaram violações.
          </p>
          <div className="api-stats">
            <div>
              <span>CENÁRIOS</span>
              <strong>4 / 4</strong>
            </div>
            <div>
              <span>VIOLAÇÕES</span>
              <strong>4</strong>
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
            <APIReadOnlyNotice role="status">
              O resultado desta tentativa não foi salvo porque o progresso
              pertence a uma versão mais recente.
            </APIReadOnlyNotice>
          )}
          <details className="api-result-evidence">
            <summary>Revisar as quatro evidências completas</summary>
            <div>
              {API_CASES.map((item) => (
                <details key={item.id}>
                  <summary>{item.title}</summary>
                  <p>{item.observed}</p>
                  <p>{item.impact}</p>
                </details>
              ))}
            </div>
          </details>
          <p className="api-learning">
            Método e rota identificam a operação. Status e body precisam
            respeitar campos, tipos e regras.
          </p>
          <div className="api-result-actions">
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
    </APIRoot>
  );
}

export function mountAPI(element) {
  createRoot(element).render(<API />);
}
