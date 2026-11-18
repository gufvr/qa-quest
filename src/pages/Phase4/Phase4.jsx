import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  calculateStepPercentage,
  calculateStepXp,
  getMetricScore,
  getRecommendedOptions,
  getResultMessage,
  isSelectionValid,
  metricNames,
  planningSteps,
} from "../../../core/phase4-planning.js";
import { PlanningRoot, ReadOnlyNotice } from "./Phase4.styles.js";

const progress = window.QAQuestProgress;
const initialStep = 0;

function Phase4() {
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep);
  const [selectedIds, setSelectedIds] = useState([]);
  const [records, setRecords] = useState([]);
  const [earnedXp, setEarnedXp] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [decisionError, setDecisionError] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [readOnly, setReadOnly] = useState(() => progress.isReadOnly());
  const [saveBlocked, setSaveBlocked] = useState(false);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const decisionTitleRef = useRef(null);
  const nextButtonRef = useRef(null);
  const resultTitleRef = useRef(null);
  const saveStatusRef = useRef(null);
  const currentStep = planningSteps[currentStepIndex];
  const selectedOptions = currentStep.options.filter(({ id }) =>
    selectedIds.includes(id),
  );
  const progressPercentage =
    ((currentStepIndex + 1) / planningSteps.length) * 100;
  const metricScores = Object.fromEntries(
    metricNames.map((metricName) => [
      metricName,
      getMetricScore(records, metricName),
    ]),
  );

  useEffect(() => {
    const headerXp = document.querySelector("#header-xp");
    if (headerXp) headerXp.textContent = String(earnedXp);
  }, [earnedXp]);

  useEffect(() => {
    const refreshReadOnly = () => setReadOnly(progress.isReadOnly());
    const refreshFromStorage = (event) => {
      if (event.key === progress.storageKey || event.key === null)
        refreshReadOnly();
    };
    const refreshWhenVisible = () => {
      if (!document.hidden) refreshReadOnly();
    };

    window.addEventListener("qaquest:progress", refreshReadOnly);
    window.addEventListener("storage", refreshFromStorage);
    window.addEventListener("pageshow", refreshReadOnly);
    window.addEventListener("focus", refreshReadOnly);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.removeEventListener("qaquest:progress", refreshReadOnly);
      window.removeEventListener("storage", refreshFromStorage);
      window.removeEventListener("pageshow", refreshReadOnly);
      window.removeEventListener("focus", refreshReadOnly);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  useEffect(() => {
    if (currentStepIndex > initialStep || attemptNumber > 0)
      decisionTitleRef.current?.focus();
  }, [currentStepIndex, attemptNumber]);

  useEffect(() => {
    if (feedback) nextButtonRef.current?.focus();
  }, [feedback]);

  useEffect(() => {
    if (isComplete) resultTitleRef.current?.focus();
  }, [isComplete]);

  function updateSelection(optionId, checked) {
    setSelectedIds((current) => {
      if (currentStep.type === "single")
        return checked ? [optionId] : current.filter((id) => id !== optionId);
      if (checked) return [...current, optionId];
      return current.filter((id) => id !== optionId);
    });
    setDecisionError("");
  }

  function evaluateDecision(event) {
    event.preventDefault();
    if (feedback) return;

    if (!isSelectionValid(currentStep, selectedIds)) {
      setDecisionError(
        currentStep.max === 1
          ? "Escolha uma alternativa antes de continuar."
          : `Selecione exatamente ${currentStep.max} alternativas antes de continuar.`,
      );
      return;
    }

    const percentage = calculateStepPercentage(
      currentStep,
      selectedOptions,
    );
    const points = calculateStepXp(currentStep, selectedOptions);
    setEarnedXp((current) => current + points);
    setRecords((current) => [
      ...current,
      {
        id: currentStep.id,
        shortTitle: currentStep.shortTitle,
        selected: selectedOptions,
        percentage,
        metrics: currentStep.metrics,
      },
    ]);
    setFeedback({
      points,
      percentage,
      recommended: getRecommendedOptions(currentStep),
    });
  }

  function finishPlanning() {
    setIsComplete(true);
    setSaveBlocked(false);
    saveStatusRef.current?.reset();

    if (progress.isReadOnly()) {
      setReadOnly(true);
      setSaveBlocked(true);
      return;
    }

    let savedProgress;
    try {
      savedProgress = progress.saveMissionResult("phase4", earnedXp);
    } catch (error) {
      if (!progress.isReadOnly()) throw error;
      setReadOnly(true);
      setSaveBlocked(true);
      return;
    }

    if (!saveStatusRef.current)
      throw new Error("Componente de status de salvamento não encontrado.");
    saveStatusRef.current.show(savedProgress);
  }

  function goToNextStep() {
    if (!feedback) return;
    if (currentStepIndex === planningSteps.length - 1) {
      finishPlanning();
      return;
    }

    setCurrentStepIndex((current) => current + 1);
    setSelectedIds([]);
    setFeedback(null);
    setDecisionError("");
  }

  function restartPlanning() {
    setCurrentStepIndex(initialStep);
    setSelectedIds([]);
    setRecords([]);
    setEarnedXp(0);
    setFeedback(null);
    setDecisionError("");
    setIsComplete(false);
    setReadOnly(progress.isReadOnly());
    setSaveBlocked(false);
    setAttemptNumber((current) => current + 1);
    saveStatusRef.current?.reset();
  }

  function createGeneratedPlan() {
    return records.map((record) => (
      <section className="generated-plan__section" key={record.id}>
        <h4>{record.shortTitle}</h4>
        <ul>
          {record.selected.map((option) => (
            <li key={option.id}>{option.label}</li>
          ))}
        </ul>
      </section>
    ));
  }

  return (
    <PlanningRoot>
      <section
        className="planning-workspace"
        id="planning-workspace"
        hidden={isComplete}
      >
        <aside className="context-panel" aria-labelledby="context-title">
          <div className="planning-panel__heading">
            <span aria-hidden="true">▤</span>
            <div>
              <small>BRIEFING DA RELEASE</small>
              <strong id="context-title">Checkout 3.0</strong>
            </div>
          </div>

          <div className="context-section">
            <span>OBJETIVO DO NEGÓCIO</span>
            <p>
              Permitir que clientes finalizem pedidos usando cartão ou Pix e
              apliquem cupons promocionais antes do pagamento.
            </p>
          </div>

          <div className="context-section">
            <span>ESCOPO INFORMADO</span>
            <ul>
              <li>Resumo do pedido e endereço de entrega.</li>
              <li>Cupom percentual ou de valor fixo.</li>
              <li>Pagamento via cartão e Pix.</li>
              <li>Criação do pedido após confirmação.</li>
            </ul>
          </div>

          <div className="context-section">
            <span>RESTRIÇÕES</span>
            <dl className="release-facts">
              <div>
                <dt>Prazo inicial</dt>
                <dd>5 dias</dd>
              </div>
              <div>
                <dt>Equipe</dt>
                <dd>1 QA + 3 devs</dd>
              </div>
              <div>
                <dt>Ambiente</dt>
                <dd>fikily.test/checkout (simulado)</dd>
              </div>
              <div>
                <dt>Release</dt>
                <dd>Sexta, 18h</dd>
              </div>
            </dl>
          </div>

          <div className="context-note">
            <span aria-hidden="true">!</span>
            <p>
              O gateway de pagamento está disponível apenas em modo sandbox.
            </p>
          </div>
        </aside>

        <section className="decision-panel" aria-labelledby="decision-title">
          <div className="decision-progress">
            <div>
              <span>
                ETAPA {currentStepIndex + 1} DE {planningSteps.length}
              </span>
              <strong>{earnedXp} / 100 XP</strong>
            </div>
            <div
              className="decision-progress__track"
              role="progressbar"
              aria-label="Progresso do plano"
              aria-valuemin="1"
              aria-valuemax={planningSteps.length}
              aria-valuenow={currentStepIndex + 1}
            >
              <i style={{ width: `${progressPercentage}%` }} />
            </div>
          </div>

          <div
            className="deadline-alert"
            role="status"
            hidden={currentStepIndex < 5}
          >
            <span aria-hidden="true">⚡</span>
            <div>
              <strong>Mudança de contexto</strong>
              <p>
                A direção antecipou a release. Restam apenas 2 dias para
                testar.
              </p>
            </div>
          </div>

          <form
            className="decision-form"
            id="decision-form"
            onSubmit={evaluateDecision}
          >
            <fieldset>
              <legend className="decision-kicker">{currentStep.kicker}</legend>
              <h2 id="decision-title" ref={decisionTitleRef} tabIndex={-1}>
                {currentStep.title}
              </h2>
              <p>{currentStep.instruction}</p>
              <span className="selection-hint">
                {currentStep.max === 1
                  ? "Escolha uma alternativa."
                  : `Selecione exatamente ${currentStep.max} alternativas.`}
              </span>
              <div className="decision-options">
                {currentStep.options.map((option) => {
                  const checked = selectedIds.includes(option.id);
                  const disabled =
                    feedback !== null ||
                    (currentStep.type === "multi" &&
                      !checked &&
                      selectedIds.length >= currentStep.max);
                  const isRecommended = feedback?.recommended.some(
                    ({ id }) => id === option.id,
                  );
                  const classNames = [
                    "decision-option",
                    isRecommended && checked && "is-revealed-correct",
                    isRecommended && !checked && "is-revealed-missed",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <label className={classNames} key={option.id}>
                      <input
                        type={
                          currentStep.type === "single" ? "radio" : "checkbox"
                        }
                        name="planning-decision"
                        value={option.id}
                        checked={checked}
                        disabled={disabled}
                        onChange={(event) =>
                          updateSelection(option.id, event.target.checked)
                        }
                      />
                      <span
                        className="decision-option__control"
                        aria-hidden="true"
                      />
                      <span className="decision-option__copy">
                        <strong>{option.label}</strong>
                        <small>{option.detail}</small>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {decisionError && (
              <p className="decision-error" role="alert">
                {decisionError}
              </p>
            )}
            <button
              className="button button--primary decision-submit"
              type="submit"
              disabled={
                feedback !== null ||
                !isSelectionValid(currentStep, selectedIds)
              }
              hidden={feedback !== null}
            >
              Confirmar decisão <span aria-hidden="true">→</span>
            </button>
          </form>

          {feedback && (
            <div
              className={`decision-feedback ${
                feedback.percentage >= 0.75
                  ? ""
                  : feedback.percentage >= 0.4
                    ? "is-partial"
                    : "is-low"
              }`.trim()}
              role="status"
              aria-live="polite"
            >
              <span
                className="decision-feedback__icon"
                aria-hidden="true"
              >
                {feedback.percentage >= 0.75
                  ? "✓"
                  : feedback.percentage >= 0.4
                    ? "!"
                    : "↗"}
              </span>
              <div>
                <strong>
                  {feedback.points} de {currentStep.points} XP nesta decisão
                </strong>
                <p>{currentStep.feedback}</p>
                <small>
                  Referência:{" "}
                  {feedback.recommended
                    .map((option) => option.label)
                    .join("; ")}
                  .
                </small>
              </div>
            </div>
          )}

          {readOnly && (
            <ReadOnlyNotice role="status" aria-live="polite">
              O progresso pertence a uma versão mais recente. Você pode
              concluir a missão, mas o resultado não será salvo.
            </ReadOnlyNotice>
          )}

          <button
            className="button button--primary decision-next"
            type="button"
            ref={nextButtonRef}
            hidden={!feedback}
            onClick={goToNextStep}
          >
            {currentStepIndex === planningSteps.length - 1
              ? "Ver plano final"
              : "Próxima etapa"}{" "}
            <span aria-hidden="true">→</span>
          </button>
        </section>

        <aside className="plan-panel" aria-labelledby="plan-preview-title">
          <div className="planning-panel__heading">
            <span aria-hidden="true">◎</span>
            <div>
              <small>PLANO EM CONSTRUÇÃO</small>
              <strong id="plan-preview-title">Indicadores</strong>
            </div>
          </div>

          <div className="plan-metrics">
            {[
              ["coverage", "Cobertura"],
              ["risk", "Riscos"],
              ["feasibility", "Viabilidade"],
            ].map(([metricName, label]) => (
              <div className="plan-metric" key={metricName}>
                <div>
                  <span>{label}</span>
                  <strong>{metricScores[metricName]}%</strong>
                </div>
                <div>
                  <i style={{ width: `${metricScores[metricName]}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="plan-preview">
            <div>
              <strong>Decisões registradas</strong>
              <span>
                {records.length} / {planningSteps.length}
              </span>
            </div>
            <ol>
              {records.length === 0 ? (
                <li>Suas escolhas formarão o plano final.</li>
              ) : (
                records.map((record) => (
                  <li key={record.id}>
                    <span>{record.shortTitle.toUpperCase()}</span>
                    <strong>
                      {record.selected
                        .map((option) => option.label)
                        .join(" · ")}
                    </strong>
                  </li>
                ))
              )}
            </ol>
          </div>

          <div className="mentor-tip">
            <span aria-hidden="true">✦</span>
            <div>
              <strong>Dica da mentoria</strong>
              <p>{currentStep.tip}</p>
            </div>
          </div>
        </aside>
      </section>

      <section
        className="planning-result"
        id="planning-result"
        hidden={!isComplete}
        aria-labelledby="planning-result-title"
      >
        <div className="planning-result__icon" aria-hidden="true">
          ✓
        </div>
        <span className="label label--cyan">PLANO FINALIZADO</span>
        <h2 id="planning-result-title" ref={resultTitleRef} tabIndex={-1}>
          Sua estratégia está pronta.
        </h2>
        <p>{getResultMessage(earnedXp)}</p>
        <qa-save-status ref={saveStatusRef}></qa-save-status>
        {saveBlocked && (
          <ReadOnlyNotice role="status" aria-live="polite">
            Resultado calculado, mas não salvo. Atualize o QA Quest antes de
            salvar o progresso.
          </ReadOnlyNotice>
        )}

        <div className="planning-result__stats">
          <div>
            <span>COBERTURA</span>
            <strong>{metricScores.coverage}%</strong>
          </div>
          <div>
            <span>RISCOS</span>
            <strong>{metricScores.risk}%</strong>
          </div>
          <div>
            <span>VIABILIDADE</span>
            <strong>{metricScores.feasibility}%</strong>
          </div>
          <div>
            <span>EXPERIÊNCIA</span>
            <strong>
              <span>{earnedXp}</span> XP
            </strong>
          </div>
        </div>

        <div className="generated-plan" aria-labelledby="generated-plan-title">
          <div className="generated-plan__heading">
            <div>
              <span>DOCUMENTO GERADO</span>
              <h3 id="generated-plan-title">
                Plano de Testes · Checkout 3.0
              </h3>
            </div>
            <span className="generated-plan__status">PRONTO PARA REVISÃO</span>
          </div>
          <div className="generated-plan__grid">{createGeneratedPlan()}</div>
        </div>

        <div className="planning-result__actions">
          <a className="button button--primary" href="tracks.html">
            Explorar trilhas <span aria-hidden="true">→</span>
          </a>
          <button
            className="button button--ghost"
            type="button"
            onClick={restartPlanning}
          >
            Criar outro plano
          </button>
          <a className="button button--ghost" href="index.html">
            Voltar à jornada
          </a>
        </div>
      </section>
    </PlanningRoot>
  );
}

export function mountPhase4(element) {
  createRoot(element).render(<Phase4 />);
}
