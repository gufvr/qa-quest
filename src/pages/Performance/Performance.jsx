import React, { useEffect, useReducer, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  createInitialPerformanceState,
  formatPerformanceNumber,
  getCorrectPerformanceClassification,
  getPerformanceClassificationLabel,
  getPerformanceErrorRate,
  getPerformanceExpected,
  getPerformanceImpact,
  getPerformanceInterpretation,
  getPerformanceObservation,
  getPerformanceScore,
  isPerformanceStress,
  PERFORMANCE_LIMITS,
  PERFORMANCE_SAMPLES,
  performanceLabReducer,
} from "../../../core/performance-lab.js";
import {
  PerformanceReadOnlyNotice,
  PerformanceRoot,
} from "./Performance.styles.js";

const progress = window.QAQuestProgress;

function readAccess() {
  return {
    tracksUnlocked: progress.isTracksUnlocked(),
    phase4Available: progress.isPhaseUnlocked(4),
    readOnly: progress.isReadOnly(),
  };
}

function PerformanceEvidence({ state, index }) {
  const sample = PERFORMANCE_SAMPLES[index];
  const classified = state.records[index] !== undefined;
  return (
    <details
      className="performance-evidence-item"
      data-stress={String(isPerformanceStress(sample))}
    >
      <summary>
        {sample.users} usuários ·{" "}
        {classified
          ? getPerformanceClassificationLabel(sample)
          : "Interpretação pendente"}
      </summary>
      {[
        [
          "Carga aplicada",
          `${sample.users} usuários simultâneos · 60 s simulados · 70% buscas / 30% filtros`,
        ],
        ["Esperado", getPerformanceExpected(sample)],
        ["Observado", getPerformanceObservation(sample)],
        ["Impacto", getPerformanceImpact(sample)],
        [
          "Interpretação",
          classified
            ? getPerformanceInterpretation(sample)
            : "Compare as três métricas aos limites e considere se este patamar é carga prevista ou estresse.",
        ],
      ].map(([label, value]) => (
        <p key={label}>
          <b>{label}: </b>
          {value}
        </p>
      ))}
    </details>
  );
}

