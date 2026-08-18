// Tasks and state machine for the Phase 3 Simulator.
const tasks = [
  {
    type: "VALIDAÇÃO DE CAMPOS",
    title: "Teste os campos obrigatórios",
    instruction: "Sem preencher e-mail ou senha, tente entrar na aplicação e observe as validações apresentadas.",
    expectedEvents: ["empty_submit"],
    points: 10,
    feedback: "Os dois campos foram sinalizados sem enviar a autenticação. Essa ação cobriu o comportamento obrigatório do formulário."
  },
  {
    type: "PARTIÇÃO INVÁLIDA",
    title: "Valide o formato do e-mail",
    instruction: "Informe um endereço incompleto, como “qa@”, preencha qualquer senha e tente entrar.",
    expectedEvents: ["invalid_email"],
    points: 10,
    feedback: "A aplicação impediu o envio e informou que o formato do endereço não é válido."
  },
  {
    type: "CREDENCIAL INVÁLIDA",
    title: "Teste uma senha incorreta",
    instruction: "Use o e-mail válido do briefing, informe uma senha diferente de QA@2026 e tente entrar.",
    expectedEvents: ["wrong_password"],
    points: 10,
    feedback: "O acesso foi negado, mas a mensagem específica confirma que o e-mail existe. Guarde essa observação para comparar com o próximo teste."
  },
  {
    type: "TESTE NEGATIVO",
    title: "Investigue a mensagem de autenticação",
    instruction: "Tente entrar com inexistente@qaquest.example e qualquer senha. Compare a resposta com a tarefa anterior.",
    expectedEvents: ["unknown_user"],
    points: 10,
    feedback: "Defeito observado: mensagens diferentes revelam se uma conta está cadastrada. O comportamento esperado seria uma resposta genérica."
  },
  {
    type: "CAMINHO FELIZ",
    title: "Execute o login com sucesso",
    instruction: "Use qa@qaquest.example e QA@2026 para confirmar o fluxo principal de autenticação.",
    expectedEvents: ["login_success", "login_success_with_remember"],
    points: 10,
    feedback: "O caminho principal levou à área autenticada e apresentou uma confirmação clara ao usuário."
  },
  {
    type: "PERSISTÊNCIA DE SESSÃO",
    title: "Teste a opção “Lembrar acesso”",
    instruction: "Marque “Lembrar acesso”, entre com as credenciais válidas e clique em “Simular nova visita”.",
    expectedEvents: ["remember_bug"],
    points: 20,
    feedback: "Defeito reproduzido: mesmo com a preferência marcada, a nova visita exige autenticação novamente."
  },
  {
    type: "RELATO DE DEFEITO",
    title: "Registre o problema encontrado",
    instruction: "Documente o defeito da opção “Lembrar acesso” com título, severidade, passos e resultados esperado e obtido.",
    expectedEvents: ["valid_bug_report"],
    points: 30,
    feedback: "Relatório completo. A evidência contém informações suficientes para reprodução, análise e priorização pelo time."
  }
];

const actionLabels = {
  empty_submit: "Login enviado com campos vazios",
  invalid_email: "Formato de e-mail inválido testado",
  wrong_password: "Senha incorreta enviada para conta existente",
  unknown_user: "Conta inexistente testada",
  login_success: "Login válido executado",
  login_success_with_remember: "Login válido com preferência de sessão",
  remember_bug: "Nova visita simulada; sessão não foi mantida",
  valid_bug_report: "Relatório de defeito enviado"
};

const validEmail = "qa@qaquest.example";
const validPassword = "QA@2026";

