const questions = [
  {
    question: "Qual afirmação descreve melhor o papel de uma pessoa QA?",
    context: "Pense na qualidade durante todo o ciclo de desenvolvimento, não apenas na execução de testes.",
    options: [
      "Testar a aplicação somente depois que o desenvolvimento terminar.",
      "Garantir sozinho que nenhum bug chegue ao ambiente de produção.",
      "Colaborar para prevenir problemas, analisar riscos e validar a qualidade do produto.",
      "Aprovar automaticamente toda funcionalidade que passou nos testes automatizados."
    ],
    correct: 2,
    explanation: "QA atua de forma colaborativa e preventiva, analisando requisitos, riscos, evidências e resultados durante todo o ciclo do produto."
  },
  {
    question: "Um requisito de cadastro não explica o que ocorre quando o CPF já existe. Que análise deve apontar essa lacuna?",
    context: "Escolha a atividade mais diretamente relacionada à clareza das regras de negócio.",
    options: [
      "Análise de requisitos.",
      "Teste de performance.",
      "Análise de logs.",
      "Teste de compatibilidade."
    ],
    correct: 0,
    explanation: "A análise de requisitos procura ambiguidades, lacunas e regras de negócio incompletas antes que elas se transformem em defeitos."
  },
  {
    question: "O tempo de testes é curto. Qual área deve receber maior prioridade?",
    context: "Considere o impacto de uma falha para o negócio e para os usuários.",
    options: [
      "A tela de perguntas frequentes, porque possui mais textos.",
      "O módulo de pagamento, porque uma falha pode impedir vendas.",
      "Todas as áreas igualmente, independentemente do risco.",
      "Somente a funcionalidade desenvolvida por último."
    ],
    correct: 1,
    explanation: "Testes baseados em risco priorizam áreas com maior probabilidade ou impacto de falha. Pagamentos afetam diretamente receita e confiança."
  },
  {
    question: "Qual é o principal objetivo de um Smoke Test?",
    context: "Imagine que uma nova versão acabou de ser publicada no ambiente de testes.",
    options: [
      "Explorar todos os casos extremos da aplicação.",
      "Medir o limite máximo de usuários simultâneos.",
      "Verificar rapidamente se as funções essenciais estão operando.",
      "Validar apenas o estilo visual das telas."
    ],
    correct: 2,
    explanation: "O Smoke Test verifica rapidamente se a versão está estável o suficiente para que testes mais detalhados possam continuar."
  },
  {
    question: "Depois de alterar o login, por que executar testes de regressão?",
    context: "A alteração pode afetar cadastro, recuperação de senha, perfil e logout.",
    options: [
      "Para confirmar apenas se a nova cor do botão está correta.",
      "Para verificar se funcionalidades existentes continuam funcionando.",
      "Para substituir todos os testes de integração.",
      "Para descobrir a capacidade máxima do servidor."
    ],
    correct: 1,
    explanation: "A regressão procura efeitos colaterais: comportamentos que funcionavam antes podem ser afetados direta ou indiretamente pela alteração."
  }
];

const themeToggle = document.querySelector(".theme-toggle");
const quizScreen = document.querySelector("#quiz-screen");
const resultScreen = document.querySelector("#result-screen");
const questionCounter = document.querySelector("#question-counter");
const questionTitle = document.querySelector("#question-title");
const questionContext = document.querySelector("#question-context");
const answersContainer = document.querySelector("#answers");
const progressBar = document.querySelector("#mission-progress-bar");
const confirmButton = document.querySelector("#confirm-answer");
const nextButton = document.querySelector("#next-question");
const feedback = document.querySelector("#answer-feedback");
const feedbackIcon = document.querySelector("#feedback-icon");
const feedbackTitle = document.querySelector("#feedback-title");
const feedbackText = document.querySelector("#feedback-text");
const selectionHint = document.querySelector("#selection-hint");
const headerXp = document.querySelector("#header-xp");
const resultCorrect = document.querySelector("#result-correct");
const resultXp = document.querySelector("#result-xp");
const resultMessage = document.querySelector("#result-message");
const retryButton = document.querySelector("#retry-mission");

let currentQuestion = 0;
let selectedAnswer = null;
let correctAnswers = 0;
let xp = 0;

function updateThemeButton(theme) {
  const isLight = theme === "light";
  themeToggle.setAttribute("aria-pressed", String(isLight));
  themeToggle.setAttribute("aria-label", isLight ? "Ativar tema escuro" : "Ativar tema claro");
  themeToggle.title = isLight ? "Usar tema escuro" : "Usar tema claro";
}