function Performance() {
  const [state, dispatch] = useReducer(
    performanceLabReducer,
    undefined,
    createInitialPerformanceState,
  );
  const [access, setAccess] = useState(readAccess);
  const [savedProgress, setSavedProgress] = useState(null);
  const [saveBlocked, setSaveBlocked] = useState(false);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const runTitleRef = useRef(null);
  const classificationRef = useRef(null);
  const nextRef = useRef(null);
  const reviewTitleRef = useRef(null);
  const resultTitleRef = useRef(null);
  const saveStatusRef = useRef(null);
  const previousStepRef = useRef(state.step);
  const sample = PERFORMANCE_SAMPLES[state.step];
  const executed = state.executed.includes(state.step);
  const recorded = state.records[state.step] !== undefined;
  const recordCount = Object.keys(state.records).length;
  const score = getPerformanceScore(state);

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
      runTitleRef.current?.focus();
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

  function ensureAccessThen(action) {
    if (!progress.isTracksUnlocked()) {
      setAccess(readAccess());
      return;
    }
    dispatch(action);
  }

  function submitQuestion(event) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("question");
    ensureAccessThen({ type: "submit-question", value });
  }

  function submitCriteria(event) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("criteria");
    ensureAccessThen({ type: "submit-criteria", value });
  }

  function runSample() {
    ensureAccessThen({ type: "run" });
  }

  function submitClassification(event) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("classification");
    ensureAccessThen({ type: "classify", value });
  }

  function nextSample() {
    if (state.step < PERFORMANCE_SAMPLES.length - 1) dispatch({ type: "next" });
    else reviewTitleRef.current?.focus();
  }

  function finishReview(event) {
    event.preventDefault();
    if (!progress.isTracksUnlocked()) {
      setAccess(readAccess());
      return;
    }
    const nextState = performanceLabReducer(state, { type: "submit-review" });
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
            "performance",
            getPerformanceScore(nextState),
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
      <PerformanceRoot>
        <section
          className="performance-locked"
          aria-labelledby="performance-locked-title"
        >
          <span className="label label--cyan">BASE COMUM</span>
          <h1 id="performance-locked-title">
            Conclua a Fase 4 para iniciar esta missão.
          </h1>
          <p>
            Performance independe de Segurança e das outras trilhas. O contexto
            necessário está incluído aqui.
          </p>
          <a
            className="button button--primary"
            href={access.phase4Available ? "phase4.html" : "index.html"}
          >
            {access.phase4Available ? "Continuar Fase 4" : "Voltar à jornada"}
          </a>
        </section>
      </PerformanceRoot>
    );

  const reviewVisible =
    recordCount === PERFORMANCE_SAMPLES.length &&
    state.step === PERFORMANCE_SAMPLES.length - 1 &&
    recorded;

  return (
    <PerformanceRoot>
      {access.readOnly && (
        <PerformanceReadOnlyNotice role="status" aria-live="polite">
          O progresso pertence a uma versão mais recente. Você pode concluir a
          missão, mas o resultado não será salvo.
        </PerformanceReadOnlyNotice>
      )}
      <div id="performance-content" hidden={state.finished}>
        <header className="performance-intro">
          <div>
            <span className="label label--cyan">
              TRILHA 03 · QUALIDADE ESPECIALIZADA
            </span>
            <h1>Como a loja responde ao pico?</h1>
          </div>
          <p>
            Defina a pergunta, simule a campanha e transforme números em um
            parecer sobre a experiência do cliente.
          </p>
        </header>
        <section
          className="performance-briefing performance-panel"
          aria-labelledby="performance-briefing-title"
        >
          <div>
            <span className="label">FIKILY · CANDIDATA FF-2026.11.0</span>
            <h2 id="performance-briefing-title">
              Uma campanha. Até 300 pessoas ao mesmo tempo.
            </h2>
            <p>
              O time prevê até 300 usuários simultâneos pesquisando e filtrando
              produtos no catálogo. Você avaliará a resposta nesse uso previsto
              e, em uma etapa separada, observará o que acontece acima dele.
            </p>
            <p className="performance-note">
              Laboratório local: os números são dados didáticos fixos, sem
              tráfego para a Fikily. Cada etapa representa 60 segundos de
              atividade, exibidos instantaneamente.
            </p>
            <details className="performance-concepts">
              <summary>Antes de começar: como ler as métricas?</summary>
              <p>
                <strong>Usuários simultâneos:</strong> pessoas usando o fluxo ao
                mesmo tempo.
              </p>
              <p>
                <strong>Percentil 95 (p95):</strong> 95% das respostas levaram
                até esse tempo.
              </p>
              <p>
                <strong>Carga</strong> usa o volume previsto;
                <strong> Estresse</strong> ultrapassa esse volume.
              </p>
            </details>
          </div>
          <aside className="performance-scoring">
            <strong>Até 100 XP</strong>
            <p>
              Pergunta + critérios: 20
              <br />3 execuções: 30
              <br />3 classificações: 30
              <br />
              Parecer + justificativa: 20
            </p>
            <small>
              Resposta corrigida: metade dos pontos do item. Ao sair antes de
              concluir, a rodada recomeça.
            </small>
          </aside>
        </section>
        <section
          className="performance-panel performance-planning"
          hidden={Object.keys(state.planning).length === 2}
          aria-label="Planejamento da análise"
        >
          <form
            onSubmit={submitQuestion}
            hidden={Boolean(state.planning.question)}
          >
            <fieldset>
              <legend>1. Qual pergunta esta campanha precisa responder?</legend>
              <label>
                <input type="radio" name="question" value="capacity" required />{" "}
                Busca e filtro mantêm os tempos e erros aceitáveis nos patamares
                até 300 usuários simultâneos?
              </label>
              <label>
                <input type="radio" name="question" value="sanity" required /> A
                correção isolada do HTTP 503 fez o Checkout voltar a abrir?
              </label>
              <label>
                <input type="radio" name="question" value="e2e" required /> Uma
                compra completa mantém dados coerentes do catálogo ao e-mail?
              </label>
            </fieldset>
            <p
              className="performance-feedback"
              role="status"
              hidden={!state.planningFeedback.question}
            >
              {state.planningFeedback.question}
            </p>
            <button className="button button--primary" type="submit">
              Confirmar pergunta
            </button>
          </form>
          <form
            hidden={
              !state.planning.question || Boolean(state.planning.criteria)
            }
            onSubmit={submitCriteria}
          >
            <fieldset>
              <legend tabIndex="-1">
                2. Quais critérios avaliam a carga prevista?
              </legend>
              <label>
                <input type="radio" name="criteria" value="all" required /> Nos
                patamares até 300 usuários: média ≤ 2 s, p95 ≤ 3 s e erros &lt;
                1%, considerados em conjunto.
              </label>
              <label>
                <input type="radio" name="criteria" value="average" required />{" "}
                Basta a média ser ≤ 2 s; respostas lentas e erros não mudam o
                parecer.
              </label>
              <label>
                <input type="radio" name="criteria" value="volume" required />{" "}
                Quanto mais requisições, melhor o resultado.
              </label>
            </fieldset>
            <p
              className="performance-feedback"
              role="status"
              hidden={!state.planningFeedback.criteria}
            >
              {state.planningFeedback.criteria}
            </p>
            <button className="button button--primary" type="submit">
              Definir critérios
            </button>
          </form>
        </section>
        {state.planning.question && state.planning.criteria && (
          <section
            className="performance-workspace"
            aria-label="Bancada de performance"
          >
            <aside className="performance-panel performance-checklist">
              <span className="label label--cyan">SEU PLANO</span>
              <h2>Carga e, depois, estresse.</h2>
              <p>Busca “Mochila” e filtro “Acessórios”, em um mix simulado.</p>
              <dl className="performance-limits">
                <div>
                  <dt>Carga prevista</dt>
                  <dd>Até {PERFORMANCE_LIMITS.users} usuários</dd>
                </div>
                <div>
                  <dt>Média</dt>
                  <dd>≤ {PERFORMANCE_LIMITS.mean} s</dd>
                </div>
                <div>
                  <dt>p95</dt>
                  <dd>≤ {PERFORMANCE_LIMITS.p95} s</dd>
                </div>
                <div>
                  <dt>Erros</dt>
                  <dd>&lt; {PERFORMANCE_LIMITS.errorRate}%</dd>
                </div>
              </dl>
              <p className="performance-counter">
                Evidências classificadas <strong>{recordCount} / 3</strong>
              </p>
              <div
                role="progressbar"
                aria-label="Evidências classificadas"
                aria-valuemin="0"
                aria-valuemax="3"
                aria-valuenow={recordCount}
              >
                <i
                  id="performance-bar"
                  style={{ width: `${(recordCount / 3) * 100}%` }}
                ></i>
              </div>
              <ol>
                {PERFORMANCE_SAMPLES.map((item, index) => (
                  <li
                    key={item.users}
                    aria-current={index === state.step ? "step" : undefined}
                  >
                    <strong>
                      {item.users} usuários ·{" "}
                      {isPerformanceStress(item) ? "Estresse" : "Carga"}
                    </strong>
                    <small>
                      {state.records[index] !== undefined
                        ? "✓ " + getPerformanceClassificationLabel(item)
                        : state.executed.includes(index)
                          ? "Classifique a evidência"
                          : index === state.step
                            ? "Próxima execução"
                            : "Aguardando"}
                    </small>
                  </li>
                ))}
              </ol>
            </aside>
            <div className="performance-lab">
              <section
                className="performance-panel"
                aria-labelledby="performance-run-title"
              >
                <span className="label label--cyan">
                  CHECKPOINT 0{state.step + 1} ·{" "}
                  {isPerformanceStress(sample) ? "ESTRESSE" : "CARGA"}
                </span>
                <h2 id="performance-run-title" ref={runTitleRef} tabIndex="-1">
                  Simular {sample.users} usuários
                </h2>
                <p>
                  {isPerformanceStress(sample)
                    ? "Agora ultrapasse a previsão de 300 usuários e observe a degradação."
                    : "Execute uma janela simulada de 60 segundos e compare as métricas."}
                </p>
                <label className="performance-profile">
                  <input
                    id="performance-profile"
                    type="checkbox"
                    checked={state.profileConfirmed}
                    disabled={state.executed.length > 0}
                    onChange={(event) =>
                      dispatch({
                        type: "set-profile",
                        value: event.target.checked,
                      })
                    }
                  />
                  Confirmo o perfil: 100 → 300 usuários de carga prevista;
                  depois 600 em estresse.
                </label>
                <button
                  className="button button--primary"
                  type="button"
                  disabled={!state.profileConfirmed || executed}
                  onClick={runSample}
                >
                  {executed
                    ? "Patamar executado · +10 XP"
                    : `Simular ${sample.users} usuários`}
                </button>
                {executed && (
                  <div>
                    <div
                      className="performance-browser"
                      aria-label="Prévia da Fikily simulada"
                    >
                      <div className="performance-browser-bar">
                        <span aria-hidden="true">● ● ●</span>
                        <span>fikily.test/catalog</span>
                        <small>Simulado</small>
                      </div>
                      <div className="performance-store">
                        <strong>Fikily · Catálogo</strong>
                        <p>Busca: Mochila · Categoria: Acessórios</p>
                        <div role="status">
                          {isPerformanceStress(sample)
                            ? "Respostas lentas e HTTP 503 em 8% das requisições simuladas."
                            : `Mochila Urbana · R$ 189,90 · Busca e filtro respondem. p95: ${formatPerformanceNumber(sample.p95)} s.`}
                        </div>
                      </div>
                    </div>
                    <dl className="performance-metrics">
                      <div>
                        <dt>Usuários simultâneos</dt>
                        <dd>{formatPerformanceNumber(sample.users)}</dd>
                      </div>
                      <div>
                        <dt>Requisições / 60 s</dt>
                        <dd>
                          {formatPerformanceNumber(sample.requests)} ·{" "}
                          {formatPerformanceNumber(sample.requests / 60)} req/s
                        </dd>
                      </div>
                      <div>
                        <dt>Tempo médio</dt>
                        <dd>{formatPerformanceNumber(sample.mean)} s</dd>
                      </div>
                      <div>
                        <dt>Percentil 95</dt>
                        <dd>{formatPerformanceNumber(sample.p95)} s</dd>
                      </div>
                      <div>
                        <dt>Taxa de erros</dt>
                        <dd>
                          {formatPerformanceNumber(
                            getPerformanceErrorRate(sample),
                          )}
                          % · {formatPerformanceNumber(sample.errors)} erros
                        </dd>
                      </div>
                    </dl>
                    <p className="performance-observed" role="status">
                      {getPerformanceObservation(sample)}
                    </p>
                    <form onSubmit={submitClassification}>
                      <fieldset>
                        <legend>
                          O que este resultado significa para o escopo da
                          análise?
                        </legend>
                        <label>
                          <input
                            type="radio"
                            name="classification"
                            value="meets"
                            required
                            disabled={recorded}
                          />{" "}
                          Atende aos critérios no patamar de carga prevista.
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="classification"
                            value="stress"
                            required
                            disabled={recorded}
                          />{" "}
                          Há degradação no estresse; investigar capacidade acima
                          do uso previsto.
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="classification"
                            value="reject"
                            required
                            disabled={recorded}
                          />{" "}
                          Reprova o teste de carga prevista de até 300 usuários.
                        </label>
                      </fieldset>
                      <p
                        className="performance-feedback"
                        role="status"
                        hidden={!state.classificationFeedback}
                      >
                        {state.classificationFeedback}
                      </p>
                      <button
                        className="button button--ghost"
                        type="submit"
                        disabled={recorded}
                      >
                        Registrar interpretação
                      </button>
                    </form>
                  </div>
                )}
                {recorded && (
                  <button
                    ref={nextRef}
                    className="button button--ghost performance-next"
                    type="button"
                    onClick={nextSample}
                  >
                    {state.step === PERFORMANCE_SAMPLES.length - 1
                      ? "Emitir parecer →"
                      : "Próximo patamar →"}
                  </button>
                )}
              </section>
              <section
                className="performance-panel"
                aria-labelledby="performance-report-title"
              >
                <span className="label label--cyan">CADERNO DE EVIDÊNCIAS</span>
                <h2 id="performance-report-title">Compare antes de decidir.</h2>
                {state.executed.length === 0 ? (
                  <p>
                    Execute os patamares para registrar esperado, observado e
                    impacto.
                  </p>
                ) : (
                  <figure>
                    <figcaption>
                      p95 por patamar · referência de 3 s · escala de 0 a 8 s
                    </figcaption>
                    <ol>
                      {state.executed.map((index) => (
                        <li
                          key={index}
                          data-stress={String(
                            isPerformanceStress(PERFORMANCE_SAMPLES[index]),
                          )}
                        >
                          <span>
                            {PERFORMANCE_SAMPLES[index].users} usuários
                          </span>
                          <span className="performance-chart-track">
                            <i
                              style={{
                                width: `${(PERFORMANCE_SAMPLES[index].p95 / 8) * 100}%`,
                              }}
                            />
                          </span>
                          <strong>
                            {formatPerformanceNumber(
                              PERFORMANCE_SAMPLES[index].p95,
                            )}{" "}
                            s
                          </strong>
                        </li>
                      ))}
                    </ol>
                  </figure>
                )}
                <div>
                  {state.executed.map((index) => (
                    <PerformanceEvidence
                      key={index}
                      state={state}
                      index={index}
                    />
                  ))}
                </div>
              </section>
              {reviewVisible && (
                <section className="performance-panel">
                  <span className="label label--cyan">PARECER TÉCNICO</span>
                  <h2 ref={reviewTitleRef} tabIndex="-1">
                    O que os dados permitem concluir?
                  </h2>
                  <form onSubmit={finishReview}>
                    <fieldset>
                      <legend>
                        Qual é o parecer sobre a FF-2026.11.0 neste teste?
                      </legend>
                      <label>
                        <input
                          type="radio"
                          name="decision"
                          value="scoped"
                          required
                          checked={state.review.decision === "scoped"}
                          onChange={() =>
                            dispatch({
                              type: "set-review",
                              field: "decision",
                              value: "scoped",
                            })
                          }
                        />{" "}
                        Aprovar tecnicamente a carga nos patamares testados até
                        300 usuários e investigar a degradação em 600; decisão
                        de produção permanece pendente.
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="decision"
                          value="reject"
                          required
                          checked={state.review.decision === "reject"}
                          onChange={() =>
                            dispatch({
                              type: "set-review",
                              field: "decision",
                              value: "reject",
                            })
                          }
                        />{" "}
                        Reprovar a carga prevista por haver degradação em 600.
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="decision"
                          value="production"
                          required
                          checked={state.review.decision === "production"}
                          onChange={() =>
                            dispatch({
                              type: "set-review",
                              field: "decision",
                              value: "production",
                            })
                          }
                        />{" "}
                        Aprovar a aplicação para produção.
                      </label>
                    </fieldset>
                    <fieldset>
                      <legend>Qual justificativa sustenta esse parecer?</legend>
                      <label>
                        <input
                          type="radio"
                          name="reason"
                          value="metrics"
                          required
                          checked={state.review.reason === "metrics"}
                          onChange={() =>
                            dispatch({
                              type: "set-review",
                              field: "reason",
                              value: "metrics",
                            })
                          }
                        />{" "}
                        Média, p95 e erros atendem juntos até 300; em 600,
                        investigar estresse.
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
                        Abrir a Home comprova capacidade sob carga.
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="reason"
                          value="sanity"
                          required
                          checked={state.review.reason === "sanity"}
                          onChange={() =>
                            dispatch({
                              type: "set-review",
                              field: "reason",
                              value: "sanity",
                            })
                          }
                        />{" "}
                        Uma correção isolada comprova o desempenho da campanha.
                      </label>
                    </fieldset>
                    <p
                      className="performance-feedback"
                      role="status"
                      hidden={!state.reviewFeedback}
                    >
                      {state.reviewFeedback}
                    </p>
                    <button className="button button--primary" type="submit">
                      Concluir missão com parecer
                    </button>
                  </form>
                </section>
              )}
            </div>
          </section>
        )}
      </div>
      {state.finished && (
        <section
          className="performance-panel performance-result"
          aria-labelledby="performance-result-title"
        >
          <span className="label label--cyan">
            MISSÃO CONCLUÍDA · INTERPRETAÇÃO CORRETA
          </span>
          <h2 ref={resultTitleRef} id="performance-result-title" tabIndex="-1">
            Carga prevista atendida. Estresse com degradação.
          </h2>
          <p>
            Na FF-2026.11.0, os patamares de 100 e 300 usuários atenderam aos
            critérios. Em 600, o p95 de 6,5 s e os 8% de erros revelaram
            degradação. A capacidade máxima exata não foi determinada.
          </p>
          <div className="performance-result-stats">
            <div>
              <span>CHECKPOINTS</span>
              <strong>3 / 3</strong>
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
            <PerformanceReadOnlyNotice role="status">
              O resultado desta tentativa não foi salvo porque o progresso
              pertence a uma versão mais recente.
            </PerformanceReadOnlyNotice>
          )}
          <details className="performance-result-evidence">
            <summary>Revisar métricas e evidências</summary>
            <div>
              {PERFORMANCE_SAMPLES.map((_, index) => (
                <PerformanceEvidence key={index} state={state} index={index} />
              ))}
            </div>
          </details>
          <p className="performance-note">
            A carga testa o uso previsto; o estresse explora volumes acima dele.
            Aprovar tecnicamente essa carga não aprova a aplicação para
            produção.
          </p>
          <div className="performance-result-actions">
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
    </PerformanceRoot>
  );
}

export function mountPerformance(element) {
  createRoot(element).render(<Performance />);
}
