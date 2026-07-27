// Conteúdo e fluxo da Fase 2.
const requirementQuestions = [
  {
    category: "Fluxos",
    kind: "TÉCNICA DE ANÁLISE",
    question: "Qual é o melhor primeiro passo para iniciar a análise deste requisito?",
    context: "Antes de escrever casos de teste, precisamos transformar a solicitação em partes observáveis.",
    options: [
      "Testar diretamente em produção para descobrir como o fluxo funciona.",
      "Identificar ator, objetivo, pré-condições, dados, ações e resultados esperados.",
      "Criar somente um teste automatizado para o botão Confirmar.",
      "Assumir que o fluxo é igual ao cadastro e dispensar o refinamento."
    ],
    correct: 1,
    explanation: "Decompor o requisito revela o que já está definido e evidencia lacunas antes da criação dos cenários."
  },
  {
    category: "Fluxos",
    kind: "FLUXO PRINCIPAL",
    question: "Qual sequência representa melhor um fluxo principal seguro e verificável?",
    context: "O objetivo é alterar o endereço apenas depois de validar a solicitação do cliente.",
    options: [
      "Informar o e-mail → atualizar imediatamente → verificar o formato depois.",
      "Acessar o perfil → informar novo e-mail → validar dados e identidade → confirmar o endereço → concluir a alteração.",
      "Enviar uma mensagem → apagar o e-mail antigo → pedir autenticação.",
      "Alterar o banco manualmente → avisar o cliente se houver tempo."
    ],
    correct: 1,
    explanation: "Um fluxo principal deve ordenar ações do usuário e respostas do sistema, incluindo validações necessárias antes da atualização definitiva."
  },
  {
    category: "Fluxos",
    kind: "FLUXO DE EXCEÇÃO",
    question: "Qual exceção crítica não foi definida na descrição recebida?",
    context: "O novo endereço pode já pertencer a outra conta da plataforma.",
    options: [
      "O usuário escolhe um avatar diferente.",
      "O novo e-mail já está cadastrado para outro cliente.",
      "O perfil possui uma foto em formato PNG.",
      "A página foi aberta durante a tarde."
    ],
    correct: 1,
    explanation: "A duplicidade afeta integridade, autenticação e privacidade. O requisito precisa definir bloqueio, mensagem e comportamento esperado."
  },
  {
    category: "Fluxos",
    kind: "FLUXOS ALTERNATIVOS",
    question: "Que conjunto amplia melhor o mapeamento de exceções do fluxo?",
    context: "Considere validação, confirmação e falhas externas.",
    options: [
      "E-mail inválido, token expirado, mensagem não recebida e indisponibilidade do serviço de envio.",
      "Cor do cabeçalho, tamanho do logo e ordem do menu.",
      "Somente sucesso no Chrome e no Firefox.",
      "Apenas alteração realizada pelo caminho principal."
    ],
    correct: 0,
    explanation: "Essas condições representam pontos reais de interrupção e exigem respostas claras, recuperação e mensagens apropriadas."
  },
  {
    category: "Critérios",
    kind: "CRITÉRIO DE ACEITAÇÃO",
    question: "Qual critério de aceitação é mais claro e testável?",
    context: "Procure pré-condição, ação e resultado observável.",
    options: [
      "A alteração deve funcionar bem e rapidamente.",
      "O sistema deve ser fácil para qualquer pessoa.",
      "Dado um cliente autenticado e um e-mail válido não utilizado, quando ele confirmar um token válido, então o novo endereço deve substituir o anterior.",
      "O desenvolvedor deve criar uma boa tela de alteração."
    ],
    correct: 2,
    explanation: "O critério descreve contexto, condição e resultado verificável, reduzindo interpretações diferentes entre produto, desenvolvimento e QA."
  },
  {
    category: "Critérios",
    kind: "AMBIGUIDADE",
    question: "Por que a palavra “rapidamente” precisa ser refinada?",
    context: "Termos subjetivos não indicam quando o comportamento pode ser aceito.",
    options: [
      "Porque palavras longas não podem aparecer em requisitos.",
      "Porque é necessário definir um limite mensurável, como tempo de resposta ou prazo de envio.",
      "Porque todo sistema deve responder instantaneamente.",
      "Porque desempenho nunca deve ser discutido no refinamento."
    ],
    correct: 1,
    explanation: "Substituir 'rapidamente' por uma medida acordada torna a expectativa objetiva e permite validá-la."
  },
  {
    category: "Critérios",
    kind: "CLAREZA DO REQUISITO",
    question: "O que precisa ser esclarecido na expressão “usuários válidos”?",
    context: "A expressão pode representar estados de conta e permissões muito diferentes.",
    options: [
      "Quais navegadores possuem uma cor válida.",
      "Quais estados de conta podem alterar o e-mail, como ativa, bloqueada, pendente ou autenticada recentemente.",
      "Qual pessoa do time escreveu a expressão.",
      "A quantidade de letras no nome do usuário."
    ],
    correct: 1,
    explanation: "Definir os estados elegíveis evita decisões implícitas sobre acesso e torna possível criar cenários positivos e negativos."
  },
  {
    category: "Revisão e riscos",
    kind: "RISCO E SEGURANÇA",
    question: "Qual proteção deveria ser discutida durante o refinamento?",
    context: "O e-mail pode ser usado para login e recuperação de acesso.",
    options: [
      "Remover todas as validações para reduzir etapas.",
      "Exigir reautenticação, confirmar o novo endereço e notificar o endereço anterior.",
      "Exibir publicamente o novo endereço antes da confirmação.",
      "Permitir alterações ilimitadas sem registro."
    ],
    correct: 1,
    explanation: "Alterar um identificador de acesso é uma operação sensível. Reautenticação, confirmação e notificações reduzem risco de tomada de conta."
  },
  {
    category: "Revisão e riscos",
    kind: "REVISÃO DO REQUISITO",
    question: "Qual conjunto de perguntas produz o refinamento mais útil?",
    context: "O objetivo é resolver regras, exceções e dependências antes do desenvolvimento.",
    options: [
      "Quem escolheu a fonte e por que o botão é roxo?",
      "O e-mail precisa ser único? Quando a alteração se torna efetiva? O token expira? Como desfazer uma solicitação indevida?",
      "Podemos começar sem entender o fluxo e decidir tudo depois?",
      "Quantas linhas de código serão escritas?"
    ],
    correct: 1,
    explanation: "As perguntas atacam decisões de negócio, segurança e recuperação que estão ausentes e afetam diretamente a implementação e os testes."
  },
  {
    category: "Revisão e riscos",
    kind: "DECISÃO DE PRONTIDÃO",
    question: "Com base na análise, qual é a melhor decisão sobre o requisito atual?",
    context: "Ainda existem ambiguidades, exceções não tratadas e critérios ausentes.",
    options: [
      "Considerá-lo pronto porque possui uma frase de história de usuário.",
      "Iniciar o desenvolvimento e pedir ao QA para decidir as regras sozinho.",
      "Registrar as lacunas, refinar com os envolvidos e acordar critérios antes de considerá-lo pronto.",
      "Descartar a funcionalidade sem conversar com produto."
    ],
    correct: 2,
    explanation: "QA torna riscos e dúvidas visíveis. As decisões de negócio devem ser refinadas com os envolvidos antes que o requisito seja tratado como pronto."
  }
];

