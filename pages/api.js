// Fixed teaching fixtures. Nothing here sends HTTP or creates a real order.
function deepFreeze(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
const PRODUCTS = deepFreeze([
  { id: "P-URB-01", name: "Mochila Urbana", category: "accessories", price: 189.90 },
  { id: "P-NOT-02", name: "Mochila Notebook", category: "technology", price: 249.90 }
]);
const CHECKOUT_BODY = deepFreeze({
  items: [{ productId: "P-URB-01", quantity: 2 }],
  deliveryAddress: { zipCode: "00000-000", street: "Rua de Teste, 100 — Cidade Exemplo" },
  paymentMethod: "pix"
});
const checkoutResponse = orderId => ({
  orderId, status: "pending_payment", itemsTotal: 379.80, deliveryFee: 0, total: 379.80
});
const ORDER_BODY = deepFreeze({
  orderId: "BZ-API-1042", status: "pending_payment",
  items: [{ productId: "P-URB-01", quantity: 2, unitPrice: 189.90 }], total: 379.80
});
const CASES = deepFreeze([
  { id: "catalog", title: "Catálogo: controle e candidata", method: "GET", path: "/api/catalog", query: "category=accessories", body: null, points: 10,
    profile: "Comparação controlada · referência aderente versus perfil da candidata com filtro ignorado.",
    instruction: "Escolha o método de consulta. Simule primeiro a referência e depois a candidata, com a mesma categoria Acessórios. Compare as duas listas.",
    contract: "GET /api/catalog?category=accessories → 200 OK. items deve ser uma lista de produtos com id, name e category textuais e price numérico em reais. Todos devem pertencer a accessories. total é inteiro e igual ao número de itens; neste dado de teste: 1.",
    expectedStatus: "200 OK", expectedBody: { items: [PRODUCTS[0]], total: 1 },
    reference: { label: "Referência aderente · controle didático", status: "200 OK", body: { items: [PRODUCTS[0]], total: 1 } },
    response: { label: "Candidata · filtro ignorado", status: "200 OK", body: { items: PRODUCTS, total: 2 } },
    observed: "A referência retornou 200 e somente Mochila Urbana (1 item). A candidata retornou 200 e 2 itens: Mochila Urbana em accessories e Mochila Notebook em technology. O campo total corresponde à lista, mas o parâmetro category foi ignorado.",
    impact: "Consumidores da API exibem produtos fora da categoria solicitada. Status e contagem coerentes não compensam o filtro incorreto. O achado é semelhante ao filtro da missão de Regressão, mas aqui a evidência é a resposta do endpoint; a causa raiz não foi confirmada.",
    answer: ["filter"], classification: "Filtro ignorado na candidata; referência aderente.",
    options: [["pass", "Contrato atendido pela candidata, pois as duas respostas são 200."], ["filter", "Filtro ignorado pela candidata; a referência respeitou a categoria."], ["status", "Status HTTP divergente: o GET deveria criar um pedido com 201."], ["missing", "Campo obrigatório ausente: a resposta não contém items."]],
    feedback: "As duas respostas têm 200 e items. A candidata inclui technology quando recebeu accessories. A contagem 2 coincide com a lista; o defeito está no filtro, não na contagem." },
  { id: "created", title: "Checkout: criação aderente", method: "POST", path: "/api/checkout", query: null, body: CHECKOUT_BODY, points: 5,
    profile: "Perfil isolado · candidata · criação aderente do pedido BZ-API-1042.",
    instruction: "Escolha POST para enviar os itens, o endereço fictício e o pagamento simulado. Leia o body antes de simular a criação prevista no contrato.",
    contract: "POST /api/checkout cria um pedido e exige 201 Created neste contrato. orderId é texto não vazio, status é pending_payment e itemsTotal, deliveryFee e total são números em reais. Duas unidades de R$ 189,90 = R$ 379,80; entrega grátis; total = itemsTotal + deliveryFee. Todos esses campos são obrigatórios.",
    expectedStatus: "201 Created", expectedBody: checkoutResponse("BZ-API-1042"),
    response: { label: "Candidata · criação aderente", status: "201 Created", body: checkoutResponse("BZ-API-1042") },
    observed: "201 Created; orderId BZ-API-1042; status pending_payment; itemsTotal 379.80; deliveryFee 0; total 379.80. Campos e valores atendem ao contrato deste caso.",
    impact: "O consumidor recebe a confirmação de criação e os valores esperados. pending_payment não significa pagamento aprovado. Este caso passou no escopo informado; outros perfis ainda precisam ser avaliados.",
    answer: ["pass"], classification: "Contrato atendido neste caso.",
    options: [["status", "Status HTTP divergente: qualquer POST deve responder 200."], ["pass", "Contrato atendido: 201 indica a criação prevista e os campos e totais são coerentes."], ["paid", "Pagamento aprovado: pending_payment significa que o valor foi pago."], ["total", "Total divergente: 2 × 189,90 deveria ser 394,80."]],
    feedback: "O contrato declara criação e exige 201. Os campos estão presentes e 2 × R$ 189,90 = R$ 379,80, sem frete. pending_payment significa pagamento pendente; não houve pagamento real." },
  { id: "divergent", title: "Checkout: status e total divergentes", method: "POST", path: "/api/checkout", query: null, body: CHECKOUT_BODY, points: 5,
    profile: "Perfil isolado · candidata · resposta com defeitos intencionais para BZ-API-1043. Mesma entrada; captura fixa distinta do caso anterior.",
    instruction: "Envie o mesmo body ao perfil com falhas definido para este caso. Confira separadamente o status e a soma dos valores.",
    contract: "O mesmo contrato de criação exige 201 Created e os campos orderId (texto não vazio), status (pending_payment), itemsTotal, deliveryFee e total (números obrigatórios). Para estes itens: itemsTotal 379.80, deliveryFee 0 e total 379.80. O identificador pode variar entre pedidos; não é a falha.",
    expectedStatus: "201 Created", expectedBody: checkoutResponse("BZ-API-1043"),
    response: { label: "Candidata · status e cálculo divergentes", status: "200 OK", body: { ...checkoutResponse("BZ-API-1043"), total: 394.80 } },
    observed: "200 OK em vez de 201 Created. O body tem orderId BZ-API-1043, status pending_payment, itemsTotal 379.80 e deliveryFee 0, mas total 394.80: R$ 15,00 a mais sem taxa prevista.",
    impact: "O consumidor pode tratar a criação em desacordo com o status contratado e apresentar ou cobrar um total indevido. Há duas violações independentes, mesmo com JSON válido e status de sucesso.",
    answer: ["status", "total"], classification: "Status HTTP divergente e total divergente.",
    options: [["status", "Status HTTP divergente: veio 200 e o contrato deste caso exige 201."], ["pass", "Contrato atendido, porque 200 é sucesso e existe JSON."], ["total", "Total divergente: 394,80 difere de 379,80 + 0."], ["missing", "Campo obrigatório ausente: a resposta não tem orderId."]],
    feedback: "Selecione as duas violações: status 200 em vez do 201 contratado e total R$ 394,80 em vez de R$ 379,80. orderId está presente; sua variação entre pedidos não viola o contrato." },
  { id: "order", title: "Pedido: campo obrigatório ausente", method: "GET", path: "/api/orders/BZ-API-1042", query: null, body: null, points: 10,
    profile: "Perfil isolado · candidata · consulta de pedido fictício pré-carregado BZ-API-1042.",
    instruction: "Consulte o pedido de teste pelo identificador na rota. Compare todos os campos obrigatórios, mesmo que o status seja 200.",
    contract: "GET /api/orders/BZ-API-1042 → 200 OK. orderId deve coincidir com a rota; status é pending_payment; items lista productId textual, quantity inteira positiva e unitPrice numérico. total é um número obrigatório igual à soma dos itens neste pedido sem frete: 379.80.",
    expectedStatus: "200 OK", expectedBody: ORDER_BODY,
    response: { label: "Candidata · total ausente", status: "200 OK", body: { orderId: ORDER_BODY.orderId, status: ORDER_BODY.status, items: ORDER_BODY.items } },
    observed: "200 OK com orderId BZ-API-1042, status pending_payment e items contendo 2 × 189.90. O campo obrigatório total não foi enviado.",
    impact: "O consumidor não recebe o total previsto no contrato. Calcular uma soma local não substitui o campo obrigatório nem garante a mesma regra de preço do serviço. Não há valor errado em total: o campo está ausente.",
    answer: ["missing"], classification: "Campo obrigatório total ausente.",
    options: [["pass", "Contrato atendido: status 200 garante todos os campos."], ["total", "Total divergente: a resposta enviou total 394,80."], ["missing", "Campo obrigatório ausente: total não foi enviado no body."], ["status", "Status HTTP divergente: uma consulta GET deveria responder 201."]],
    feedback: "O GET retornou o 200 esperado, mas omitiu total. Isso é ausência de campo, não um total numérico incorreto; 394,80 pertence ao caso anterior." }
]);
const progress = window.QAQuestProgress;
const get = id => document.getElementById(id);
const classification = get("api-classification"), review = get("api-review");
const saveStatus = get("api-result").querySelector("qa-save-status");
const initialState = () => ({ step: 0, conceptPoints: null, referenceDone: false, executions: new Map(), records: new Map(),
  mistakes: new Set(), reviewPoints: {}, reviewAnswers: {}, finished: false });
let state = initialState();
const currentCase = () => CASES[state.step];
const score = () => (state.conceptPoints || 0) +
  CASES.filter(test => state.executions.has(test.id)).reduce((sum, test) => sum + test.points, 0) +
  [...state.records.values()].reduce((sum, points) => sum + points, 0) +
  Object.values(state.reviewPoints).reduce((sum, points) => sum + points, 0);
const pretty = value => JSON.stringify(value, null, 2);
const fullPath = test => test.path + (test.query ? "?" + test.query : "");
const requestText = test => test.method + " " + fullPath(test) +
  (test.body ? "\nContent-Type: application/json\n\n" + pretty(test.body) : "\nSem request body neste caso.");
const responseText = response => response.status + "\nContent-Type: application/json\n\n" + pretty(response.body);
function feedback(id, text = "") {
  get(id).textContent = text; get(id).hidden = !text;
}
function ensureAccess() {
  const allowed = progress.isTracksUnlocked();
  get("api-locked").hidden = allowed; get("api-content").hidden = !allowed;
  if (!allowed) {
    const phase4Available = progress.isPhaseUnlocked(4);
    get("api-locked-link").href = phase4Available ? "phase4.html" : "index.html";
    get("api-locked-link").textContent = phase4Available ? "Continuar Fase 4" : "Voltar à jornada";
  }
  return allowed;
}
function canExecute() {
  return ensureAccess() && !state.finished && state.conceptPoints !== null && !state.executions.has(currentCase().id);
}
function validateMethod() {
  if (get("api-method").value === currentCase().method) return true;
  feedback("api-request-feedback", "Escolha " + currentCase().method + " para executar a operação descrita neste contrato. A preparação da requisição não desconta XP.");
  get("api-method").focus(); return false;
}
function addDetail(target, label, text) {
  const row = document.createElement("div"), term = document.createElement("dt"), value = document.createElement("dd");
  term.textContent = label; value.textContent = text; row.append(term, value); target.append(row);
}
function makeResponse(response, profile) {
  const panel = document.createElement("section"), heading = document.createElement("h3"), status = document.createElement("span"), body = document.createElement("pre");
  panel.className = "api-response"; panel.dataset.responseProfile = profile;
  heading.textContent = response.label; status.textContent = response.status;
  body.textContent = "Content-Type: application/json\n\n" + pretty(response.body);
  panel.append(heading, status, body); return panel;
}
function makeEvidence(id) {
  const test = CASES.find(test => test.id === id), snapshot = state.executions.get(id);
  const evidence = document.createElement("details"), summary = document.createElement("summary"), details = document.createElement("dl");
  evidence.className = "api-evidence-item";
  evidence.dataset.failed = String(id !== "created");
  summary.textContent = test.title + " · " + (state.records.has(id) ? test.classification : "Classificação pendente");
  for (const [label, text] of [
    ["Candidata e perfil", snapshot.profile], ["Requisição executada", snapshot.request],
    ["Esperado", snapshot.expected], ["Respostas observadas", snapshot.responses],
    ["Comparação", snapshot.observed], ["Impacto", snapshot.impact],
    ["Classificação", state.records.has(id) ? test.classification : "Pendente"]
  ]) addDetail(details, label, text);
  evidence.append(summary, details); return evidence;
}
function renderProgress() {
  const count = state.records.size;
  get("header-xp").textContent = String(score()); get("api-count").textContent = count + " / 4";
  get("api-progress").setAttribute("aria-valuenow", String(count));
  get("api-progress-bar").style.width = count * 25 + "%";
  get("api-steps").replaceChildren(...CASES.map((test, index) => {
    const item = document.createElement("li"), title = document.createElement("strong"), status = document.createElement("small");
    title.textContent = String(index + 1).padStart(2, "0") + " · " + test.title;
    status.textContent = state.records.has(test.id) ? (test.id === "created" ? "Contrato atendido" : "Falha registrada") :
      state.executions.has(test.id) ? "Classifique a evidência" : state.step === index ? "Em execução" : "Próximo caso";
    if (index === state.step) item.setAttribute("aria-current", "step");
    item.append(title, status); return item;
  }));
  const evidenceIds = CASES.filter(test => state.executions.has(test.id)).map(test => test.id);
  get("api-evidence").replaceChildren(...evidenceIds.map(makeEvidence));
  if (!evidenceIds.length) {
    const empty = document.createElement("p"); empty.className = "api-note";
    empty.textContent = "As requisições e respostas registradas aparecerão aqui com comparação e impacto."; get("api-evidence").append(empty);
  }
  get("api-candidate-status").textContent = "BZ-2026.12.0 · " + count + " de 4 casos classificados. " +
    (state.records.has("catalog") ? "Filtro ignorado na candidata; continue para delimitar os outros contratos." : "Parecer pendente.");
  review.hidden = count !== CASES.length;
  get("api-review-hint").hidden = count === CASES.length;
}
function renderStep(focus = true) {
  const test = currentCase();
  get("api-case-label").textContent = "CASO API-0" + (state.step + 1) + " · CONTRATO LOCAL";
  get("api-case-title").textContent = test.title; get("api-instruction").textContent = test.instruction;
  get("api-contract-copy").textContent = test.contract;
  get("api-expected-response").textContent = test.expectedStatus + "\n\n" + pretty(test.expectedBody);
  get("api-contract-copy").parentElement.querySelector("details").open = false;
  get("api-profile").textContent = test.profile;
  get("api-request-path").textContent = "bazaraza.test" + test.path;
  get("api-request-details").replaceChildren();
  addDetail(get("api-request-details"), "Parâmetros", test.query || (test.id === "order" ? "Parâmetro de rota: orderId = BZ-API-1042. Sem query string." : "Sem query string ou parâmetro de rota."));
  addDetail(get("api-request-details"), "Headers enviados", test.body ? "Content-Type: application/json" : "Nenhum header adicional neste exemplo simplificado.");
  get("api-request-body").textContent = test.body ? pretty(test.body) : "Sem request body neste GET.";
  get("api-request-body-panel").open = Boolean(test.body);
  get("api-request-form").reset();
  get("api-request-form").querySelectorAll("button,select").forEach(control => { control.disabled = false; });
  get("api-run-reference").hidden = !test.reference;
  get("api-execute").disabled = Boolean(test.reference);
  get("api-execute").textContent = test.reference ? "2. Simular candidata" : "Simular resposta deste perfil";
  get("api-responses").replaceChildren(); get("api-observation").hidden = true;
  classification.hidden = true; classification.reset();
  get("api-options").replaceChildren();
  for (const [value, text] of test.options) {
    const label = document.createElement("label"), input = document.createElement("input");
    input.type = "checkbox"; input.name = "classification"; input.value = value;
    label.append(input, document.createTextNode(text)); get("api-options").append(label);
  }
  classification.querySelector("button").disabled = false;
  feedback("api-request-feedback"); feedback("api-classification-feedback");
  get("api-next").hidden = true;
  get("api-next").textContent = state.step === CASES.length - 1 ? "Emitir parecer →" : "Próximo cenário →";
  renderProgress(); if (focus) get("api-case-title").focus();
}
get("api-concept").addEventListener("submit", event => {
  event.preventDefault();
  if (!ensureAccess() || state.finished || state.conceptPoints !== null) return;
  const answer = new FormData(event.currentTarget).get("concept");
  if (!answer) return;
  if (answer !== "contract") {
    state.mistakes.add("concept");
    feedback("api-concept-feedback", "Compare o pedido enviado com o status e os dados recebidos segundo o contrato. E2E, Regressão, Smoke, Sanidade e Performance respondem a outras perguntas; um status de sucesso sozinho não basta. A correção vale 5 XP."); return;
  }
  state.conceptPoints = state.mistakes.has("concept") ? 5 : 10;
  get("api-concept-panel").hidden = true; get("api-workspace").hidden = false;
  renderStep();
});
get("api-run-reference").addEventListener("click", () => {
  if (!canExecute() || !currentCase().reference || state.referenceDone || !validateMethod()) return;
  state.referenceDone = true;
  get("api-responses").append(makeResponse(currentCase().reference, "reference"));
  get("api-run-reference").disabled = true; get("api-method").disabled = true;
  get("api-execute").disabled = false;
  feedback("api-request-feedback", "Referência aderente: 200, um item em accessories e total 1. Ela é um controle didático, não uma aprovação da candidata. Agora compare o perfil da candidata.");
  get("api-execute").focus();
});
get("api-request-form").addEventListener("submit", event => {
  event.preventDefault();
  if (!canExecute() || !validateMethod()) return;
  const test = currentCase();
  if (test.reference && !state.referenceDone) return;
  get("api-responses").append(makeResponse(test.response, test.id));
  state.executions.set(test.id, Object.freeze({
    profile: "BZ-2026.12.0 · " + test.profile,
    request: requestText(test), expected: test.contract + "\nExemplo aderente:\n" + test.expectedStatus + "\n" + pretty(test.expectedBody),
    responses: (test.reference ? test.reference.label + "\n" + responseText(test.reference) + "\n\n" : "") + test.response.label + "\n" + responseText(test.response),
    observed: test.observed, impact: test.impact
  }));
  get("api-request-form").querySelectorAll("button,select").forEach(control => { control.disabled = true; });
  get("api-observation").hidden = false; get("api-observed-copy").textContent = test.observed;
  classification.hidden = false;
  feedback("api-request-feedback", "Perfil executado localmente. +" + test.points + " XP pela execução. Classifique a evidência para prosseguir.");
  renderProgress(); classification.querySelector("input").focus();
});
classification.addEventListener("submit", event => {
  event.preventDefault();
  const test = currentCase();
  if (!ensureAccess() || state.finished || !state.executions.has(test.id) || state.records.has(test.id)) return;
  const answers = new FormData(classification).getAll("classification");
  if (!answers.length) { feedback("api-classification-feedback", "Selecione ao menos uma classificação antes de registrar."); return; }
  const correct = answers.length === test.answer.length && test.answer.every(answer => answers.includes(answer));
  if (!correct) {
    state.mistakes.add(test.id);
    feedback("api-classification-feedback", test.feedback + " A classificação corrigida vale 5 XP."); return;
  }
  const points = state.mistakes.has(test.id) ? 5 : 10;
  state.records.set(test.id, points);
  classification.querySelectorAll("input,button").forEach(control => { control.disabled = true; });
  feedback("api-classification-feedback", "Evidência classificada. " + test.feedback + " +" + points + " XP.");
  get("api-next").hidden = false; renderProgress(); get("api-next").focus();
});
get("api-next").addEventListener("click", () => {
  if (!ensureAccess() || state.finished || !state.records.has(currentCase().id)) return;
  if (state.step < CASES.length - 1) { state.step++; renderStep(); }
  else get("api-review-title").focus();
});
review.addEventListener("submit", event => {
  event.preventDefault();
  if (!ensureAccess() || state.finished || state.records.size !== CASES.length) return;
  const data = new FormData(review);
  const answers = { decision: state.reviewAnswers.decision || data.get("decision"), reason: state.reviewAnswers.reason || data.get("reason") };
  if (!answers.decision || !answers.reason) { feedback("api-review-feedback", "Escolha um parecer e uma justificativa."); return; }
  for (const [key, correct] of [["decision", "return"], ["reason", "contracts"]]) {
    if (state.reviewAnswers[key]) continue;
    if (answers[key] !== correct) state.mistakes.add(key);
    else {
      state.reviewAnswers[key] = correct;
      state.reviewPoints[key] = state.mistakes.has(key) ? 5 : 10;
      review.querySelector('input[name="' + key + '"]').closest("fieldset").disabled = true;
    }
  }
  renderProgress();
  if (!state.reviewAnswers.decision || !state.reviewAnswers.reason) {
    feedback("api-review-feedback", "A criação do API-02 passou; a candidata falhou no filtro, no status e no total do outro checkout e na presença de total da consulta. A referência do catálogo é só um controle. Devolva a candidata para ajuste e nova validação deste escopo. Concluir a missão depende desse parecer; produção exige avaliação posterior. Cada resposta final corrigida vale 5 XP."); return;
  }
  let saved;
  try { saved = progress.saveMissionResult("api", score()); }
  catch { feedback("api-review-feedback", "Não foi possível concluir. Confira o acesso após a Fase 4 e tente salvar novamente."); return; }
  state.finished = true;
  get("api-workspace").hidden = true; get("api-result").hidden = false;
  get("api-result-xp").textContent = score() + " XP";
  get("api-result-summary").textContent = "Melhor resultado: " + saved.bestXp + " XP · Tentativas concluídas: " + saved.attempts + " · XP compartilhado: " + saved.totalXp + ".";
  get("api-result-evidence").replaceChildren(...CASES.map(test => makeEvidence(test.id)));
  saveStatus.show(saved); get("api-result-title").focus();
});
get("api-restart").addEventListener("click", () => {
  if (!ensureAccess()) return;
  state = initialState(); get("api-concept").reset(); review.reset();
  review.querySelectorAll("fieldset").forEach(fieldset => { fieldset.disabled = false; });
  get("api-result").hidden = true; get("api-workspace").hidden = true;
  get("api-concept-panel").hidden = false; get("api-result-evidence").replaceChildren();
  get("api-result").querySelector("details").open = false;
  get("api-evidence").replaceChildren(); get("api-responses").replaceChildren();
  feedback("api-concept-feedback"); feedback("api-review-feedback");
  saveStatus.reset(); get("header-xp").textContent = "0";
  get("api-concept").querySelector("input").focus();
});
if (ensureAccess()) get("header-xp").textContent = "0";