const workspace = document.querySelector("#simulator-workspace");
const resultScreen = document.querySelector("#simulator-result");
const headerXp = document.querySelector("#header-xp");
const taskCounter = document.querySelector("#task-counter");
const taskProgress = document.querySelector("#task-progress");
const taskType = document.querySelector("#task-type");
const taskTitle = document.querySelector("#task-title");
const taskInstruction = document.querySelector("#task-instruction");
const taskPoints = document.querySelector("#task-points");
const taskFeedback = document.querySelector("#task-feedback");
const taskFeedbackTitle = document.querySelector("#task-feedback-title");
const taskFeedbackText = document.querySelector("#task-feedback-text");
const nextTaskButton = document.querySelector("#next-task");
const actionList = document.querySelector("#action-list");
const actionCount = document.querySelector("#action-count");
const loginForm = document.querySelector("#login-form");
const emailInput = document.querySelector("#sim-email");
const passwordInput = document.querySelector("#sim-password");
const rememberInput = document.querySelector("#sim-remember");
const emailError = document.querySelector("#email-error");
const passwordError = document.querySelector("#password-error");
const loginMessage = document.querySelector("#login-message");
const loginView = document.querySelector("#login-view");
const loggedView = document.querySelector("#logged-view");
const sessionMessage = document.querySelector("#session-message");
const simulateVisitButton = document.querySelector("#simulate-visit");
const backToLoginButton = document.querySelector("#back-to-login");
const bugReport = document.querySelector("#bug-report");
const bugTitle = document.querySelector("#bug-title");
const bugSeverity = document.querySelector("#bug-severity");
const bugSteps = document.querySelector("#bug-steps");
const bugExpected = document.querySelector("#bug-expected");
const bugActual = document.querySelector("#bug-actual");
const bugReportError = document.querySelector("#bug-report-error");
const resultXp = document.querySelector("#result-xp");
const resultActions = document.querySelector("#result-actions");
const progressSaveStatus = document.querySelector("qa-save-status");
const restartButton = document.querySelector("#restart-simulator");

let currentTask = 0;
let xp = 0;
let actions = [];
let taskCompleted = false;

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function clearValidation() {
  emailError.textContent = "";
  passwordError.textContent = "";
  emailInput.closest(".sim-field").classList.remove("is-invalid");
  passwordInput.closest(".sim-field").classList.remove("is-invalid");
  loginMessage.hidden = true;
  loginMessage.className = "login-message";
  loginMessage.textContent = "";
}

function showFieldError(input, errorElement, message) {
  input.closest(".sim-field").classList.add("is-invalid");
  errorElement.textContent = message;
}

function showLoginMessage(message, success = false) {
  loginMessage.hidden = false;
  loginMessage.className = success ? "login-message is-success" : "login-message";
  loginMessage.textContent = message;
}

function resetSimulatedApp() {
  loginForm.reset();
  clearValidation();
  loginView.hidden = false;
  loggedView.hidden = true;
  simulateVisitButton.hidden = true;
  sessionMessage.textContent = "Sua sessão foi iniciada com sucesso.";
}

function showLoggedView(rememberRequested) {
  loginView.hidden = true;
  loggedView.hidden = false;
  simulateVisitButton.hidden = !rememberRequested;
  sessionMessage.textContent = rememberRequested
    ? "A preferência “Lembrar acesso” foi marcada. Simule uma nova visita para validar a sessão."
    : "Sua sessão foi iniciada com sucesso.";
}

function renderActionLog() {
  actionList.replaceChildren();

  if (!actions.length) {
    const empty = document.createElement("li");
    empty.className = "action-log__empty";
    empty.textContent = "Suas interações aparecerão aqui.";
    actionList.append(empty);
  } else {
    actions.slice(-6).reverse().forEach((action) => {
      const item = document.createElement("li");
      const label = document.createElement("span");
      const time = document.createElement("time");
      label.textContent = action.label;
      time.textContent = action.time;
      item.append(document.createTextNode(""), label, time);
      actionList.append(item);
    });
  }

  actionCount.textContent = `${actions.length} ${actions.length === 1 ? "ação" : "ações"}`;
}

function recordAction(eventName) {
  const now = new Date();
  actions.push({
    event: eventName,
    label: actionLabels[eventName] || "Interação registrada",
    time: now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  });
  renderActionLog();
  evaluateTask(eventName);
}

function evaluateTask(eventName) {
  if (taskCompleted) return;
  const task = tasks[currentTask];

  if (!task.expectedEvents.includes(eventName)) return;

  taskCompleted = true;
  xp += task.points;
  headerXp.textContent = xp;
  taskFeedback.hidden = false;
  taskFeedbackTitle.textContent = `Tarefa concluída · +${task.points} XP`;
  taskFeedbackText.textContent = task.feedback;
  nextTaskButton.hidden = false;
  nextTaskButton.innerHTML = currentTask === tasks.length - 1
    ? "Ver resultado <span aria-hidden=\"true\">→</span>"
    : "Próxima tarefa <span aria-hidden=\"true\">→</span>";
  nextTaskButton.focus();
}

