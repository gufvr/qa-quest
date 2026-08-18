// Decisions and scoring for the Phase 4 Test Plan Simulator.
const planningSteps = [
  {
    id: "objective",
    kicker: "OBJETIVO E ESCOPO",
    shortTitle: "Objetivo",
    title: "Qual é o objetivo central deste plano?",
    instruction: "Escolha a formulação que orienta melhor o esforço de teste da release Checkout 3.0.",
    type: "single",
    min: 1,
    max: 1,
    points: 14,
    metrics: ["coverage", "feasibility"],
    tip: "O objetivo deve declarar o que será validado e qual risco de negócio será protegido.",
    feedback: "Um objetivo específico conecta a funcionalidade ao resultado que o negócio precisa proteger.",
    options: [
      { id: "objective-core", label: "Validar a conclusão segura da compra", detail: "Cobrir cartão, Pix, cupons e criação correta do pedido.", quality: 1 },
      { id: "objective-all", label: "Testar todo o e-commerce", detail: "Revisar qualquer tela disponível antes da publicação.", quality: .35 },
      { id: "objective-visual", label: "Conferir somente o visual do checkout", detail: "Verificar textos, cores e alinhamentos da nova página.", quality: .15 },
      { id: "objective-gateway", label: "Validar apenas o gateway de pagamento", detail: "Ignorar carrinho, cupons e criação do pedido.", quality: .45 }
    ]
  },
  {
    id: "scope",
    kicker: "LIMITES DO PLANO",
    shortTitle: "Fora do escopo",
    title: "O que deve ficar fora desta execução?",
    instruction: "O Product Owner confirmou que dois recursos não pertencem à release. Identifique-os para evitar dispersão.",
    type: "multi",
    min: 2,
    max: 2,
    points: 14,
    metrics: ["coverage", "feasibility"],
    tip: "Declarar o que não será testado protege o prazo e torna as expectativas explícitas.",
    feedback: "Limites claros impedem que o plano prometa uma cobertura incompatível com a release.",
    options: [
      { id: "scope-marketplace", label: "Pedidos com múltiplos vendedores", detail: "O marketplace continua usando o checkout anterior.", recommended: true },
      { id: "scope-saved-card", label: "Cartões salvos na conta", detail: "O armazenamento de cartões será entregue em outra versão.", recommended: true },
      { id: "scope-coupon", label: "Cupons percentuais e fixos", detail: "Ambos fazem parte do escopo confirmado.", recommended: false },
      { id: "scope-pix", label: "Pagamento por Pix", detail: "O Pix é um dos meios de pagamento da release.", recommended: false }
    ]
  },
  {
    id: "risks",
    kicker: "ANÁLISE DE RISCOS",
    shortTitle: "Riscos prioritários",
    title: "Quais riscos exigem prioridade máxima?",
    instruction: "Selecione os dois problemas com maior impacto financeiro e operacional.",
    type: "multi",
    min: 2,
    max: 2,
    points: 14,
    metrics: ["risk", "feasibility"],
    tip: "Probabilidade importa, mas impacto financeiro e perda de confiança mudam a prioridade.",
    feedback: "Cobrança e cálculo incorretos podem gerar prejuízo, retrabalho e perda de confiança do cliente.",
    options: [
      { id: "risk-duplicate", label: "Cobrança duplicada ao tentar novamente", detail: "Uma repetição pode criar duas transações para o mesmo pedido.", recommended: true },
      { id: "risk-discount", label: "Desconto calculado incorretamente", detail: "O total pago pode divergir das regras comerciais.", recommended: true },
      { id: "risk-icon", label: "Ícone do Pix desalinhado", detail: "O problema afeta acabamento visual, sem impedir a compra.", recommended: false },
      { id: "risk-copy", label: "Texto do botão pouco persuasivo", detail: "A redação pode ser melhorada, mas não altera a transação.", recommended: false }
    ]
  },
  {
    id: "test-types",
    kicker: "ABORDAGEM DE TESTE",
    shortTitle: "Tipos de teste",
    title: "Quais abordagens formam a estratégia essencial?",
    instruction: "Escolha três abordagens adequadas ao risco e ao prazo inicial de cinco dias.",
    type: "multi",
    min: 3,
    max: 3,
    points: 14,
    metrics: ["coverage", "risk"],
    tip: "Combine validação funcional, integrações críticas e proteção contra regressões.",
    feedback: "A combinação equilibra o comportamento visível, a comunicação entre serviços e os fluxos que já existiam.",
    options: [
      { id: "type-functional", label: "Testes funcionais", detail: "Validar regras, campos, totais e respostas da interface.", recommended: true },
      { id: "type-integration", label: "Testes de integração", detail: "Confirmar checkout, gateway, pedidos e estoque trabalhando juntos.", recommended: true },
      { id: "type-regression", label: "Regressão direcionada", detail: "Proteger carrinho, login, endereço e histórico de pedidos.", recommended: true },
      { id: "type-stress", label: "Estresse com 50 mil usuários", detail: "Exige infraestrutura e objetivo de performance não previstos.", recommended: false },
      { id: "type-pentest", label: "Pentest completo da plataforma", detail: "É valioso, mas não cabe como atividade integral desta janela.", recommended: false },
      { id: "type-catalog", label: "Revisão visual de todo o catálogo", detail: "Consome o prazo sem atacar os riscos do checkout.", recommended: false }
    ]
  },
  {
    id: "environment",
    kicker: "AMBIENTE E DADOS",
    shortTitle: "Ambiente e dados",
    title: "Qual preparação torna a execução confiável?",
    instruction: "Selecione os três recursos mínimos para reproduzir cenários positivos, negativos e de compatibilidade.",
    type: "multi",
    min: 3,
    max: 3,
    points: 14,
    metrics: ["coverage", "feasibility"],
    tip: "Dados de teste fazem parte do plano: sem variações controladas, a cobertura fica apenas no papel.",
    feedback: "Sandbox, matriz enxuta de compatibilidade e massas variadas tornam os resultados repetíveis e seguros.",
    options: [
      { id: "env-sandbox", label: "Homologação com gateway sandbox", detail: "Usar credenciais isoladas e respostas controladas de pagamento.", recommended: true },
      { id: "env-matrix", label: "Chrome, Firefox e viewport mobile", detail: "Cobrir os ambientes prioritários informados pelo produto.", recommended: true },
      { id: "env-data", label: "Massas aprovadas, recusadas e cupons-limite", detail: "Preparar cartões, Pix e descontos com resultados conhecidos.", recommended: true },
      { id: "env-production", label: "Cartões reais diretamente em produção", detail: "Executar cobranças reais para acelerar a validação.", recommended: false },
      { id: "env-random", label: "Dados aleatórios sem resultado conhecido", detail: "Improvisar valores durante cada execução manual.", recommended: false },
      { id: "env-all-browsers", label: "Todos os navegadores já lançados", detail: "Ampliar a matriz sem considerar uso ou prazo.", recommended: false }
    ]
  },
  {
    id: "priorities",
    kicker: "REPLANEJAMENTO",
    shortTitle: "Cenários prioritários",
    title: "Com apenas dois dias, o que entra na execução prioritária?",
    instruction: "A release foi antecipada. Selecione os três cenários que melhor protegem receita e consistência dos pedidos.",
    type: "multi",
    min: 3,
    max: 3,
    points: 14,
    metrics: ["coverage", "risk", "feasibility"],
    tip: "Reduzir prazo não significa testar ao acaso: mantenha os fluxos de maior risco e registre o que foi adiado.",
    feedback: "O recorte preserva o caminho feliz, as falhas de pagamento e a idempotência das transações.",
    options: [
      { id: "priority-happy", label: "Compra aprovada cria um único pedido", detail: "Validar cartão e Pix até a confirmação final.", recommended: true },
      { id: "priority-declined", label: "Pagamento recusado não cria pedido pago", detail: "Confirmar mensagem, estado e possibilidade de nova tentativa.", recommended: true },
      { id: "priority-retry", label: "Nova tentativa não duplica cobrança", detail: "Cobrir timeout, duplo clique e reenvio da requisição.", recommended: true },
      { id: "priority-animation", label: "Animação de carregamento em todos os celulares", detail: "Revisar detalhes visuais em uma matriz extensa.", recommended: false },
      { id: "priority-copy", label: "Variações de texto promocional", detail: "Comparar todas as mensagens possíveis dos banners.", recommended: false },
      { id: "priority-history", label: "Histórico completo dos últimos cinco anos", detail: "Executar regressão ampla fora da área alterada.", recommended: false }
    ]
  },
  {
    id: "criteria",
    kicker: "ENTRADA E SAÍDA",
    shortTitle: "Critérios de conclusão",
    title: "Quando o plano pode recomendar a liberação?",
    instruction: "Escolha o conjunto de critérios que produz uma decisão objetiva e rastreável.",
    type: "single",
    min: 1,
    max: 1,
    points: 16,
    metrics: ["coverage", "risk", "feasibility"],
    tip: "Critérios de saída não prometem ausência de bugs; eles tornam o risco residual visível para a decisão.",
    feedback: "A decisão combina estabilidade, cobertura dos riscos críticos, defeitos conhecidos e evidências revisáveis.",
    options: [
      { id: "criteria-balanced", label: "Build estável, críticos aprovados e nenhum bloqueador", detail: "Registrar evidências, riscos residuais e aceite dos responsáveis.", quality: 1 },
      { id: "criteria-no-bugs", label: "Liberar somente quando não existir nenhum bug", detail: "Exigir ausência total de defeitos, independentemente do risco.", quality: .35 },
      { id: "criteria-deadline", label: "Liberar quando o prazo terminar", detail: "Usar apenas a data como critério de conclusão.", quality: .05 },
      { id: "criteria-happy", label: "Liberar quando uma compra funcionar", detail: "Considerar somente um caminho feliz executado com sucesso.", quality: .2 }
    ]
  }
];

