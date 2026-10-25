// Guided report authoring from a known, entirely local regression.
const REPORT = Object.freeze({
  title: "[Catálogo] Filtro Acessórios mantém Mochila Notebook nos resultados",
  environment: "Homologação fictícia · BZ-2026.10.2 · navegador de laboratório desktop (simulado) · bazaraza.test/catalog.",
  preconditions: "Catálogo disponível, sem login obrigatório; Mochila Urbana em Acessórios e Mochila Notebook em Tecnologia. Referência BZ-2026.09: filtro restringia a categoria.",
  expected: "Após buscar Mochila e selecionar Acessórios, exibir apenas Mochila Urbana: 1 resultado.",
  observed: "O seletor mostra Acessórios, mas a lista mantém Mochila Urbana (Acessórios) e Mochila Notebook (Tecnologia): 2 resultados.",
  impact: "Clientes recebem produtos fora da categoria. A navegação da campanha fica prejudicada; busca direta e compra continuam disponíveis.",
  severity: "S3 · Moderada — função de filtro prejudicada, com busca direta e compra disponíveis.",
  priority: "P1 · Tratar antes da campanha em 24 horas, que depende da navegação por categorias.",
  evidence: "EV-01 · Registro textual das ações: abrir catálogo → buscar Mochila → selecionar Acessórios → conferir a lista.\nEV-02 · Registro textual do estado: BZ-2026.10.2; Acessórios selecionado; 2 resultados, incluindo Mochila Notebook (Tecnologia). Referência: apenas Mochila Urbana.",
  status: "Pronto para encaminhar à triagem no exercício. Causa raiz não confirmada. Defeito permanece reproduzível; sem aprovação de release ou produção."
});
const STEPS = Object.freeze({
  open: "Abrir o catálogo da candidata BZ-2026.10.2 no ambiente fictício.",
  search: "Buscar Mochila e conferir os dois produtos iniciais.",
  filter: "Selecionar a categoria Acessórios.",
  compare: "Comparar a lista com o esperado: somente Mochila Urbana."
});
const ORDER = ["open", "search", "filter", "compare"];
const QUESTIONS = [
  { id: "title", title: "Um título que localiza o problema.", legend: "Qual título descreve ação e falha observável?", help: "Seja específico e evite afirmar uma causa que ainda não foi investigada.", answer: "specific",
    options: [["vague", "O site está com problema."], ["specific", REPORT.title], ["cause", "O banco de dados está quebrado por culpa do backend."]],
    feedback: "O título precisa indicar Catálogo, filtro Acessórios e o produto de outra categoria mantido na lista. Nenhuma evidência desta tela confirma falha no banco.",
    fields: [["Título", REPORT.title]] },
  { id: "context", title: "Ambiente e pré-condições.", legend: "Qual contexto permite repetir o mesmo caso?", help: "Use a versão e os dados realmente fornecidos. O navegador de laboratório é simulado; esta missão não mede compatibilidade com um navegador real.", answer: "complete",
    options: [["missing", "Aconteceu hoje no meu computador, com alguns produtos."], ["invented", "Produção, usuário administrador e carrinho cheio; não é necessário informar a versão."], ["complete", REPORT.environment + " Pré-condições: " + REPORT.preconditions]],
    feedback: "Informe homologação fictícia, candidata BZ-2026.10.2, catálogo e os dois produtos. Login e carrinho não são pré-condições deste defeito.",
    fields: [["Ambiente", REPORT.environment], ["Pré-condições", REPORT.preconditions]] },
  { id: "steps", type: "order", title: "Passos mínimos e em ordem.", legend: "Organize as ações para outra pessoa reproduzir.", help: "Use Subir e Descer para organizar. A reprodução começa no catálogo, usa o dado Mochila e termina comparando o filtro.",
    feedback: "A sequência reproduzível é abrir catálogo, buscar Mochila, selecionar Acessórios e comparar a lista. A ordem importa para repetir o mesmo estado.",
    fields: [["Passos para reproduzir", ORDER.map((id, index) => (index + 1) + ". " + STEPS[id]).join("\n")]] },
  { id: "behavior", title: "Esperado, observado e impacto.", legend: "Qual descrição separa os três pontos?", help: "Compare a referência com o resultado obtido e explique a consequência para o cliente.", answer: "facts",
    options: [["guess", "Esperado: corrigir tudo. Observado: provavelmente o banco falhou. Impacto: todos os pagamentos foram perdidos."], ["facts", "Esperado: somente Mochila Urbana. Observado: duas mochilas, incluindo Tecnologia. Impacto: clientes recebem itens fora da categoria; a busca direta e a compra funcionam."], ["same", "Esperado e observado: o filtro existe na tela. Impacto: nenhum, pois o seletor muda."]],
    feedback: "O seletor mudar não prova que o filtro funciona. A lista deveria ter 1 resultado e continua com 2. O impacto conhecido é no refinamento de produtos, sem evidência de falha em pagamentos.",
    fields: [["Resultado esperado", REPORT.expected], ["Resultado observado", REPORT.observed], ["Impacto", REPORT.impact]] },
  { id: "severity", title: "Severidade: qual é o impacto?", legend: "Qual severidade atende à escala desta equipe?", help: "Classifique o efeito observado usando os critérios abaixo. A proximidade da campanha será tratada na prioridade.", answer: "s3",
    options: [["s1", "S1 · Crítica: todas as compras estão bloqueadas."], ["s3", "S3 · Moderada: o filtro falha, mas existem alternativas de busca e compra."], ["s4", "S4 · Baixa: apenas uma diferença de aparência."]],
    feedback: "Pela escala apresentada, o filtro prejudicado com alternativa disponível é S3. Não há indisponibilidade geral ou perda de dados, e o defeito altera resultados, não apenas aparência.",
    fields: [["Severidade", REPORT.severity]] },
  { id: "priority", title: "Prioridade: quando tratar?", legend: "Qual prioridade corresponde ao contexto da campanha?", help: "A urgência vem do negócio e do risco. Um defeito S3 pode receber prioridade P1 sem mudar sua severidade.", answer: "p1",
    options: [["p2", "P2 · Deixar para uma próxima iteração, ignorando a campanha."], ["p0", "P0 · Declarar emergência por indisponibilidade geral em produção."], ["p1", "P1 · Tratar antes da campanha em 24 horas, pois ela depende de categorias."]],
    feedback: "A equipe definiu que o filtro precisa funcionar antes da campanha de amanhã: P1. Isso não torna o impacto S1 nem representa uma emergência em produção.",
    fields: [["Prioridade", REPORT.priority]] },
  { id: "evidence", type: "multiple", title: "Evidências que sustentam o relato.", legend: "Selecione os dois registros úteis para reproduzir e comparar.", help: "Os anexos deste laboratório são textuais. Consulte os registros da reprodução no rascunho; não existem prints, vídeos ou logs reais anexados.", answer: ["trace", "snapshot"],
    options: [["trace", "EV-01 · Sequência registrada: catálogo → buscar Mochila → selecionar Acessórios → conferir lista."], ["cart", "EV-03 · Descrição de um carrinho vazio, sem categoria ou versão."], ["snapshot", "EV-02 · BZ-2026.10.2, filtro Acessórios, duas mochilas e referência esperada de um resultado."], ["guess", "EV-04 · Afirmação sem log ou investigação: a causa é o banco de dados."]],
    feedback: "EV-01 mostra como chegar ao problema; EV-02 registra versão, filtro, lista observada e referência esperada. Carrinho vazio não sustenta o caso e uma causa presumida não é evidência.",
    fields: [["Evidências selecionadas", REPORT.evidence]] },
  { id: "decision", title: "O relato está pronto?", legend: "Qual é o parecer sobre este relato?", help: "Revise todos os campos e as evidências do rascunho antes de decidir.", answer: "ready",
    options: [["fixed", "Defeito corrigido, porque os campos do relato estão preenchidos."], ["ready", "Relato pronto para encaminhar à triagem: o problema é reproduzível e o impacto está fundamentado."], ["production", "Aplicação aprovada para produção, porque o relato foi concluído."]],
    feedback: "Completar o relato permite encaminhar o defeito à equipe. O filtro continua falhando: escrever o relato não corrige código nem aprova a candidata ou produção.",
    fields: [["Parecer sobre o relato", "Pronto para encaminhar à triagem no exercício."]] },
  { id: "reason", title: "Fundamente o encaminhamento.", legend: "Por que a equipe consegue investigar com este relato?", help: "Não é necessário adivinhar a causa raiz. A qualidade da reprodução e das evidências fundamenta a triagem.", answer: "reproducible",
    options: [["title-only", "Um título é suficiente; versão, passos e evidências são opcionais."], ["root-cause", "É preciso afirmar que o backend causou o defeito, mesmo sem evidências."], ["reproducible", "Versão, pré-condições, passos, esperado, observado, impacto e evidências permitem reproduzir; severidade e prioridade têm justificativas explícitas."]],
    feedback: "O relato está pronto por conter contexto verificável, sequência reproduzível, comparação e impacto. Causa raiz fica para investigação; a candidata segue com o defeito conhecido.",
    fields: [["Encaminhamento e limites", REPORT.status]] }
];

