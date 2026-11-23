import React, { useEffect, useReducer, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BUG_REPORT_QUESTIONS,
  BUG_REPORT_REPORT,
  BUG_REPORT_STEPS,
  bugReportReducer,
  createInitialBugReportState,
  getBugReportScore,
} from "../../../core/bug-report-lab.js";
import { BugReportReadOnlyNotice, BugReportRoot } from "./BugReport.styles.js";

const progress = window.QAQuestProgress;

function readAccess() {
  return {
    tracksUnlocked: progress.isTracksUnlocked(),
    phase4Available: progress.isPhaseUnlocked(4),
    readOnly: progress.isReadOnly(),
  };
}

function BugReport() {
  const [state, dispatch] = useReducer(
    bugReportReducer,
    undefined,
    createInitialBugReportState,
  );
  const [access, setAccess] = useState(readAccess);
  const [savedProgress, setSavedProgress] = useState(null);
  const [saveBlocked, setSaveBlocked] = useState(false);
  const [searched, setSearched] = useState(false);
  const [filter, setFilter] = useState("all");
  const questionTitleRef = useRef(null);
  const resultTitleRef = useRef(null);
  const saveStatusRef = useRef(null);
  const nextRef = useRef(null);
  const score = getBugReportScore(state);
  const question = BUG_REPORT_QUESTIONS[state.step];

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
    if (state.captured) questionTitleRef.current?.focus();
  }, [state.captured, state.step]);

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

  function capture() {
    if (!state.captured && filter === "accessories")
      dispatch({ type: "capture" });
  }

  function submitAnswer(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = form.getAll("answer");
    dispatch({ type: "submit-answer", values });
  }

  function nextQuestion() {
    const nextState = bugReportReducer(state, { type: "next" });
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
            "bug-report",
            getBugReportScore(nextState),
          );
        } catch (error) {
          if (!progress.isReadOnly()) throw error;
          setSaveBlocked(true);
          setAccess(readAccess());
        }
        if (result) setSavedProgress(result);
      }
    }
    dispatch({ type: "next" });
  }

  function downloadReport() {
    if (!state.finished) return;
    const content =
      "FF-QA-014 · Relato didático local da Fikily\n\n" +
      Object.entries(state.fields)
        .map(([label, value]) => `${label}\n${value}`)
        .join("\n\n");
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "fikily-FF-QA-014.txt";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function restartMission() {
    setSavedProgress(null);
    setSaveBlocked(false);
    setSearched(false);
    setFilter("all");
    saveStatusRef.current?.reset();
    dispatch({ type: "restart" });
  }

  if (!access.tracksUnlocked)
    return (
      <BugReportRoot>
        <section
          className="report-locked"
          aria-labelledby="report-locked-title"
        >
          <span className="label label--cyan">BASE COMUM</span>
          <h1 id="report-locked-title">
            Conclua a Fase 4 para preparar seu relato.
          </h1>
          <p>
            O caso de referência está incluído. Nenhuma outra trilha é
            obrigatória.
          </p>
          <a
            className="button button--primary"
            href={access.phase4Available ? "phase4.html" : "index.html"}
          >
            {access.phase4Available ? "Continuar Fase 4" : "Voltar à jornada"}
          </a>
        </section>
      </BugReportRoot>
    );

  return (
    <BugReportRoot>
      {access.readOnly && (
        <BugReportReadOnlyNotice role="status" aria-live="polite">
          O progresso pertence a uma versão mais recente. Você pode concluir a
          missão, mas o resultado não será salvo.
        </BugReportReadOnlyNotice>
      )}
      <div id="report-content" hidden={state.finished}>
        <header className="report-intro">
          <div>
            <span className="label label--cyan">
              TRILHA 04 · PRÁTICA PROFISSIONAL
            </span>
            <h1>Do achado ao relato.</h1>
          </div>
          <p>
            Reproduza, explique o impacto e entregue à equipe um defeito
            reproduzível.
          </p>
        </header>
        <section className="report-panel report-briefing">
          <div>
            <span className="label">FIKILY · FF-2026.10.2</span>
            <h2>O filtro mudou. Os resultados ficaram.</h2>
            <p>
              Na Regressão, o filtro do catálogo deixou de restringir produtos.
              Você vai preparar o relato dessa candidata histórica.
            </p>
            <p>
              <strong>Antes · FF-2026.09:</strong> Acessórios deixava somente
              Mochila Urbana. <strong>Agora:</strong> a lista continua com duas
              mochilas.
            </p>
            <details>
              <summary>O que torna um relato útil?</summary>
              <p>
                Título, ambiente, pré-condições, passos, esperado, observado,
                impacto e evidências permitem reproduzir o problema.
              </p>
              <p>
                Severidade descreve o impacto. Prioridade orienta quando tratar.
                Uma hipótese de causa não substitui evidência.
              </p>
            </details>
          </div>
          <aside>
            <strong>Até 100 XP</strong>
            <p>
              Reprodução: 10
              <br />
              Construção e revisão: 9 × 10
            </p>
            <small>Resposta corrigida vale 5 XP.</small>
          </aside>
        </section>
        <section id="report-workspace" className="report-workspace">
          <div className="report-editor">
            <section id="report-reproduction" className="report-panel">
              <span className="label label--cyan">
                01 · REPRODUZIR ANTES DE RELATAR
              </span>
              <h2>Confira o mesmo dado de teste.</h2>
              <p>
                Busque “Mochila”, selecione Acessórios e registre o resultado.
              </p>
              <div className="report-browser">
                <div className="report-browser-bar">
                  <span aria-hidden="true">● ● ●</span>
                  <span>fikily.test/catalog</span>
                  <small>Simulado</small>
                </div>
                <div className="report-store">
                  <header>
                    <strong>Fikily</strong>
                    <span>FF-2026.10.2 · homologação fictícia</span>
                  </header>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                    }}
                  >
                    <label>
                      Busca de teste
                      <input value="Mochila" readOnly />
                    </label>
                    <button
                      type="button"
                      disabled={searched}
                      onClick={() => setSearched(true)}
                    >
                      Buscar produtos
                    </button>
                  </form>
                  {searched && (
                    <div>
                      <label>
                        Categoria
                        <select
                          value={filter}
                          disabled={state.captured}
                          onChange={(event) => setFilter(event.target.value)}
                        >
                          <option value="all">Todas</option>
                          <option value="accessories">Acessórios</option>
                        </select>
                      </label>
                      <p role="status">
                        Categoria:{" "}
                        {filter === "accessories" ? "Acessórios" : "Todas"} · 2
                        resultados
                      </p>
                      <ul>
                        <li>
                          <strong>Mochila Urbana</strong>
                          <span>Acessórios · R$ 189,90</span>
                        </li>
                        <li>
                          <strong>Mochila Notebook</strong>
                          <span>Tecnologia · R$ 249,90</span>
                        </li>
                      </ul>
                      <button
                        type="button"
                        disabled={filter !== "accessories" || state.captured}
                        onClick={capture}
                      >
                        Registrar reprodução e evidências
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <p
                className="report-feedback"
                role="status"
                hidden={!state.feedback}
              >
                {state.feedback}
              </p>
            </section>
            {state.captured && (
              <section className="report-panel">
                <span className="label label--cyan">
                  {String(state.step + 2).padStart(2, "0")} · CONSTRUIR E
                  REVISAR
                </span>
                <h2 ref={questionTitleRef} tabIndex="-1">
                  {question.title}
                </h2>
                <p>{question.help}</p>
                {["severity", "priority"].includes(question.id) && (
                  <aside className="report-rubric">
                    <h3>Critérios fictícios da equipe Fikily</h3>
                    <p>
                      S1 crítica: indisponibilidade geral. S2 alta: função
                      essencial sem alternativa. S3 moderada: alternativa
                      disponível. S4 baixa: problema visual.
                    </p>
                    <p>
                      P0 emergência. P1 tratar antes da campanha. P2 próxima
                      iteração.
                    </p>
                  </aside>
                )}
                <form onSubmit={submitAnswer}>
                  <fieldset>
                    <legend>{question.legend}</legend>
                    {question.type === "order" ? (
                      <ol>
                        {state.order.map((id, index) => (
                          <li key={id}>
                            <span>
                              {index + 1}. {BUG_REPORT_STEPS[id]}
                            </span>
                            <button
                              type="button"
                              disabled={index === 0}
                              aria-label={`Subir ${BUG_REPORT_STEPS[id]}`}
                              onClick={() =>
                                dispatch({
                                  type: "move-order",
                                  id,
                                  offset: -1,
                                })
                              }
                            >
                              Subir
                            </button>
                            <button
                              type="button"
                              disabled={index === state.order.length - 1}
                              aria-label={`Descer ${BUG_REPORT_STEPS[id]}`}
                              onClick={() =>
                                dispatch({
                                  type: "move-order",
                                  id,
                                  offset: 1,
                                })
                              }
                            >
                              Descer
                            </button>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      question.options.map(([value, text]) => (
                        <label key={value}>
                          <input
                            type={
                              question.type === "multiple"
                                ? "checkbox"
                                : "radio"
                            }
                            name="answer"
                            value={value}
                            required={question.type !== "multiple"}
                          />
                          {text}
                        </label>
                      ))
                    )}
                  </fieldset>
                  <p
                    className="report-feedback"
                    role="status"
                    hidden={!state.feedback}
                  >
                    {state.feedback}
                  </p>
                  {state.points[question.id] ? (
                    <button
                      ref={nextRef}
                      className="button button--ghost"
                      type="button"
                      onClick={nextQuestion}
                    >
                      {state.step === BUG_REPORT_QUESTIONS.length - 1
                        ? "Concluir missão e salvar"
                        : "Continuar →"}
                    </button>
                  ) : (
                    <button className="button button--primary" type="submit">
                      Confirmar resposta
                    </button>
                  )}
                </form>
              </section>
            )}
          </div>
          <aside
            className="report-panel report-draft"
            aria-labelledby="report-draft-title"
          >
            <span className="label label--cyan">RASCUNHO DO DEFEITO</span>
            <h2 id="report-draft-title">Clareza em cada campo.</h2>
            <p>{Object.keys(state.points).length} / 10 etapas</p>
            <div
              role="progressbar"
              aria-label="Etapas concluídas"
              aria-valuemin="0"
              aria-valuemax="10"
              aria-valuenow={Object.keys(state.points).length}
            >
              <i
                id="report-progress-bar"
                style={{
                  width: `${Object.keys(state.points).length * 10}%`,
                }}
              ></i>
            </div>
            <dl>
              {Object.entries(state.fields).map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            {state.captured && (
              <details>
                <summary>Consultar os registros da reprodução</summary>
                <div>
                  <p>
                    EV-01 · catálogo → buscar Mochila → Acessórios → conferir
                    lista.
                  </p>
                  <p>
                    EV-02 · {BUG_REPORT_REPORT.environment} Resultado observado:
                    duas mochilas; referência: uma Mochila Urbana.
                  </p>
                </div>
              </details>
            )}
          </aside>
        </section>
      </div>
      {state.finished && (
        <section
          className="report-panel report-result"
          aria-labelledby="report-result-title"
        >
          <span className="label label--cyan">
            MISSÃO CONCLUÍDA · RELATO REVISADO
          </span>
          <h2 ref={resultTitleRef} id="report-result-title" tabIndex="-1">
            Pronto para a equipe investigar.
          </h2>
          <p>
            Você transformou a regressão do filtro em um relato reproduzível.
          </p>
          <div className="report-stats">
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
            <BugReportReadOnlyNotice role="status">
              O resultado desta tentativa não foi salvo porque o progresso
              pertence a uma versão mais recente.
            </BugReportReadOnlyNotice>
          )}
          <dl>
            {Object.entries(state.fields).map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="report-actions">
            <button
              className="button button--ghost"
              type="button"
              onClick={downloadReport}
            >
              Baixar relato .txt
            </button>
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
    </BugReportRoot>
  );
}

export function mountBugReport(element) {
  createRoot(element).render(<BugReport />);
}