const workspace = document.querySelector("#planning-workspace");
const resultScreen = document.querySelector("#planning-result");
const headerXp = document.querySelector("#header-xp");
const stepLabel = document.querySelector("#step-label");
const stepXp = document.querySelector("#step-xp");
const stepProgress = document.querySelector("#step-progress");
const progressElement = document.querySelector(".decision-progress__track");
const deadlineAlert = document.querySelector("#deadline-alert");
const decisionForm = document.querySelector("#decision-form");
const decisionKicker = document.querySelector("#decision-kicker");
const decisionTitle = document.querySelector("#decision-title");
const decisionInstruction = document.querySelector("#decision-instruction");
const selectionHint = document.querySelector("#selection-hint");
const decisionOptions = document.querySelector("#decision-options");
const decisionError = document.querySelector("#decision-error");
const decisionSubmit = document.querySelector("#decision-submit");
const decisionFeedback = document.querySelector("#decision-feedback");
const feedbackIcon = document.querySelector("#feedback-icon");
const feedbackTitle = document.querySelector("#feedback-title");
const feedbackText = document.querySelector("#feedback-text");
const feedbackRecommendation = document.querySelector("#feedback-recommendation");
const nextButton = document.querySelector("#decision-next");
const decisionCount = document.querySelector("#decision-count");
const planPreviewList = document.querySelector("#plan-preview-list");
const mentorTipText = document.querySelector("#mentor-tip-text");
const progressSaveStatus = document.querySelector("qa-save-status");
const restartButton = document.querySelector("#restart-planning");