function renderTask() {
  const task = tasks[currentTask];
  taskCompleted = false;
  taskCounter.textContent = `${currentTask + 1} / ${tasks.length}`;
  taskProgress.style.width = `${((currentTask + 1) / tasks.length) * 100}%`;
  taskType.textContent = task.type;
  taskTitle.textContent = task.title;
  taskInstruction.textContent = task.instruction;
  taskPoints.textContent = `+${task.points} XP`;
  taskFeedback.hidden = true;
  nextTaskButton.hidden = true;
  bugReport.hidden = currentTask !== tasks.length - 1;
  bugReportError.hidden = true;
  resetSimulatedApp();
  taskTitle.focus();
}

function handleLoginSubmit(event) {
  event.preventDefault();
  clearValidation();

  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  if (!email && !password) {
    showFieldError(emailInput, emailError, "Informe o e-mail.");
    showFieldError(passwordInput, passwordError, "Informe a senha.");
    recordAction("empty_submit");
    return;
  }

  if (!email) {
    showFieldError(emailInput, emailError, "Informe o e-mail.");
    return;
  }

  if (!isValidEmail(email)) {
    showFieldError(emailInput, emailError, "Informe um e-mail válido.");
    recordAction("invalid_email");
    return;
  }

  if (!password) {
    showFieldError(passwordInput, passwordError, "Informe a senha.");
    return;
  }

  if (email === validEmail && password !== validPassword) {
    showLoginMessage("Senha incorreta. Verifique sua senha e tente novamente.");
    recordAction("wrong_password");
    return;
  }

  if (email !== validEmail) {
    showLoginMessage("Usuário não encontrado. Confira o e-mail informado.");
    recordAction("unknown_user");
    return;
  }

  const rememberRequested = rememberInput.checked;
  showLoggedView(rememberRequested);
  recordAction(rememberRequested ? "login_success_with_remember" : "login_success");
}

function simulateNewVisit() {
  resetSimulatedApp();
  showLoginMessage("Sua sessão expirou. Entre novamente para continuar.");
  recordAction("remember_bug");
}

function validateBugReport() {
  const fieldsAreComplete = bugTitle.value.trim().length >= 8
    && bugSeverity.value
    && bugSteps.value.trim().length >= 15
    && bugExpected.value.trim().length >= 10
    && bugActual.value.trim().length >= 10;

  if (!fieldsAreComplete) {
    bugReportError.hidden = false;
    bugReportError.textContent = "Complete todos os campos com informações suficientes para reproduzir o defeito.";
    return false;
  }

  bugReportError.hidden = true;
  return true;
}

function handleBugReport(event) {
  event.preventDefault();
  if (!validateBugReport()) return;
  recordAction("valid_bug_report");
  [...bugReport.elements].forEach((element) => { element.disabled = true; });
}

function showResult() {
  workspace.hidden = true;
  resultScreen.hidden = false;
  resultXp.textContent = xp;
  resultActions.textContent = actions.length;
  const savedProgress = window.QAQuestProgress.saveMissionResult("phase3", xp);
  progressSaveStatus.show(savedProgress);
  document.querySelector("#simulator-result-title").focus();
}

function goToNextTask() {
  if (currentTask === tasks.length - 1) {
    showResult();
    return;
  }

  currentTask += 1;
  renderTask();
}

function restartSimulator() {
  currentTask = 0;
  xp = 0;
  actions = [];
  headerXp.textContent = "0";
  bugReport.reset();
  [...bugReport.elements].forEach((element) => { element.disabled = false; });
  workspace.hidden = false;
  resultScreen.hidden = true;
  progressSaveStatus.reset();
  renderActionLog();
  renderTask();
}

loginForm.addEventListener("submit", handleLoginSubmit);
simulateVisitButton.addEventListener("click", simulateNewVisit);
backToLoginButton.addEventListener("click", resetSimulatedApp);
bugReport.addEventListener("submit", handleBugReport);
nextTaskButton.addEventListener("click", goToNextTask);
restartButton.addEventListener("click", restartSimulator);
renderActionLog();
renderTask();