function toggleTheme() {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem("qa-quest-theme", nextTheme);
  updateThemeButton(nextTheme);
}

function selectAnswer(index) {
  selectedAnswer = index;
  confirmButton.disabled = false;
  selectionHint.textContent = "Resposta selecionada. Confirme quando estiver pronto.";

  [...answersContainer.children].forEach((option, optionIndex) => {
    const selected = optionIndex === index;
    option.classList.toggle("is-selected", selected);
    option.setAttribute("aria-pressed", String(selected));
  });
}

function renderQuestion() {
  const question = questions[currentQuestion];
  selectedAnswer = null;
  questionCounter.textContent = `Questão ${currentQuestion + 1} de ${questions.length}`;
  progressBar.style.width = `${((currentQuestion + 1) / questions.length) * 100}%`;
  questionTitle.textContent = question.question;
  questionContext.textContent = question.context;
  answersContainer.replaceChildren();
  feedback.hidden = true;
  feedback.className = "answer-feedback";
  confirmButton.hidden = false;
  confirmButton.disabled = true;
  nextButton.hidden = true;
  selectionHint.textContent = "Selecione uma alternativa para continuar.";

  question.options.forEach((optionText, index) => {
    const option = document.createElement("button");
    option.className = "answer-option";
    option.type = "button";
    option.setAttribute("aria-pressed", "false");

    const letter = document.createElement("span");
    letter.className = "answer-option__letter";
    letter.setAttribute("aria-hidden", "true");
    letter.textContent = String.fromCharCode(65 + index);

    const text = document.createElement("span");
    text.className = "answer-option__text";
    text.textContent = optionText;

    option.append(letter, text);
    option.addEventListener("click", () => selectAnswer(index));
    answersContainer.append(option);
  });
}

function confirmAnswer() {
  if (selectedAnswer === null) return;

  const question = questions[currentQuestion];
  const isCorrect = selectedAnswer === question.correct;
  const options = [...answersContainer.children];

  options.forEach((option, index) => {
    option.disabled = true;
    option.classList.remove("is-selected");
    if (index === question.correct) option.classList.add("is-correct");
    if (index === selectedAnswer && !isCorrect) option.classList.add("is-wrong");
  });

  if (isCorrect) {
    correctAnswers += 1;
    xp += 20;
  }

  headerXp.textContent = xp;
  feedback.hidden = false;
  feedback.classList.add(isCorrect ? "is-correct" : "is-wrong");
  feedbackIcon.textContent = isCorrect ? "✓" : "!";
  feedbackTitle.textContent = isCorrect ? "+20 XP · Resposta correta!" : "Quase lá!";
  feedbackText.textContent = question.explanation;
  selectionHint.textContent = isCorrect ? "Boa análise. Continue avançando." : "Use o feedback para fortalecer seu raciocínio.";
  confirmButton.hidden = true;
  nextButton.hidden = false;
  nextButton.innerHTML = currentQuestion === questions.length - 1
    ? "Ver resultado <span aria-hidden=\"true\">→</span>"
    : "Próxima questão <span aria-hidden=\"true\">→</span>";
  nextButton.focus();
}

function showResult() {
  quizScreen.hidden = true;
  resultScreen.hidden = false;
  resultCorrect.textContent = `${correctAnswers} / ${questions.length}`;
  resultXp.textContent = xp;

  if (correctAnswers === questions.length) {
    resultMessage.textContent = "Excelente! Você demonstrou uma base sólida e conquistou toda a experiência desta missão.";
  } else if (correctAnswers >= 3) {
    resultMessage.textContent = "Bom trabalho! Você construiu uma boa base. Revise os feedbacks e tente conquistar a pontuação máxima.";
  } else {
    resultMessage.textContent = "Todo QA evolui investigando. Revise os conceitos e tente novamente para fortalecer sua base.";
  }

  resultScreen.querySelector("h2").focus?.();
}

function goToNextQuestion() {
  if (currentQuestion === questions.length - 1) {
    showResult();
    return;
  }

  currentQuestion += 1;
  renderQuestion();
  questionTitle.focus?.();
}

function restartMission() {
  currentQuestion = 0;
  selectedAnswer = null;
  correctAnswers = 0;
  xp = 0;
  headerXp.textContent = "0";
  resultScreen.hidden = true;
  quizScreen.hidden = false;
  renderQuestion();
}

updateThemeButton(document.documentElement.dataset.theme);
themeToggle.addEventListener("click", toggleTheme);
confirmButton.addEventListener("click", confirmAnswer);
nextButton.addEventListener("click", goToNextQuestion);
retryButton.addEventListener("click", restartMission);
renderQuestion();