const metricElements = {
  coverage: { value: document.querySelector("#coverage-value"), bar: document.querySelector("#coverage-bar") },
  risk: { value: document.querySelector("#risk-value"), bar: document.querySelector("#risk-bar") },
  feasibility: { value: document.querySelector("#feasibility-value"), bar: document.querySelector("#feasibility-bar") }
};

let currentStepIndex = 0;
let earnedXp = 0;
let records = [];
let stepEvaluated = false;

function getRecommendedOptions(step) {
  if (step.type === "single") return step.options.filter((option) => option.quality === 1);
  return step.options.filter((option) => option.recommended);
}

function getSelectedInputs() {
  return [...decisionOptions.querySelectorAll("input:checked")];
}

function isSelectionValid(step) {
  const count = getSelectedInputs().length;
  return count >= step.min && count <= step.max;
}

function updateSelectionState(changedInput) {
  if (stepEvaluated) return;
  const step = planningSteps[currentStepIndex];
  const selected = getSelectedInputs();

  if (step.type === "multi" && selected.length > step.max && changedInput) {
    changedInput.checked = false;
  }

  const reachedLimit = step.type === "multi" && getSelectedInputs().length >= step.max;
  decisionOptions.querySelectorAll("input:not(:checked)").forEach((input) => {
    input.disabled = reachedLimit;
  });

  decisionSubmit.disabled = !isSelectionValid(step);
  decisionError.hidden = true;
}