const progress = window.QAQuestProgress;
const get = id => document.getElementById(id);
const form = get("report-answer-form");
const initialState = () => ({ step: 0, captured: false, finished: false, points: new Map(), mistakes: new Set(),
  order: ["filter", "open", "compare", "search"], fields: new Map(), snapshot: null });
let state = initialState();
const score = () => [...state.points.values()].reduce((total, value) => total + value, 0);
function feedback(id, text = "") {
  get(id).textContent = text; get(id).hidden = !text;
}
function ensureAccess() {
  const allowed = progress.isTracksUnlocked();
  get("report-locked").hidden = allowed; get("report-content").hidden = !allowed;
  if (!allowed) {
    const phase4Available = progress.isPhaseUnlocked(4);
    get("report-locked-link").href = phase4Available ? "phase4.html" : "index.html";
    get("report-locked-link").textContent = phase4Available ? "Continuar Fase 4" : "Voltar à jornada";
  }
  return allowed;
}
function renderFields(target, fields) {
  target.replaceChildren();
  for (const [label, value] of fields) {
    const row = document.createElement("div"), term = document.createElement("dt"), description = document.createElement("dd");
    term.textContent = label; description.textContent = value;
    row.append(term, description); target.append(row);
  }
}
function renderProgress() {
  get("header-xp").textContent = String(score());
  get("report-count").textContent = state.points.size + " / 10 etapas";
  get("report-progress").setAttribute("aria-valuenow", String(state.points.size));
  get("report-progress-bar").style.width = state.points.size * 10 + "%";
  renderFields(get("report-draft-fields"), state.fields);
  if (!state.fields.size) {
    const empty = document.createElement("p");
    empty.className = "report-note"; empty.textContent = "Reproduza o defeito para iniciar. Cada resposta confirmada acrescenta os campos do relato.";
    get("report-draft-fields").append(empty);
  }
}
function renderOrder(focusId = null, direction = null) {
  get("report-order").replaceChildren(...state.order.map((id, index) => {
    const item = document.createElement("li"), text = document.createElement("span"), controls = document.createElement("div");
    item.dataset.step = id; text.textContent = (index + 1) + ". " + STEPS[id];
    for (const [label, offset] of [["Subir", -1], ["Descer", 1]]) {
      const button = document.createElement("button");
      button.type = "button"; button.textContent = label; button.dataset.direction = String(offset);
      button.setAttribute("aria-label", label + ": " + STEPS[id]);
      button.disabled = index + offset < 0 || index + offset >= state.order.length;
      button.addEventListener("click", () => {
        if (!ensureAccess() || state.finished || QUESTIONS[state.step].id !== "steps" || state.points.has("steps")) return;
        const other = index + offset;
        if (other < 0 || other >= state.order.length) return;
        [state.order[index], state.order[other]] = [state.order[other], state.order[index]];
        renderOrder(id, offset);
      });
      controls.append(button);
    }
    item.append(text, controls); return item;
  }));
  if (focusId) {
    const item = [...get("report-order").children].find(row => row.dataset.step === focusId);
    const buttons = [...item.querySelectorAll("button")];
    const preferred = buttons.find(button => button.dataset.direction === String(direction) && !button.disabled);
    (preferred || buttons.find(button => !button.disabled))?.focus();
  }
}
function renderQuestion(focus = true) {
  const question = QUESTIONS[state.step];
  form.reset(); feedback("report-question-feedback");
  get("report-question-panel").hidden = false;
  get("report-question-number").textContent = String(state.step + 2).padStart(2, "0") + " · CONSTRUIR E REVISAR";
  get("report-question-title").textContent = question.title;
  get("report-question-help").textContent = question.help;
  get("report-question-legend").textContent = question.legend;
  get("report-rubric").hidden = !["severity", "priority"].includes(question.id);
  get("report-options").replaceChildren();
  get("report-order").hidden = question.type !== "order";
  if (question.type === "order") renderOrder();
  else for (const [value, text] of question.options) {
    const label = document.createElement("label"), input = document.createElement("input");
    input.type = question.type === "multiple" ? "checkbox" : "radio";
    input.name = "answer"; input.value = value; input.required = question.type !== "multiple";
    label.append(input, document.createTextNode(text)); get("report-options").append(label);
  }
  form.querySelectorAll("input,button").forEach(control => {
    if (!control.closest("#report-order")) control.disabled = false;
  });
  get("report-next").hidden = true;
  get("report-next").textContent = state.step === QUESTIONS.length - 1 ? "Concluir missão e salvar" : "Continuar →";
  renderProgress();
  if (focus) get("report-question-title").focus();
}
function finishMission() {
  if (!ensureAccess() || state.finished || state.points.size !== 10) return;
  let saved;
  try { saved = progress.saveMissionResult("bug-report", score()); }
  catch { feedback("report-question-feedback", "Não foi possível concluir. Confira a conclusão da Fase 4 e tente salvar novamente."); return; }
  state.finished = true;
  get("report-workspace").hidden = true; get("report-result").hidden = false;
  get("report-result-xp").textContent = score() + " XP";
  get("report-result-best").textContent = saved.bestXp + " XP";
  get("report-result-attempts").textContent = String(saved.attempts);
  get("report-result-summary").textContent = "Relato preparado; defeito permanece na BZ-2026.10.2. XP compartilhado: " + saved.totalXp + ".";
  renderFields(get("report-final-fields"), state.fields);
  get("report-result").querySelector("qa-save-status").show(saved);
  get("report-result-title").focus();
}
get("report-search-form").addEventListener("submit", event => {
  event.preventDefault();
  if (!ensureAccess() || state.captured || state.finished) return;
  get("report-search-results").hidden = false;
  get("report-search-form").querySelector("button").disabled = true;
  get("report-filter").focus();
});
get("report-filter").addEventListener("change", () => {
  if (!ensureAccess() || state.captured || state.finished) return;
  const selected = get("report-filter").value === "accessories";
  // Intentional known regression: category selection never changes the product list.
  get("report-filter-status").textContent = "Categoria: " + (selected ? "Acessórios" : "Todas") + " · 2 resultados";
  get("report-capture").disabled = !selected;
});
get("report-capture").addEventListener("click", () => {
  if (!ensureAccess() || state.captured || state.finished || get("report-search-results").hidden || get("report-filter").value !== "accessories") return;
  state.captured = true; state.points.set("reproduction", 10);
  // Immutable evidence records survive the subsequent report exercises unchanged.
  state.snapshot = Object.freeze({ trace: "EV-01 · " + ORDER.map(id => STEPS[id]).join(" → "),
    comparison: "EV-02 · " + REPORT.environment + " Esperado: " + REPORT.expected + " Observado: " + REPORT.observed });
  renderFields(get("report-source-records"), [["Ações registradas", state.snapshot.trace], ["Comparação registrada", state.snapshot.comparison]]);
  get("report-source-evidence").hidden = false;
  get("report-reproduction").querySelectorAll("input,select,button").forEach(control => { control.disabled = true; });
  feedback("report-reproduction-feedback", "Reproduzido: Acessórios selecionado, mas 2 resultados. EV-01 e EV-02 foram registrados. +10 XP.");
  renderQuestion();
});
form.addEventListener("submit", event => {
  event.preventDefault();
  if (!ensureAccess() || !state.captured || state.finished) return;
  const question = QUESTIONS[state.step];
  if (state.points.has(question.id)) return;
  const selected = new FormData(form).getAll("answer");
  const valid = question.type === "order" ? state.order.every((id, index) => id === ORDER[index]) :
    question.type === "multiple" ? selected.length === question.answer.length && question.answer.every(id => selected.includes(id)) :
    selected.length === 1 && selected[0] === question.answer;
  if (!valid) {
    state.mistakes.add(question.id);
    feedback("report-question-feedback", question.feedback + " Ao corrigir, este item vale 5 XP.");
    return;
  }
  const points = state.mistakes.has(question.id) ? 5 : 10;
  state.points.set(question.id, points);
  question.fields.forEach(([label, value]) => state.fields.set(label, value));
  feedback("report-question-feedback", "Confirmado. " + question.feedback + " +" + points + " XP.");
  form.querySelectorAll("input,button").forEach(control => { control.disabled = true; });
  get("report-next").hidden = false;
  renderProgress(); get("report-next").focus();
});
get("report-next").addEventListener("click", () => {
  if (!ensureAccess() || state.finished || !state.points.has(QUESTIONS[state.step].id)) return;
  if (state.step === QUESTIONS.length - 1) finishMission();
  else { state.step++; renderQuestion(); }
});
get("report-restart").addEventListener("click", () => {
  if (!ensureAccess()) return;
  state = initialState(); form.reset(); get("report-search-form").reset();
  get("report-filter").value = "all";
  get("report-filter-status").textContent = "Categoria: Todas · 2 resultados";
  get("report-search-results").hidden = true;
  get("report-reproduction").querySelectorAll("input,select,button").forEach(control => { control.disabled = false; });
  get("report-capture").disabled = true;
  get("report-question-panel").hidden = true; get("report-result").hidden = true;
  get("report-workspace").hidden = false; get("report-source-evidence").hidden = true;
  get("report-source-evidence").open = false; get("report-source-records").replaceChildren();
  get("report-final-fields").replaceChildren();
  get("report-result").querySelector("qa-save-status").reset();
  feedback("report-reproduction-feedback"); feedback("report-question-feedback");
  renderProgress(); get("report-search-form").querySelector("button").focus();
});
get("report-download").addEventListener("click", () => {
  if (!ensureAccess() || !state.finished) return;
  const content = "BZ-QA-014 · Relato didático local da Bazaraza\n\n" +
    [...state.fields].map(([label, value]) => label + "\n" + value).join("\n\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url; link.download = "bazaraza-BZ-QA-014.txt"; document.body.append(link);
  link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
if (ensureAccess()) renderProgress();