function shuffle(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

function prepareQuestions() {
  return requirementQuestions.map((question) => {
    const options = shuffle(question.options.map((text, index) => ({
      text,
      isCorrect: index === question.correct
    })));

    return {
      ...question,
      options: options.map((option) => option.text),
      correct: options.findIndex((option) => option.isCorrect)
    };
  });
}

const quizScreen = document.querySelector("#quiz-screen");
const resultScreen = document.querySelector("#result-screen");
const questionCounter = document.querySelector("#question-counter");
const questionKind = document.querySelector("#question-kind");
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
const progressSaveStatus = document.querySelector("qa-save-status");
const retryButton = document.querySelector("#retry-mission");
const competencyList = document.querySelector("#competency-list");

let questions = prepareQuestions();
let currentQuestion = 0;
let selectedAnswer = null;
let correctAnswers = 0;
let xp = 0;
let categoryScores = {};

function selectAnswer(index) {
  selectedAnswer = index;
  confirmButton.disabled = false;
  selectionHint.textContent = "Análise selecionada. Confirme quando estiver pronto.";

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
  questionKind.textContent = question.kind;
  progressBar.style.width = `${((currentQuestion + 1) / questions.length) * 100}%`;
  questionTitle.textContent = question.question;
  questionContext.textContent = question.context;
  answersContainer.replaceChildren();
  feedback.hidden = true;
  feedback.className = "answer-feedback";
  confirmButton.hidden = false;
  confirmButton.disabled = true;
  nextButton.hidden = true;
  selectionHint.textContent = "Selecione a melhor análise para continuar.";

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

  categoryScores[question.category] ||= { correct: 0, total: 0 };
  categoryScores[question.category].total += 1;

  options.forEach((option, index) => {
    option.disabled = true;
    option.classList.remove("is-selected");
    if (index === question.correct) option.classList.add("is-correct");
    if (index === selectedAnswer && !isCorrect) option.classList.add("is-wrong");
  });

  if (isCorrect) {
    correctAnswers += 1;
    xp += 10;
    categoryScores[question.category].correct += 1;
  }

  headerXp.textContent = xp;
  feedback.hidden = false;
  feedback.classList.add(isCorrect ? "is-correct" : "is-wrong");
  feedbackIcon.textContent = isCorrect ? "✓" : "!";
  feedbackTitle.textContent = isCorrect ? "+10 XP · Boa análise!" : "Existe uma análise mais forte";
  feedbackText.textContent = question.explanation;
  selectionHint.textContent = isCorrect ? "Você reduziu uma incerteza do requisito." : "Use o feedback para revisar sua linha de raciocínio.";
  confirmButton.hidden = true;
  nextButton.hidden = false;
  nextButton.innerHTML = currentQuestion === questions.length - 1
    ? "Ver diagnóstico <span aria-hidden=\"true\">→</span>"
    : "Próxima análise <span aria-hidden=\"true\">→</span>";
  nextButton.focus();
}

function renderCompetencies() {
  competencyList.replaceChildren();

  ["Fluxos", "Critérios", "Revisão e riscos"].forEach((category) => {
    const score = categoryScores[category] || { correct: 0, total: 0 };
    const percentage = score.total ? (score.correct / score.total) * 100 : 0;
    const row = document.createElement("div");
    row.className = "competency-row";

    const label = document.createElement("span");
    label.textContent = category;

    const track = document.createElement("div");
    track.className = "competency-row__track";
    const fill = document.createElement("i");
    fill.style.width = `${percentage}%`;
    track.append(fill);

    const value = document.createElement("strong");
    value.textContent = `${score.correct}/${score.total}`;

    row.append(label, track, value);
    competencyList.append(row);
  });
}

function showResult() {
  quizScreen.hidden = true;
  resultScreen.hidden = false;
  resultCorrect.textContent = `${correctAnswers} / ${questions.length}`;
  resultXp.textContent = xp;
  const savedProgress = window.QAQuestProgress.saveMissionResult("phase2", xp);
  progressSaveStatus.show(savedProgress);
  renderCompetencies();

  if (correctAnswers === questions.length) {
    resultMessage.textContent = "Excelente investigação. Você transformou um texto vago em fluxos, critérios e perguntas capazes de orientar o time.";
  } else if (correctAnswers >= 7) {
    resultMessage.textContent = "Boa análise. Você encontrou as principais lacunas; o resumo abaixo mostra onde aprofundar sua revisão.";
  } else {
    resultMessage.textContent = "O requisito ainda esconde riscos importantes. Revise o diagnóstico por competência e faça uma nova análise.";
  }

  resultScreen.querySelector("h2").focus();
}

function goToNextQuestion() {
  if (currentQuestion === questions.length - 1) {
    showResult();
    return;
  }

  currentQuestion += 1;
  renderQuestion();
  questionTitle.focus();
}

function restartMission() {
  questions = prepareQuestions();
  currentQuestion = 0;
  selectedAnswer = null;
  correctAnswers = 0;
  xp = 0;
  categoryScores = {};
  headerXp.textContent = "0";
  resultScreen.hidden = true;
  progressSaveStatus.reset();
  quizScreen.hidden = false;
  renderQuestion();
  questionTitle.focus();
}

confirmButton.addEventListener("click", confirmAnswer);
nextButton.addEventListener("click", goToNextQuestion);
retryButton.addEventListener("click", restartMission);
renderQuestion();