function createOption(step, option) {
  const label = document.createElement("label");
  label.className = "decision-option";

  const input = document.createElement("input");
  input.type = step.type === "single" ? "radio" : "checkbox";
  input.name = "planning-decision";
  input.value = option.id;
  input.addEventListener("change", () => updateSelectionState(input));

  const control = document.createElement("span");
  control.className = "decision-option__control";
  control.setAttribute("aria-hidden", "true");

  const copy = document.createElement("span");
  copy.className = "decision-option__copy";
  const title = document.createElement("strong");
  title.textContent = option.label;
  const detail = document.createElement("small");
  detail.textContent = option.detail;
  copy.append(title, detail);
  label.append(input, control, copy);
  return label;
}

function renderStep() {
  const step = planningSteps[currentStepIndex];
  stepEvaluated = false;
  stepLabel.textContent = `ETAPA ${currentStepIndex + 1} DE ${planningSteps.length}`;
  stepXp.textContent = `${earnedXp} / 100 XP`;
  stepProgress.style.width = `${((currentStepIndex + 1) / planningSteps.length) * 100}%`;
  progressElement.setAttribute("aria-valuenow", String(currentStepIndex + 1));
  deadlineAlert.hidden = currentStepIndex < 5;
  decisionKicker.textContent = step.kicker;
  decisionTitle.textContent = step.title;
  decisionInstruction.textContent = step.instruction;
  selectionHint.textContent = step.max === 1 ? "Escolha uma alternativa." : `Selecione exatamente ${step.max} alternativas.`;
  mentorTipText.textContent = step.tip;
  decisionOptions.replaceChildren(...step.options.map((option) => createOption(step, option)));
  decisionSubmit.disabled = true;
  decisionSubmit.hidden = false;
  decisionError.hidden = true;
  decisionFeedback.hidden = true;
  decisionFeedback.className = "decision-feedback";
  nextButton.hidden = true;
  nextButton.innerHTML = currentStepIndex === planningSteps.length - 1
    ? "Ver plano final <span aria-hidden=\"true\">→</span>"
    : "Próxima etapa <span aria-hidden=\"true\">→</span>";
  decisionTitle.focus();
}

function calculateStepPercentage(step, selectedOptions) {
  if (step.type === "single") return selectedOptions[0]?.quality || 0;

  const recommendedIds = new Set(getRecommendedOptions(step).map((option) => option.id));
  const correct = selectedOptions.filter((option) => recommendedIds.has(option.id)).length;
  const incorrect = selectedOptions.length - correct;
  return Math.max(0, Math.min(1, (correct - (incorrect * .5)) / recommendedIds.size));
}

function revealRecommendedOptions(step) {
  const recommendedIds = new Set(getRecommendedOptions(step).map((option) => option.id));
  decisionOptions.querySelectorAll("input").forEach((input) => {
    input.disabled = true;
    const option = input.closest(".decision-option");
    if (recommendedIds.has(input.value)) {
      option.classList.add(input.checked ? "is-revealed-correct" : "is-revealed-missed");
    }
  });
}

function getMetricScore(metricName) {
  const relevantRecords = records.filter((record) => record.metrics.includes(metricName));
  if (!relevantRecords.length) return 0;
  const total = relevantRecords.reduce((sum, record) => sum + record.percentage, 0);
  return Math.round((total / relevantRecords.length) * 100);
}

function renderMetrics() {
  Object.entries(metricElements).forEach(([metricName, elements]) => {
    const score = getMetricScore(metricName);
    elements.value.textContent = `${score}%`;
    elements.bar.style.width = `${score}%`;
  });
}

function renderPlanPreview() {
  decisionCount.textContent = `${records.length} / ${planningSteps.length}`;
  planPreviewList.replaceChildren();

  if (!records.length) {
    const item = document.createElement("li");
    item.textContent = "Suas escolhas formarão o plano final.";
    planPreviewList.append(item);
    return;
  }

  records.forEach((record) => {
    const item = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = record.shortTitle.toUpperCase();
    const value = document.createElement("strong");
    value.textContent = record.selected.map((option) => option.label).join(" · ");
    item.append(label, value);
    planPreviewList.append(item);
  });
}

