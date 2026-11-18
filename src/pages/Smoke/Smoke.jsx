import React, { useEffect, useReducer, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  createInitialSmokeState,
  getSmokeCheckStatus,
  getSmokeCheck,
  getSmokeReleaseStatus,
  getSmokeScore,
  SMOKE_CHECKS,
  SMOKE_DECISION_OPTIONS,
  SMOKE_IMPACT_OPTIONS,
  smokeTestReducer,
} from "../../../core/smoke-test.js";
import { SmokeReadOnlyNotice, SmokeRoot } from "./Smoke.styles.js";

const progress = window.QAQuestProgress;

function readAccess() {
  return {
    tracksUnlocked: progress.isTracksUnlocked(),
    phase4Available: progress.isPhaseUnlocked(4),
    readOnly: progress.isReadOnly(),
  };
}

function SmokeEvidence({ check }) {
  const facts = [
    ["Ação", check.action + " em fikily.test" + check.path],
    ["Esperado", check.expected],
    ["Observado", check.status + ". " + check.observed],
    ["Impacto", check.impact],
  ];

  return (
    <details className="smoke-evidence-item" data-outcome={check.outcome}>
      <summary>
        <strong>
          {check.title} ·{" "}
          {check.outcome === "pass" ? "Passou" : "Falhou — crítico"}
        </strong>
      </summary>
      {facts.map(([label, value]) => (
        <p key={label}>
          <b>{label}: </b>
          {value}
        </p>
      ))}
    </details>
  );
}

