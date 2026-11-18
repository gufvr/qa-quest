import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  actionLabels,
  isBugReportComplete,
  isValidEmail,
  simulatorCredentials,
  simulatorTasks,
} from "../../../core/phase3-simulator.js";
import { ReadOnlyNotice, SimulatorRoot } from "./Phase3.styles.js";

const progress = window.QAQuestProgress;
const initialBugReport = {
  title: "",
  severity: "",
  steps: "",
  expected: "",
  actual: "",
};

function Phase3() {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [xp, setXp] = useState(0);
  const [actions, setActions] = useState([]);
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [readOnly, setReadOnly] = useState(() => progress.isReadOnly());
  const [saveBlocked, setSaveBlocked] = useState(false);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberRequested, setRememberRequested] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginMessage, setLoginMessage] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionMessage, setSessionMessage] = useState(
    "Sua sessão foi iniciada com sucesso.",
  );
  const [bugReport, setBugReport] = useState(initialBugReport);
  const [bugReportError, setBugReportError] = useState("");
  const [bugReportDisabled, setBugReportDisabled] = useState(false);
  const taskCompletedRef = useRef(false);
  const taskTitleRef = useRef(null);
  const nextTaskButtonRef = useRef(null);
  const resultTitleRef = useRef(null);
  const saveStatusRef = useRef(null);
  const currentTask = simulatorTasks[currentTaskIndex];
  const actionCount = actions.length;
  const recentActions = actions.slice(-6).reverse();

  useEffect(() => {
    const headerXp = document.querySelector("#header-xp");
    if (headerXp) headerXp.textContent = String(xp);
  }, [xp]);

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
    taskTitleRef.current?.focus();
  }, [currentTaskIndex, attemptNumber]);

  useEffect(() => {
    if (taskCompleted) nextTaskButtonRef.current?.focus();
  }, [taskCompleted]);

  useEffect(() => {
    if (isComplete) resultTitleRef.current?.focus();
  }, [isComplete]);

  function resetSimulatedApp() {
    setEmail("");
    setPassword("");
    setRememberRequested(false);
    setEmailError("");
    setPasswordError("");
    setLoginMessage(null);
    setIsLoggedIn(false);
    setSessionMessage("Sua sessão foi iniciada com sucesso.");
  }

  function recordAction(eventName) {
    const now = new Date();
    setActions((current) => [
      ...current,
      {
        event: eventName,
        label: actionLabels[eventName] || "Interação registrada",
        time: now.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    if (taskCompletedRef.current) return;
    if (!currentTask.expectedEvents.includes(eventName)) return;

    taskCompletedRef.current = true;
    setTaskCompleted(true);
    setXp((current) => current + currentTask.points);
  }

  function handleLoginSubmit(event) {
    event.preventDefault();
    setEmailError("");
    setPasswordError("");
    setLoginMessage(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail && !password) {
      setEmailError("Informe o e-mail.");
      setPasswordError("Informe a senha.");
      recordAction("empty_submit");
      return;
    }

    if (!normalizedEmail) {
      setEmailError("Informe o e-mail.");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setEmailError("Informe um e-mail válido.");
      recordAction("invalid_email");
      return;
    }

    if (!password) {
      setPasswordError("Informe a senha.");
      return;
    }

    if (
      normalizedEmail === simulatorCredentials.email &&
      password !== simulatorCredentials.password
    ) {
      setLoginMessage({
        text: "Senha incorreta. Verifique sua senha e tente novamente.",
        success: false,
      });
      recordAction("wrong_password");
      return;
    }

    if (normalizedEmail !== simulatorCredentials.email) {
      setLoginMessage({
        text: "Usuário não encontrado. Confira o e-mail informado.",
        success: false,
      });
      recordAction("unknown_user");
      return;
    }

    setIsLoggedIn(true);
    setSessionMessage(
      rememberRequested
        ? "A preferência “Lembrar acesso” foi marcada. Simule uma nova visita para validar a sessão."
        : "Sua sessão foi iniciada com sucesso.",
    );
    recordAction(
      rememberRequested ? "login_success_with_remember" : "login_success",
    );
  }

  function simulateNewVisit() {
    resetSimulatedApp();
    setLoginMessage({
      text: "Sua sessão expirou. Entre novamente para continuar.",
      success: false,
    });
    recordAction("remember_bug");
  }

  function updateBugReport(field, value) {
    setBugReport((current) => ({ ...current, [field]: value }));
  }

  function handleBugReport(event) {
    event.preventDefault();
    if (!isBugReportComplete(bugReport)) {
      setBugReportError(
        "Complete todos os campos com informações suficientes para reproduzir o defeito.",
      );
      return;
    }

    setBugReportError("");
    setBugReportDisabled(true);
    recordAction("valid_bug_report");
  }

  function finishSimulator() {
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
      savedProgress = progress.saveMissionResult("phase3", xp);
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

  function goToNextTask() {
    if (!taskCompleted) return;

    if (currentTaskIndex === simulatorTasks.length - 1) {
      finishSimulator();
      return;
    }

    taskCompletedRef.current = false;
    setTaskCompleted(false);
    resetSimulatedApp();
    setBugReportError("");
    setCurrentTaskIndex((current) => current + 1);
  }

  function restartSimulator() {
    setCurrentTaskIndex(0);
    setXp(0);
    setActions([]);
    setTaskCompleted(false);
    taskCompletedRef.current = false;
    setIsComplete(false);
    setReadOnly(progress.isReadOnly());
    setSaveBlocked(false);
    setBugReport(initialBugReport);
    setBugReportError("");
    setBugReportDisabled(false);
    resetSimulatedApp();
    setAttemptNumber((current) => current + 1);
    saveStatusRef.current?.reset();
  }

  return (
    <SimulatorRoot>
      <div
        className="simulator-workspace"
        id="simulator-workspace"
        hidden={isComplete}
      >
        <aside className="briefing-panel" aria-labelledby="briefing-title">
          <div className="panel-heading">
            <span className="panel-heading__icon" aria-hidden="true">
              ▤
            </span>
            <div>
              <small>BRIEFING DO TURNO</small>
              <strong id="briefing-title">Release 2.4.0</strong>
            </div>
          </div>

          <div className="briefing-section">
            <span className="briefing-label">REQUISITO</span>
            <p>
              Clientes cadastrados devem acessar a plataforma com e-mail e
              senha. A opção “Lembrar acesso” deve manter a sessão na próxima
              visita.
            </p>
          </div>

          <div className="briefing-section">
            <span className="briefing-label">CREDENCIAIS DE TESTE</span>
            <dl className="credentials">
              <div>
                <dt>E-mail</dt>
                <dd>{simulatorCredentials.email}</dd>
              </div>
              <div>
                <dt>Senha</dt>
                <dd>{simulatorCredentials.password}</dd>
              </div>
            </dl>
          </div>

          <div className="briefing-section">
            <span className="briefing-label">CRITÉRIOS PRINCIPAIS</span>
            <ul className="criteria-list">
              <li>Campos obrigatórios devem ser indicados.</li>
              <li>
                Credenciais inválidas não devem revelar contas existentes.
              </li>
              <li>O acesso válido deve abrir a área autenticada.</li>
              <li>A preferência de sessão deve ser respeitada.</li>
            </ul>
          </div>

          <div className="briefing-note">
            <span aria-hidden="true">!</span>
            <p>Este ambiente contém comportamentos defeituosos intencionais.</p>
          </div>
        </aside>

        <section className="app-panel" aria-label="Aplicação Fikily simulada">
          <div className="browser-frame">
            <div className="browser-frame__bar" aria-hidden="true">
              <div className="browser-dots">
                <i></i>
                <i></i>
                <i></i>
              </div>
              <div className="browser-address">
                <span>⌁</span> fikily.test/login
              </div>
              <span className="browser-refresh">↻</span>
            </div>

            <div className="fake-app" id="fake-app">
              <div className="fake-app__side" aria-hidden="true">
                <div className="fikily-mark">F</div>
                <div>
                  <span>LOJA FIKILY</span>
                  <h2>
                    Seu próximo achado
                    <br />
                    começa aqui.
                  </h2>
                  <p>
                    Explore produtos e acompanhe seus pedidos em um único
                    lugar.
                  </p>
                </div>
                <div className="fake-app__metric">
                  <strong>99,8%</strong>
                  <span>disponibilidade</span>
                </div>
              </div>

              <div className="fake-app__content">
                {!isLoggedIn ? (
                  <section
                    className="login-view"
                    id="login-view"
                    aria-labelledby="login-title"
                  >
                    <div className="login-brand">
                      <span>F</span>
                      <strong>Fikily</strong>
                    </div>
                    <span className="login-kicker">ÁREA DO CLIENTE</span>
                    <h2 id="login-title">Acesse sua conta</h2>
                    <p>Entre com as credenciais da sua conta.</p>

                    <form id="login-form" noValidate onSubmit={handleLoginSubmit}>
                      <label
                        className={`sim-field${emailError ? " is-invalid" : ""}`}
                        htmlFor="sim-email"
                      >
                        <span>E-mail</span>
                        <input
                          id="sim-email"
                          name="email"
                          type="text"
                          autoComplete="off"
                          placeholder="nome@fikily.test"
                          value={email}
                          aria-invalid={Boolean(emailError)}
                          aria-describedby={
                            emailError ? "email-error" : undefined
                          }
                          onChange={(event) => setEmail(event.target.value)}
                        />
                        <small id="email-error">{emailError}</small>
                      </label>

                      <label
                        className={`sim-field${passwordError ? " is-invalid" : ""}`}
                        htmlFor="sim-password"
                      >
                        <span>Senha</span>
                        <input
                          id="sim-password"
                          name="password"
                          type="password"
                          autoComplete="off"
                          placeholder="Digite sua senha"
                          value={password}
                          aria-invalid={Boolean(passwordError)}
                          aria-describedby={
                            passwordError ? "password-error" : undefined
                          }
                          onChange={(event) => setPassword(event.target.value)}
                        />
                        <small id="password-error">{passwordError}</small>
                      </label>

                      <div className="login-options">
                        <label className="sim-checkbox" htmlFor="sim-remember">
                          <input
                            id="sim-remember"
                            type="checkbox"
                            checked={rememberRequested}
                            onChange={(event) =>
                              setRememberRequested(event.target.checked)
                            }
                          />
                          <span></span> Lembrar acesso
                        </label>
                        <button type="button" className="fake-link">
                          Esqueci minha senha
                        </button>
                      </div>

                      {loginMessage && (
                        <div
                          className={`login-message${loginMessage.success ? " is-success" : ""}`}
                          id="login-message"
                          role="status"
                          aria-live="polite"
                        >
                          {loginMessage.text}
                        </div>
                      )}
                      <button className="fikily-button" type="submit">
                        Entrar <span aria-hidden="true">→</span>
                      </button>
                    </form>
                    <small className="app-version">
                      Fikily · ambiente de simulação · v2.4.0
                    </small>
                  </section>
                ) : (
                  <section
                    className="logged-view"
                    id="logged-view"
                    aria-labelledby="logged-title"
                  >
                    <div className="logged-view__icon" aria-hidden="true">
                      ✓
                    </div>
                    <span className="login-kicker">
                      AUTENTICAÇÃO CONCLUÍDA
                    </span>
                    <h2 id="logged-title">Bem-vindo, QA!</h2>
                    <p id="session-message">{sessionMessage}</p>
                    <div className="logged-view__actions">
                      {rememberRequested && (
                        <button
                          className="fikily-button"
                          id="simulate-visit"
                          type="button"
                          onClick={simulateNewVisit}
                        >
                          Simular nova visita
                        </button>
                      )}
                      <button
                        className="fake-link"
                        id="back-to-login"
                        type="button"
                        onClick={resetSimulatedApp}
                      >
                        Voltar ao login
                      </button>
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        </section>

        <aside className="qa-panel" aria-labelledby="task-title">
          <div className="qa-progress">
            <div>
              <span>TAREFA ATUAL</span>
              <strong>
                {currentTaskIndex + 1} / {simulatorTasks.length}
              </strong>
            </div>
            <div className="qa-progress__track" aria-hidden="true">
              <i
                style={{
                  width: `${((currentTaskIndex + 1) / simulatorTasks.length) * 100}%`,
                }}
              />
            </div>
          </div>

          <section className="task-card">
            <span className="task-card__type">{currentTask.type}</span>
            <h2 id="task-title" ref={taskTitleRef} tabIndex={-1}>
              {currentTask.title}
            </h2>
            <p>{currentTask.instruction}</p>
            <div className="task-reward">
              <span aria-hidden="true">✦</span>
              <strong>+{currentTask.points} XP</strong> ao concluir
            </div>
          </section>

          {readOnly && (
            <ReadOnlyNotice role="status" aria-live="polite">
              O progresso pertence a uma versão mais recente. Você pode
              concluir a missão, mas o resultado não será salvo.
            </ReadOnlyNotice>
          )}

          <div
            className="task-feedback"
            role="status"
            aria-live="polite"
            hidden={!taskCompleted}
          >
            <span aria-hidden="true">✓</span>
            <div>
              <strong>Tarefa concluída · +{currentTask.points} XP</strong>
              <p>{currentTask.feedback}</p>
            </div>
          </div>

          {currentTaskIndex === simulatorTasks.length - 1 && (
            <form
              className="bug-report"
              id="bug-report"
              onSubmit={handleBugReport}
            >
              <div className="bug-report__heading">
                <span aria-hidden="true">◆</span>
                <div>
                  <small>EVIDÊNCIA FINAL</small>
                  <strong>Relatório de defeito</strong>
                </div>
              </div>
              <label>
                Título do defeito
                <input
                  id="bug-title"
                  type="text"
                  placeholder="Resuma o problema encontrado"
                  value={bugReport.title}
                  disabled={bugReportDisabled}
                  onChange={(event) =>
                    updateBugReport("title", event.target.value)
                  }
                />
              </label>
              <label>
                Severidade
                <select
                  id="bug-severity"
                  value={bugReport.severity}
                  disabled={bugReportDisabled}
                  onChange={(event) =>
                    updateBugReport("severity", event.target.value)
                  }
                >
                  <option value="">Selecione</option>
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Crítica</option>
                </select>
              </label>
              <label>
                Passos para reproduzir
                <textarea
                  id="bug-steps"
                  rows="3"
                  placeholder="Descreva as ações executadas"
                  value={bugReport.steps}
                  disabled={bugReportDisabled}
                  onChange={(event) =>
                    updateBugReport("steps", event.target.value)
                  }
                />
              </label>
              <label>
                Resultado esperado
                <textarea
                  id="bug-expected"
                  rows="2"
                  placeholder="O que deveria acontecer?"
                  value={bugReport.expected}
                  disabled={bugReportDisabled}
                  onChange={(event) =>
                    updateBugReport("expected", event.target.value)
                  }
                />
              </label>
              <label>
                Resultado obtido
                <textarea
                  id="bug-actual"
                  rows="2"
                  placeholder="O que aconteceu?"
                  value={bugReport.actual}
                  disabled={bugReportDisabled}
                  onChange={(event) =>
                    updateBugReport("actual", event.target.value)
                  }
                />
              </label>
              {bugReportError && (
                <p className="bug-report__error" role="alert">
                  {bugReportError}
                </p>
              )}
              <button
                className="button button--primary"
                type="submit"
                disabled={bugReportDisabled}
              >
                Enviar relatório
              </button>
            </form>
          )}

          <button
            className="button button--primary next-task"
            type="button"
            ref={nextTaskButtonRef}
            hidden={!taskCompleted}
            onClick={goToNextTask}
          >
            {currentTaskIndex === simulatorTasks.length - 1
              ? "Ver resultado"
              : "Próxima tarefa"}{" "}
            <span aria-hidden="true">→</span>
          </button>

          <section className="action-log" aria-labelledby="action-log-title">
            <div className="action-log__heading">
              <strong id="action-log-title">Registro de ações</strong>
              <span>
                {actionCount} {actionCount === 1 ? "ação" : "ações"}
              </span>
            </div>
            <ol>
              {recentActions.length === 0 ? (
                <li className="action-log__empty">
                  Suas interações aparecerão aqui.
                </li>
              ) : (
                recentActions.map((action, index) => (
                  <li key={`${action.event}-${action.time}-${index}`}>
                    <span>{action.label}</span>
                    <time>{action.time}</time>
                  </li>
                ))
              )}
            </ol>
          </section>
        </aside>
      </div>

      <section
        className="simulator-result"
        id="simulator-result"
        hidden={!isComplete}
        aria-labelledby="simulator-result-title"
      >
        <div className="simulator-result__icon" aria-hidden="true">
          ◆
        </div>
        <span className="label label--cyan">TURNO CONCLUÍDO</span>
        <h2 id="simulator-result-title" ref={resultTitleRef} tabIndex={-1}>
          Teste funcional executado!
        </h2>
        <p>
          Você percorreu o fluxo de login, investigou comportamentos
          inesperados e registrou uma evidência de qualidade.
        </p>
        <qa-save-status ref={saveStatusRef}></qa-save-status>
        {saveBlocked && (
          <ReadOnlyNotice role="status" aria-live="polite">
            Resultado calculado, mas não salvo. Atualize o QA Quest antes de
            salvar o progresso.
          </ReadOnlyNotice>
        )}

        <div className="simulator-result__stats">
          <div>
            <span>TAREFAS</span>
            <strong>7 / 7</strong>
          </div>
          <div>
            <span>DEFEITOS OBSERVADOS</span>
            <strong>2</strong>
          </div>
          <div>
            <span>EXPERIÊNCIA</span>
            <strong>
              <span>{xp}</span> XP
            </strong>
          </div>
          <div>
            <span>AÇÕES EXECUTADAS</span>
            <strong>{actionCount}</strong>
          </div>
        </div>

        <div className="simulator-result__skills">
          <span>Execução funcional</span>
          <span>Observação crítica</span>
          <span>Relato de defeito</span>
        </div>

        <div className="simulator-result__actions">
          <button
            className="button button--primary"
            type="button"
            onClick={restartSimulator}
          >
            Reiniciar turno
          </button>
          <a className="button button--ghost" href="index.html">
            Voltar à jornada
          </a>
        </div>
      </section>
    </SimulatorRoot>
  );
}

export function mountPhase3(element) {
  createRoot(element).render(<Phase3 />);
}