function evaluateDecision(event) {
  event.preventDefault();
  if (stepEvaluated) return;

  const step = planningSteps[currentStepIndex];
  if (!isSelectionValid(step)) {
    decisionError.textContent = step.max === 1
      ? "Escolha uma alternativa antes de continuar."
      : `Selecione exatamente ${step.max} alternativas antes de continuar.`;
    decisionError.hidden = false;
    return;
  }

  const selectedIds = new Set(getSelectedInputs().map((input) => input.value));
  const selectedOptions = step.options.filter((option) => selectedIds.has(option.id));
  const percentage = calculateStepPercentage(step, selectedOptions);
  const points = Math.round(step.points * percentage);
  earnedXp += points;
  records.push({
    id: step.id,
    shortTitle: step.shortTitle,
    selected: selectedOptions,
    percentage,
    metrics: step.metrics
  });

  stepEvaluated = true;
  headerXp.textContent = String(earnedXp);
  stepXp.textContent = `${earnedXp} / 100 XP`;
  revealRecommendedOptions(step);
  renderMetrics();
  renderPlanPreview();

  const qualityClass = percentage >= .75 ? "" : percentage >= .4 ? "is-partial" : "is-low";
  decisionFeedback.className = `decision-feedback ${qualityClass}`.trim();
  decisionFeedback.hidden = false;
  feedbackIcon.textContent = percentage >= .75 ? "✓" : percentage >= .4 ? "!" : "↗";
  feedbackTitle.textContent = `${points} de ${step.points} XP nesta decisão`;
  feedbackText.textContent = step.feedback;
  feedbackRecommendation.textContent = `Referência: ${getRecommendedOptions(step).map((option) => option.label).join("; ")}.`;
  decisionSubmit.hidden = true;
  nextButton.hidden = false;
  nextButton.focus();
}

function createGeneratedPlan() {
  const grid = document.querySelector("#generated-plan-grid");
  grid.replaceChildren();

  records.forEach((record) => {
    const section = document.createElement("section");
    section.className = "generated-plan__section";
    const heading = document.createElement("h4");
    heading.textContent = record.shortTitle;
    const list = document.createElement("ul");

    record.selected.forEach((option) => {
      const item = document.createElement("li");
      item.textContent = option.label;
      list.append(item);
    });

    section.append(heading, list);
    grid.append(section);
  });
}

function getResultMessage() {
  if (earnedXp >= 85) return "Você criou um plano objetivo, orientado a riscos e viável mesmo após a redução do prazo.";
  if (earnedXp >= 65) return "Seu plano cobre os pontos centrais, mas ainda pode tornar prioridades e limites mais explícitos.";
  return "Você estruturou uma primeira versão do plano. Revise as recomendações para equilibrar melhor risco, cobertura e prazo.";
}

function showResult() {
  workspace.hidden = true;
  resultScreen.hidden = false;
  document.querySelector("#result-summary").textContent = getResultMessage();
  document.querySelector("#result-coverage").textContent = `${getMetricScore("coverage")}%`;
  document.querySelector("#result-risk").textContent = `${getMetricScore("risk")}%`;
  document.querySelector("#result-feasibility").textContent = `${getMetricScore("feasibility")}%`;
  document.querySelector("#result-xp").textContent = String(earnedXp);
  createGeneratedPlan();

  const savedProgress = window.QAQuestProgress.saveMissionResult("phase4", earnedXp);
  progressSaveStatus.show(savedProgress);
  document.querySelector("#planning-result-title").focus();
}

function goToNextStep() {
  if (currentStepIndex === planningSteps.length - 1) {
    showResult();
    return;
  }

  currentStepIndex += 1;
  renderStep();
}

function restartPlanning() {
  currentStepIndex = 0;
  earnedXp = 0;
  records = [];
  stepEvaluated = false;
  headerXp.textContent = "0";
  workspace.hidden = false;
  resultScreen.hidden = true;
  progressSaveStatus.reset();
  renderMetrics();
  renderPlanPreview();
  renderStep();
}

decisionForm.addEventListener("submit", evaluateDecision);
nextButton.addEventListener("click", goToNextStep);
restartButton.addEventListener("click", restartPlanning);
renderMetrics();
renderPlanPreview();
renderStep();