function Smoke() {
  const [state, dispatch] = useReducer(
    smokeTestReducer,
    undefined,
    createInitialSmokeState,
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
  const previousCheckRef = useRef(state.selected);
  const pendingClassificationFocus = useRef(false);
  const pendingNextFocus = useRef(false);
  const selectedCheck = getSmokeCheck(state.selected);
  const recordCount = Object.keys(state.records).length;
  const score = getSmokeScore(state);
  const releaseStatus = getSmokeReleaseStatus(state);
  const observed = state.observed.includes(state.selected);
  const recorded = Boolean(state.records[state.selected]);
  const nextCheck = SMOKE_CHECKS.find((check) => !state.records[check.id]);

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
    if (previousCheckRef.current !== state.selected || attemptNumber > 0)
      checkTitleRef.current?.focus();
    previousCheckRef.current = state.selected;
  }, [state.selected, attemptNumber]);

  useEffect(() => {
    if (!pendingClassificationFocus.current) return;
    pendingClassificationFocus.current = false;
    classificationButtonRef.current?.focus();
  }, [state.observed]);

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

  function selectCheck(id) {
    if (!state.finished && progress.isTracksUnlocked())
      dispatch({ type: "select-check", id });
    else setAccess(readAccess());
  }

  function runCheck() {
    if (state.finished || !progress.isTracksUnlocked()) {
      setAccess(readAccess());
      return;
    }
    pendingClassificationFocus.current = true;
    dispatch({ type: "run-check" });
  }

  function submitClassification(event) {
    event.preventDefault();
    if (state.finished || !progress.isTracksUnlocked()) {
      setAccess(readAccess());
      return;
    }

    const action = {
      type: "classify-check",
      value: event.nativeEvent.submitter?.value,
    };
    const nextState = smokeTestReducer(state, action);
    if (!state.records[state.selected] && nextState.records[state.selected])
      pendingNextFocus.current = true;
    dispatch(action);
  }

  function openNextCheck() {
    if (state.finished || !progress.isTracksUnlocked()) {
      setAccess(readAccess());
      return;
    }
    if (nextCheck) dispatch({ type: "select-check", id: nextCheck.id });
    else reviewDecisionRef.current?.focus();
  }

  function submitReview(event) {
    event.preventDefault();
    if (!progress.isTracksUnlocked()) {
      setAccess(readAccess());
      return;
    }

    const nextState = smokeTestReducer(state, { type: "submit-review" });
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
            "smoke",
            getSmokeScore(nextState),
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
      <SmokeRoot>
        <section
          className="smoke-locked"
          id="smoke-locked"
          aria-labelledby="smoke-locked-title"
        >
          <span className="label label--cyan">BASE COMUM</span>
          <h1 id="smoke-locked-title">
            Conclua a Fase 4 para iniciar esta missão.
          </h1>
          <p>
            O Smoke Test faz parte da Trilha 02. Você pode iniciá-lo
            independentemente da conclusão das outras trilhas.
          </p>
          <a
            className="button button--primary"
            id="smoke-locked-link"
            href={access.phase4Available ? "phase4.html" : "index.html"}
          >
            {access.phase4Available ? "Continuar Fase 4" : "Voltar à jornada"}
          </a>
        </section>
        <qa-support-material mission-id="smoke"></qa-support-material>
      </SmokeRoot>
    );

  return (
    <SmokeRoot>
      {access.readOnly && (
        <SmokeReadOnlyNotice role="status" aria-live="polite">
          O progresso pertence a uma versão mais recente. Você pode concluir a
          missão, mas o resultado não será salvo.
        </SmokeReadOnlyNotice>
      )}
      <qa-support-material mission-id="smoke"></qa-support-material>

      <div id="smoke-content" hidden={state.finished}>
        <header className="smoke-intro">
          <div>
            <span className="label label--cyan">
              TRILHA 02 · CONFIANÇA NA RELEASE
            </span>
            <h1>Primeiro sinal da release.</h1>
          </div>
          <p>
            Uma nova versão da Fikily chegou à homologação. Confira o essencial,
            registre evidências e decida se vale avançar para testes
            aprofundados.
          </p>
        </header>
        <section className="smoke-briefing" aria-labelledby="briefing-title">
          <div>
            <span className="label">RELEASE FF-2026.10 · SIMULAÇÃO LOCAL</span>
            <h2 id="briefing-title">
              Esta versão estável da Fikily pode seguir para testes
              aprofundados?
            </h2>
            <p>
              Faça seis verificações curtas. O parecer vale somente para a
              release FF-2026.10 desta simulação, não para a Fikily como
              produto. Uma falha crítica reprova o Smoke Test e bloqueia esta
              release. Se os checks essenciais passarem, o Smoke Test é aprovado
              e os testes aprofundados podem começar. Aprovar o Smoke não
              significa aprovar a aplicação para produção; essa decisão só vem
              depois de avaliar os testes seguintes. Você conclui esta missão ao
              emitir o parecer correto.
            </p>
          </div>
          <div className="smoke-score-guide">
            <strong>Até 100 XP</strong>
            <span>
              6 classificações × 10 XP
              <br />
              Decisão: 20 XP · Impacto: 20 XP
            </span>
            <small>
              Uma resposta corrigida vale metade dos pontos daquele item.
              Reabrir um check não reduz a pontuação.
            </small>
          </div>
        </section>

        <section
          id="smoke-workspace"
          className="smoke-workspace"
          aria-label="Bancada de Smoke Test"
        >
          <aside
            className="smoke-panel smoke-checklist"
            aria-labelledby="checks-title"
          >
            <span className="label label--cyan">ESCOPO ESSENCIAL</span>
            <h2 id="checks-title">Seis checks. Uma decisão.</h2>
            <div className="smoke-progress-copy">
              <span>Resultados registrados</span>
              <strong id="smoke-count">{recordCount} / 6</strong>
            </div>
            <div
              id="smoke-progress"
              role="progressbar"
              aria-label="Checks registrados"
              aria-valuemin="0"
              aria-valuemax="6"
              aria-valuenow={recordCount}
            >
              <i
                id="smoke-bar"
                style={{
                  width: `${(recordCount / SMOKE_CHECKS.length) * 100}%`,
                }}
              ></i>
            </div>
            <ol id="smoke-checks">
              {SMOKE_CHECKS.map((check, index) => {
                const status = getSmokeCheckStatus(state, check.id);

                return (
                  <li key={check.id}>
                    <button
                      type="button"
                      data-check={check.id}
                      data-outcome={
                        state.records[check.id] ? check.outcome : undefined
                      }
                      aria-pressed={state.selected === check.id}
                      onClick={() => selectCheck(check.id)}
                    >
                      <span className="smoke-check-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span>
                        <strong>{check.title}</strong>
                        <small>{status}</small>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <p className="smoke-checklist__tip">
              Abrir uma página não basta: execute a ação indicada e compare o
              resultado com a expectativa.
            </p>
          </aside>

          <section
            className="smoke-panel smoke-lab"
            aria-labelledby="check-title"
          >
            <header className="smoke-lab__heading">
              <span className="label">VERIFICAÇÃO ATUAL</span>
              <h2 id="check-title" ref={checkTitleRef} tabIndex={-1}>
                {selectedCheck.title}
              </h2>
              <p id="check-expected">Esperado: {selectedCheck.expected}</p>
            </header>
            <div
              className="smoke-browser"
              aria-label="Ambiente fictício Fikily"
            >
              <div className="smoke-browser__bar">
                <span aria-hidden="true">● ● ●</span>
                <span id="smoke-address">fikily.test{selectedCheck.path}</span>
                <span className="smoke-simulation-label">Simulado</span>
              </div>
              <div className="smoke-store">
                <header className="smoke-store__nav">
                  <strong>
                    <b>F</b> Fikily
                  </strong>
                  <span>Homologação · FF-2026.10</span>
                </header>
                <div className="smoke-store__body">
                  <span className="smoke-store__kicker">
                    {selectedCheck.title.toLocaleUpperCase("pt-BR")}
                  </span>
                  <h3>{selectedCheck.previewTitle}</h3>
                  <p>{selectedCheck.previewDescription}</p>
                  <button
                    className="smoke-store-button"
                    id="run-smoke-check"
                    type="button"
                    disabled={observed}
                    onClick={runCheck}
                  >
                    {observed ? "Ação executada" : selectedCheck.action}
                  </button>
                  <section
                    className="smoke-observation"
                    id="smoke-observation"
                    data-outcome={selectedCheck.outcome}
                    aria-labelledby="observation-title"
                    hidden={!observed}
                  >
                    <span id="observation-status" className="smoke-http-status">
                      {selectedCheck.status}
                    </span>
                    <h4 id="observation-title">Resultado observado</h4>
                    <p id="observation-description">{selectedCheck.observed}</p>
                    <pre id="observation-detail">{selectedCheck.detail}</pre>
                  </section>
                </div>
              </div>
            </div>
            <form
              className="smoke-classification"
              id="smoke-classification"
              hidden={!observed}
              onSubmit={submitClassification}
            >
              <fieldset>
                <legend>O resultado atende à expectativa deste check?</legend>
                <div className="smoke-classification__actions">
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
                id="classification-feedback"
                role="status"
                aria-live="polite"
                hidden={!state.classificationFeedback}
              >
                {state.classificationFeedback}
              </p>
            </form>
            <button
              ref={nextButtonRef}
              className="button button--ghost smoke-next"
              id="next-smoke-check"
              type="button"
              hidden={!recorded}
              onClick={openNextCheck}
            >
              {nextCheck
                ? "Abrir próximo check →"
                : "Revisar e emitir parecer →"}
            </button>
          </section>

          <aside
            className="smoke-panel smoke-report"
            aria-labelledby="report-title"
          >
            <span className="label label--cyan">RELATÓRIO DA RELEASE</span>
            <h2 id="report-title">Evidências para o parecer técnico.</h2>
            <p
              id="smoke-release-status"
              className="smoke-release-status"
              data-blocked={String(releaseStatus.blocked)}
              role="status"
            >
              {releaseStatus.text}
            </p>
            <p className="smoke-empty">
              Abra cada evidência registrada para consultar ação, expectativa,
              resultado e impacto.
            </p>
            <div id="smoke-evidence" aria-live="polite">
              {recordCount ? (
                SMOKE_CHECKS.filter((check) => state.records[check.id]).map(
                  (check) => <SmokeEvidence key={check.id} check={check} />,
                )
              ) : (
                <p className="smoke-empty">
                  Os resultados aparecerão aqui depois que você os classificar
                  corretamente.
                </p>
              )}
            </div>
            <p
              id="smoke-review-hint"
              hidden={recordCount === SMOKE_CHECKS.length}
            >
              Registre os seis checks para emitir o parecer final.
            </p>
            <form
              id="smoke-review"
              className="smoke-review"
              hidden={recordCount !== SMOKE_CHECKS.length}
              onSubmit={submitReview}
            >
              <fieldset>
                <legend>
                  Qual é o parecer técnico do Smoke Test desta versão?
                </legend>
                {SMOKE_DECISION_OPTIONS.map(({ value, label }, index) => (
                  <label key={value}>
                    <input
                      ref={index === 0 ? reviewDecisionRef : null}
                      type="radio"
                      name="decision"
                      value={value}
                      required
                      checked={state.decision === value}
                      onChange={() => dispatch({ type: "set-decision", value })}
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
              <fieldset>
                <legend>Qual impacto justifica sua decisão?</legend>
                {SMOKE_IMPACT_OPTIONS.map(({ value, label }) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="impact"
                      value={value}
                      required
                      checked={state.impact === value}
                      onChange={() => dispatch({ type: "set-impact", value })}
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
              <p
                id="smoke-review-feedback"
                role="status"
                aria-live="polite"
                hidden={!state.reviewFeedback}
              >
                {state.reviewFeedback}
              </p>
              <button className="button button--primary" type="submit">
                Emitir parecer da release
              </button>
            </form>
          </aside>
        </section>
      </div>

      {state.finished && (
        <section
          className="smoke-result smoke-panel"
          id="smoke-result"
          aria-labelledby="smoke-result-title"
        >
          <span className="label label--cyan">
            MISSÃO CONCLUÍDA · PARECER DE QA CORRETO
          </span>
          <h2 id="smoke-result-title" ref={resultTitleRef} tabIndex={-1}>
            Smoke reprovado. Release bloqueada.
          </h2>
          <p>
            Você concluiu a missão porque identificou as falhas críticas e
            emitiu o parecer técnico correto. A release FF-2026.10 foi reprovada
            no Smoke Test e está bloqueada para testes aprofundados; isso não
            reprova a Fikily como produto. Concluir a missão registra seu
            diagnóstico, não aprova a release. Uma nova versão precisará passar
            pelo Smoke Test antes de liberar testes aprofundados. A aprovação
            para produção será decidida depois, com base nos resultados dessas
            etapas.
          </p>
          <div className="smoke-result__stats">
            <div>
              <span>CHECKS</span>
              <strong>6 / 6</strong>
            </div>
            <div>
              <span>FALHAS CRÍTICAS</span>
              <strong>2</strong>
            </div>
            <div>
              <span>NESTA TENTATIVA</span>
              <strong id="smoke-result-xp">{score} XP</strong>
            </div>
          </div>
          <p id="smoke-result-summary">
            {savedProgress
              ? "Missão concluída com o parecer técnico correto: o Smoke Test da release FF-2026.10 foi reprovado e somente esta release está bloqueada. Melhor resultado: " +
                savedProgress.bestXp +
                " XP · Tentativas concluídas: " +
                savedProgress.attempts +
                " · XP compartilhado: " +
                savedProgress.totalXp +
                "."
              : "Missão concluída com o parecer técnico correto. O resultado desta tentativa não foi salvo; o progresso existente foi preservado."}
          </p>
          <qa-save-status ref={saveStatusRef}></qa-save-status>
          {saveBlocked && (
            <SmokeReadOnlyNotice role="status" aria-live="polite">
              Resultado calculado, mas não salvo. Atualize o QA Quest antes de
              salvar o progresso.
            </SmokeReadOnlyNotice>
          )}
          <details className="smoke-result__evidence">
            <summary>Consultar as seis evidências</summary>
            <div id="smoke-result-evidence">
              {SMOKE_CHECKS.map((check) => (
                <SmokeEvidence key={check.id} check={check} />
              ))}
            </div>
          </details>
          <details className="smoke-result__example">
            <summary>Ver um exemplo de Smoke Test aprovado</summary>
            <p>
              <strong>Exemplo hipotético, não executado nesta missão:</strong>{" "}
              após corrigir os defeitos, uma nova versão passa pelos checks
              essenciais. Parecer técnico: “Smoke Test aprovado; testes
              aprofundados liberados”. Isso ainda não aprova a aplicação para
              produção.
            </p>
          </details>
          <p className="smoke-learning">
            Smoke verifica rapidamente se os fluxos essenciais estão
            disponíveis. Um Smoke Test aprovado libera o início de testes
            aprofundados, mas, sozinho, não aprova a aplicação para produção. A
            missão está concluída; a release simulada continua bloqueada.
          </p>
          <div className="smoke-result__actions">
            <button
              className="button button--primary"
              id="restart-smoke"
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
    </SmokeRoot>
  );
}

export function mountSmoke(element) {
  if (!element)
    throw new Error("Elemento de montagem da missão Smoke não encontrado.");
  createRoot(element).render(<Smoke />);
}
