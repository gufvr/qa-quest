import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AutomationReadOnlyNotice,
  AutomationRoot,
} from "./Automation.styles.js";

export function createAutomationFramework(config) {
  function Framework() {
    const [session, setSession] = useState(config.createSession);
    const [access, setAccess] = useState(() => ({
      tracksUnlocked: window.QAQuestProgress.isTracksUnlocked(),
      phase4Available: window.QAQuestProgress.isPhaseUnlocked(4),
      readOnly: window.QAQuestProgress.isReadOnly(),
    }));
    const [savedProgress, setSavedProgress] = useState(null);
    const [saveBlocked, setSaveBlocked] = useState(false);
    const [actionOrder, setActionOrder] = useState([...config.initialOrder]);
    const [feedback, setFeedback] = useState("");
    const [finished, setFinished] = useState(false);
    const titleRef = useRef(null);
    const resultRef = useRef(null);
    const saveStatusRef = useRef(null);

    const progress = window.QAQuestProgress;
    const step = config.steps[session.step];
    const awarded = Boolean(session.awards[step.id]);
    const score = config.score(session);

    useEffect(() => {
      const refresh = () => {
        setAccess({
          tracksUnlocked: progress.isTracksUnlocked(),
          phase4Available: progress.isPhaseUnlocked(4),
          readOnly: progress.isReadOnly(),
        });
      };
      const storage = (event) => {
        if (event.key === progress.storageKey || event.key === null) refresh();
      };
      const visible = () => {
        if (!document.hidden) refresh();
      };
      window.addEventListener("qaquest:progress", refresh);
      window.addEventListener("storage", storage);
      window.addEventListener("pageshow", refresh);
      window.addEventListener("focus", refresh);
      document.addEventListener("visibilitychange", visible);
      return () => {
        window.removeEventListener("qaquest:progress", refresh);
        window.removeEventListener("storage", storage);
        window.removeEventListener("pageshow", refresh);
        window.removeEventListener("focus", refresh);
        document.removeEventListener("visibilitychange", visible);
      };
    }, []);

    useEffect(() => {
      const headerXp = document.querySelector("#header-xp");
      if (headerXp) headerXp.textContent = String(score);
    }, [score]);

    useEffect(() => {
      titleRef.current?.focus();
    }, [session.step]);

    useEffect(() => {
      if (finished) resultRef.current?.focus();
    }, [finished]);

    useEffect(() => {
      if (!finished) return;
      if (!savedProgress) {
        saveStatusRef.current?.reset();
        return;
      }
      if (!saveStatusRef.current)
        throw new Error("Componente de status de salvamento não encontrado.");
      saveStatusRef.current.show(savedProgress);
    }, [finished, savedProgress]);

    function moveAction(id, offset) {
      const current = actionOrder.indexOf(id);
      const target = current + offset;
      if (target < 0 || target >= actionOrder.length) return;
      const next = [...actionOrder];
      [next[current], next[target]] = [next[target], next[current]];
      setActionOrder(next);
    }

    function runProfile(profile) {
      if (!config.recordRun) return;
      setSession((current) => config.recordRun(current, profile));
    }

    function runCounterexample() {
      if (!config.counterexample) return;
      setSession((current) => config.counterexample(current));
    }

    function submitAnswer(event) {
      event.preventDefault();
      if (awarded) return;
      const data = new FormData(event.currentTarget);
      let answer;
      if (step.kind === "order") answer = actionOrder;
      else if (step.kind === "diagnosis" && config.profiles) {
        answer = Object.fromEntries(
          config.profiles.map((profile) => [profile.id, data.get(profile.id)]),
        );
      } else {
        const fields = config.fields[step.id] || [];
        if (fields.length === 1 && fields[0].kind !== "select") {
          answer = data.get(fields[0].name);
        } else if (fields.length) {
          answer = Object.fromEntries(
            fields.map((field) => [field.name, data.get(field.name)]),
          );
        } else {
          answer = data.get("answer");
        }
      }
      const result = config.answerStep(session, answer);
      setSession(result.session);
      setFeedback(result.feedback);
    }

    function nextStep() {
      if (!awarded) return;
      const next = config.advance(session);
      if (config.isComplete(next) && next.step === session.step) {
        completeMission(next);
        return;
      }
      setSession(next);
      setFeedback("");
      if (config.initialOrder) setActionOrder([...config.initialOrder]);
    }

    function completeMission(nextSession) {
      setSaveBlocked(false);
      setSavedProgress(null);
      saveStatusRef.current?.reset();
      if (progress.isReadOnly()) {
        setSaveBlocked(true);
        setAccess({
          tracksUnlocked: progress.isTracksUnlocked(),
          phase4Available: progress.isPhaseUnlocked(4),
          readOnly: progress.isReadOnly(),
        });
        setFinished(true);
        return;
      }
      let result;
      try {
        result = progress.saveMissionResult(
          config.missionId,
          config.score(nextSession),
        );
      } catch (error) {
        if (!progress.isReadOnly()) throw error;
        setSaveBlocked(true);
        setFinished(true);
        return;
      }
      setSavedProgress(result);
      setFinished(true);
    }

    function restartMission() {
      setSession(config.createSession());
      setActionOrder([...config.initialOrder]);
      setSavedProgress(null);
      setSaveBlocked(false);
      setFeedback("");
      setFinished(false);
      saveStatusRef.current?.reset();
    }

    if (!access.tracksUnlocked)
      return (
        <AutomationRoot>
          <section
            className={`${config.prefix}-locked`}
            aria-labelledby={`${config.prefix}-locked-title`}
          >
            <span className="label label--cyan">BASE COMUM</span>
            <h1 id={`${config.prefix}-locked-title`}>
              Conclua a Fase 4 para começar.
            </h1>
            <p>{config.lockedText}</p>
            <a
              className="button button--primary"
              href={access.phase4Available ? "phase4.html" : "jornada.html"}
            >
              {access.phase4Available ? "Continuar Fase 4" : "Voltar à jornada"}
            </a>
          </section>
        </AutomationRoot>
      );

    const fields = config.fields[step.id] || [];
    const completed = Object.keys(session.awards).length;

    return (
      <AutomationRoot>
        {access.readOnly && (
          <AutomationReadOnlyNotice role="status" aria-live="polite">
            O progresso pertence a uma versão mais recente. Você pode concluir a
            missão, mas o resultado não será salvo.
          </AutomationReadOnlyNotice>
        )}
        <header className={`${config.prefix}-intro`}>
          <span className="label label--cyan">{config.trackLabel}</span>
          <h1>{config.title}</h1>
          <p>{config.description}</p>
        </header>
        {!finished && (
          <div>
            <section
              className={`${config.prefix}-panel ${config.prefix}-briefing`}
            >
              <div>
                <span className="label">{config.candidateLabel}</span>
                <h2>{config.briefingTitle}</h2>
                <p>{config.briefingText}</p>
                <p className={`${config.prefix}-notice`}>
                  Simulação local. Nenhum framework, navegador ou código real é
                  executado pelo QA Quest.
                </p>
              </div>
              <div className={`${config.prefix}-objective`}>
                <strong>
                  7 etapas
                  <br />
                  100 XP
                </strong>
              </div>
            </section>
            <section
              className={`${config.prefix}-workspace`}
              aria-label="Laboratório de automação"
            >
              <div className={`${config.prefix}-heading`}>
                <h2>Seu teste em construção</h2>
                <span>
                  Etapa {session.step + 1} de {config.steps.length} · {score} XP
                  nesta rodada
                </span>
              </div>
              <progress
                max={config.steps.length}
                value={completed}
                aria-label="Etapas concluídas"
              >
                {completed} de {config.steps.length}
              </progress>
              <ol className={`${config.prefix}-checkpoints`}>
                {config.steps.map((item, index) => (
                  <li
                    key={item.id}
                    aria-current={index === session.step ? "step" : undefined}
                    className={
                      session.awards[item.id] !== undefined
                        ? `${config.prefix}-checkpoint--done`
                        : undefined
                    }
                  >
                    {String(index + 1).padStart(2, "0")} · {item.title}
                    {session.awards[item.id] !== undefined
                      ? " · concluída"
                      : ""}
                  </li>
                ))}
              </ol>
              <section
                className={`${config.prefix}-panel ${config.prefix}-task`}
              >
                <span className="label label--cyan">
                  ETAPA {session.step + 1} · ATÉ {step.points} XP
                </span>
                <h3 ref={titleRef} tabIndex="-1">
                  {step.title}
                </h3>
                <p>{step.instruction}</p>
                {step.kind === "diagnosis" &&
                  (config.runProfiles || config.profiles) && (
                    <div>
                      {(config.runProfiles || config.profiles).map(
                        (profile) => (
                          <button
                            key={profile.id}
                            className="button button--ghost"
                            type="button"
                            onClick={() => runProfile(profile.id)}
                          >
                            Simular {profile.label}
                          </button>
                        ),
                      )}
                    </div>
                  )}
                {config.counterexample && step.kind === "assertions" && (
                  <button
                    className="button button--ghost"
                    type="button"
                    onClick={runCounterexample}
                  >
                    Simular contraprova
                  </button>
                )}
                {config.counterexample && step.kind === "checks" && (
                  <button
                    className="button button--ghost"
                    type="button"
                    onClick={runCounterexample}
                  >
                    Simular mensagem positiva com total incorreto
                  </button>
                )}
                <form onSubmit={submitAnswer}>
                  {step.kind === "order" ? (
                    <ol className={`${config.prefix}-order`}>
                      {actionOrder.map((id, index) => {
                        const action = config.actions.find(
                          (item) => item.id === id,
                        );
                        return (
                          <li key={id}>
                            <code>{action.code}</code>
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => moveAction(id, -1)}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              disabled={index === actionOrder.length - 1}
                              onClick={() => moveAction(id, 1)}
                            >
                              ↓
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  ) : step.kind === "choice" ||
                    (fields.length === 1 && fields[0].kind === "radio") ? (
                    (step.options || fields[0]?.options || []).map(
                      ([value, text]) => (
                        <label key={value}>
                          <input
                            type="radio"
                            name="answer"
                            value={value}
                            required
                          />
                          {text}
                        </label>
                      ),
                    )
                  ) : (
                    fields.map((field) =>
                      field.kind === "radio" ? (
                        field.options.map(([value, text]) => (
                          <label key={`${field.name}-${value}`}>
                            <input
                              type="radio"
                              name={field.name}
                              value={value}
                              required
                            />
                            {text}
                          </label>
                        ))
                      ) : (
                        <label key={field.name}>
                          {field.label}
                          <select name={field.name} required defaultValue="">
                            <option value="" disabled>
                              Escolha uma opção
                            </option>
                            {field.options.map(([value, text]) => (
                              <option key={value} value={value}>
                                {text}
                              </option>
                            ))}
                          </select>
                        </label>
                      ),
                    )
                  )}
                  {step.kind === "diagnosis" &&
                    config.profiles &&
                    config.profiles.map((profile) => (
                      <label key={profile.id}>
                        {profile.label}
                        <select name={profile.id} required defaultValue="">
                          <option value="" disabled>
                            Escolha uma classificação
                          </option>
                          {config.diagnosisOptions.map(([value, text]) => (
                            <option key={value} value={value}>
                              {text}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  <p role="status">{feedback}</p>
                  {awarded ? (
                    <button
                      className="button button--primary"
                      type="button"
                      onClick={nextStep}
                    >
                      {session.step === config.steps.length - 1
                        ? "Concluir missão e salvar →"
                        : "Próxima etapa →"}
                    </button>
                  ) : (
                    <button className="button button--primary" type="submit">
                      Conferir etapa
                    </button>
                  )}
                </form>
                <pre tabIndex="0" aria-label="Código didático">
                  <code>{config.buildCode(session)}</code>
                </pre>
              </section>
            </section>
          </div>
        )}
        {finished && (
          <section className={`${config.prefix}-panel ${config.prefix}-result`}>
            <span className="label label--cyan">MISSÃO CONCLUÍDA</span>
            <h2 ref={resultRef} tabIndex="-1">
              Resultado revisado
            </h2>
            <p>
              {savedProgress
                ? `Melhor resultado: ${savedProgress.bestXp} XP · Tentativas concluídas: ${savedProgress.attempts} · XP compartilhado: ${savedProgress.totalXp}.`
                : "A missão foi concluída em modo somente leitura e o resultado não foi salvo."}
            </p>
            <strong>{score} XP</strong>
            <qa-save-status ref={saveStatusRef}></qa-save-status>
            {saveBlocked && (
              <AutomationReadOnlyNotice role="status">
                O resultado desta tentativa não foi salvo porque o progresso
                pertence a uma versão mais recente.
              </AutomationReadOnlyNotice>
            )}
            <div>
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
      </AutomationRoot>
    );
  }

  return Framework;
}

export function mountFramework(element, Framework) {
  createRoot(element).render(<Framework />);
}
