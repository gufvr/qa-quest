// Four local teaching cases. No account service or network requests are used.
const ANA = Object.freeze({ name: "Ana Lima", email: "cliente.ana@bazaraza.test", order: "BZ-ANA-1042" });
const BRUNO = Object.freeze({ name: "Bruno Costa", email: "cliente.bruno@bazaraza.test", order: "BZ-BRU-2088",
  address: "Rua da Simulação, 20 — Cidade Exemplo", item: "1 × Mochila Notebook", total: "R$ 249,90" });
const ADDRESSES = Object.freeze({
  lab: "Alameda do Laboratório, 77 — Cidade Exemplo",
  simulation: "Praça da Simulação, 88 — Cidade Exemplo"
});
const CASES = [
  { id: "own", title: "Acesso aos próprios dados", path: "account", points: 10, answer: "allowed",
    instruction: "Primeiro tente abrir Minha Conta sem sessão. Depois entre como Ana e confira Minha Conta e Histórico.",
    expected: "Sem sessão: acesso negado, sem dados exibidos. Com Ana autenticada: somente Minha Conta de Ana e pedido BZ-ANA-1042.",
    control: "Autenticação e autorização do acesso próprio.",
    options: [
      ["allowed", "Controles corretos: sem sessão o acesso foi negado; Ana autenticada acessou apenas os próprios dados."],
      ["authentication", "Falha de autenticação: a área privada abriu sem sessão."],
      ["exposure", "Exposição de dados: o Histórico de Ana mostrou o pedido de Bruno."]
    ] },
  { id: "read", title: "Leitura de pedido de terceiros", path: "orders/BZ-BRU-2088", points: 5, answer: "unauthorized-read",
    instruction: "Mantenha a sessão de Ana e tente abrir o pedido de Bruno fornecido pelo time. Observe titular, dados e resposta.",
    expected: "Negar o acesso com mensagem segura, como “Você não tem permissão para acessar este pedido”, sem nome, endereço, itens ou valores de Bruno.",
    control: "Autorização de leitura e confidencialidade entre contas.",
    options: [
      ["unauthorized-read", "Falha de autorização com exposição indevida: Ana conseguiu ler dados do pedido de Bruno."],
      ["allowed", "Acesso permitido: autenticar Ana também libera todos os pedidos da loja."],
      ["denied", "Acesso negado corretamente: nenhum dado de Bruno foi exibido."]
    ] },
  { id: "write", title: "Alteração de pedido de terceiros", path: "orders/BZ-BRU-2088/address", points: 5, answer: "unauthorized-write",
    instruction: "Ainda como Ana, selecione um endereço fictício e tente salvar a alteração no pedido de Bruno. Compare antes e depois.",
    expected: "Negar a alteração, preservar o endereço de Bruno e não expor seus dados na tela de Ana.",
    control: "Autorização de alteração, integridade e confidencialidade.",
    options: [
      ["unauthorized-write", "Alteração não autorizada: o endereço do pedido de Bruno mudou sob a sessão de Ana; seus dados também ficaram expostos."],
      ["denied", "Alteração negada corretamente: o endereço original foi preservado."],
      ["authentication", "Falha de autenticação: Bruno entrou com senha incorreta."]
    ] },
  { id: "message", title: "Mensagens de login", path: "login", points: 10, answer: "revealing-message",
    instruction: "Sem sessão, compare o erro de uma senha incorreta para Ana com o erro de uma conta inexistente. Verifique também se alguma sessão foi criada.",
    expected: "Negar ambas as tentativas, sem criar sessão, e usar “E-mail ou senha inválidos” para as duas, sem revelar se uma conta existe.",
    control: "Autenticação das tentativas inválidas e exposição de informação na mensagem.",
    options: [
      ["revealing-message", "Mensagem excessivamente específica: ambas as entradas foram negadas, mas os erros permitem distinguir conta cadastrada de inexistente."],
      ["authentication", "Falha de autenticação: a conta inexistente entrou na aplicação."],
      ["safe", "Resposta segura: negar a entrada permite revelar livremente quais contas existem."]
    ] }
];
const progress = window.QAQuestProgress;
const get = id => document.getElementById(id);
const saveStatus = document.querySelector("qa-save-status");

function initialState() {
  return { step: 0, conceptPoints: null, session: null, guestDenied: false, knownDenied: false,
    address: BRUNO.address, previousAddress: null, executions: new Map(), records: new Map(),
    mistakes: new Set(), reviewPoints: { decision: 0, reason: 0 }, finished: false };
}
let state = initialState();
const currentCase = () => CASES[state.step];
const score = () => (state.conceptPoints || 0) +
  CASES.filter(test => state.executions.has(test.id)).reduce((sum, test) => sum + test.points, 0) +
  [...state.records.values()].reduce((sum, points) => sum + points, 0) +
  state.reviewPoints.decision + state.reviewPoints.reason;

function feedback(id, text) {
  get(id).textContent = text; get(id).hidden = !text;
}

function ensureAccess() {
  const unlocked = progress.isTracksUnlocked();
  get("security-locked").hidden = unlocked; get("security-content").hidden = !unlocked;
  if (!unlocked) {
    const phase4Available = progress.isPhaseUnlocked(4);
    get("security-locked-link").href = phase4Available ? "phase4.html" : "index.html";
    get("security-locked-link").textContent = phase4Available ? "Continuar Fase 4" : "Voltar à jornada";
  }
  return unlocked;
}

function canAct(id) {
  return ensureAccess() && !state.finished && state.conceptPoints !== null &&
    currentCase().id === id && !state.executions.has(id);
}

function sessionLabel() {
  return state.session === "ana" ? "Sessão: Ana Lima · cliente.ana@bazaraza.test · autenticada (simulada)." : "Sessão: sem autenticação.";
}

function showForeignOrder(element, address) {
  const title = document.createElement("h4"), details = document.createElement("dl");
  title.textContent = "Detalhe do Pedido · " + BRUNO.order;
  for (const [label, value] of [["Titular", BRUNO.name], ["Conta", BRUNO.email], ["Item", BRUNO.item], ["Total", BRUNO.total], ["Entrega", address]]) {
    const row = document.createElement("div"), term = document.createElement("dt"), description = document.createElement("dd");
    term.textContent = label; description.textContent = value; row.append(term, description); details.append(row);
  }
  const note = document.createElement("p");
  note.className = "security-store-note"; note.textContent = "Dados fictícios exibidos para a sessão de Ana.";
  element.replaceChildren(title, details, note);
}

function snapshot(id) {
  const common = { expected: CASES.find(test => test.id === id).expected };
  if (id === "own") return {
    ...common, identity: "Sem sessão no primeiro controle; depois Ana Lima autenticada.",
    action: "Abrir Minha Conta sem sessão; entrar com a conta fornecida de Ana; conferir Minha Conta e Histórico.",
    observed: "Sem sessão, a tela negou o acesso (401 simulado), sem dados privados. Após o login válido, exibiu Ana Lima, cliente.ana@bazaraza.test e somente BZ-ANA-1042 · 1 × Mochila Urbana · R$ 189,90.",
    impact: "O controle inicial protege a área privada; Ana consegue consultar os próprios dados. Este resultado não comprova o isolamento dos pedidos de outras contas.",
    learning: "O acesso próprio funcionou, mas ainda é necessário verificar as permissões entre contas."
  };
  if (id === "read") return {
    ...common, identity: "Ana Lima autenticada; titular do pedido solicitado: Bruno Costa.",
    action: "Tentar abrir o pedido BZ-BRU-2088 com a sessão de Ana.",
    observed: "O acesso foi permitido e exibiu Bruno Costa, " + BRUNO.email + ", " + BRUNO.item + ", " + BRUNO.total + " e entrega em " + state.address + ".",
    impact: "Dados de outro cliente ficaram expostos. A candidata apresenta uma falha crítica de autorização de leitura neste cenário.",
    learning: "Ana foi autenticada corretamente. A falha está na permissão de ler um pedido que não lhe pertence."
  };
  if (id === "write") return {
    ...common, identity: "Ana Lima autenticada; pedido alterado pertence a Bruno Costa.",
    action: "Salvar um endereço fictício no pedido BZ-BRU-2088 usando a sessão de Ana.",
    observed: "A alteração foi aceita. Antes: " + state.previousAddress + ". Depois: " + state.address + ". O pedido e o endereço foram atualizados na simulação.",
    impact: "A alteração indevida viola a integridade do pedido e poderia desviar uma entrega. A tela também expõe os dados de Bruno, afetando a confidencialidade. É uma falha crítica de autorização neste cenário.",
    learning: "Autenticação válida não concede permissão de alterar pedidos de outras pessoas."
  };
  return {
    ...common, identity: "Sem sessão; tentativa com Ana e senha incorreta, seguida de conta inexistente.",
    action: "Comparar os erros de cliente.ana@bazaraza.test e cliente.inexistente@bazaraza.test, ambos com credenciais inválidas.",
    observed: "Conta cadastrada + senha incorreta: “Senha incorreta”. Conta inexistente: “Esta conta não existe”. As duas entradas foram negadas e nenhuma sessão foi criada.",
    impact: "As respostas permitem distinguir uma conta cadastrada de uma inexistente. Essa exposição de informação pode auxiliar enumeração de contas.",
    learning: "Negar o login funcionou. O defeito desta evidência é a diferença informativa entre mensagens, e não uma entrada indevida."
  };
}

function evidence(id) {
  const test = CASES.find(test => test.id === id), data = state.executions.get(id);
  const item = document.createElement("details"), title = document.createElement("summary");
  item.className = "security-evidence-item"; item.dataset.finding = String(id !== "own");
  title.textContent = test.title + " · " + (state.records.has(id) ? id === "own" ? "Controle correto" : "Achado confirmado" : "Classificação pendente");
  item.append(title);
  for (const [label, text] of [["Sessão / identidade", data.identity], ["Ação", data.action],
    ["Esperado", data.expected], ["Observado", data.observed], ["Controle", test.control], ["Impacto", data.impact]]) {
    const paragraph = document.createElement("p"), strong = document.createElement("b");
    strong.textContent = label + ": "; paragraph.append(strong, document.createTextNode(text)); item.append(paragraph);
  }
  return item;
}

function renderProgress() {
  get("header-xp").textContent = String(score());
  get("security-count").textContent = state.records.size + " / 4";
  get("security-progress").setAttribute("aria-valuenow", String(state.records.size));
  get("security-bar").style.width = state.records.size / CASES.length * 100 + "%";
  get("security-steps").replaceChildren(...CASES.map((test, index) => {
    const item = document.createElement("li"), title = document.createElement("strong"), status = document.createElement("small");
    title.textContent = "0" + (index + 1) + " · " + test.title;
    status.textContent = state.records.has(test.id) ? test.id === "own" ? "✓ Controle correto" : "✓ Achado confirmado" :
      state.executions.has(test.id) ? "Classifique a evidência" : index === state.step ? "Em execução · " + test.points + " XP" : "Aguardando · " + test.points + " XP";
    if (index === state.step) item.setAttribute("aria-current", "step");
    item.append(title, status); return item;
  }));
  get("security-candidate-status").textContent = "BZ-2026.11.1 · " + state.records.size +
    " de 4 cenários classificados. " + (state.records.has("read") ? "Falha de autorização registrada; candidata sem aprovação." : "Parecer pendente.");
  const ids = CASES.filter(test => state.executions.has(test.id)).map(test => test.id);
  if (ids.length) get("security-evidence").replaceChildren(...ids.map(evidence));
  else {
    const empty = document.createElement("p"); empty.className = "security-note";
    empty.textContent = "Suas evidências aparecerão aqui após as ações. Os registros preservam o que foi observado em cada momento.";
    get("security-evidence").replaceChildren(empty);
  }
}

function renderStep(focus = true) {
  const test = currentCase(), executed = state.executions.has(test.id), recorded = state.records.has(test.id);
  document.querySelectorAll("[data-security-view]").forEach(view => { view.hidden = view.dataset.securityView !== test.id; });
  get("security-case-id").textContent = "CASO SEC-0" + (state.step + 1) + " · " + test.control;
  get("security-check-title").textContent = test.title;
  get("security-instruction").textContent = test.instruction;
  get("security-expected").textContent = test.expected;
  get("security-address").textContent = "bazaraza.test/" + test.path;
  get("security-session").textContent = sessionLabel();
  if (test.id === "write") showForeignOrder(get("security-write-order"), state.address);
  get("security-observation").hidden = !executed;
  get("security-observed").textContent = executed ? state.executions.get(test.id).observed : "";
  get("security-classification").hidden = !executed;
  get("security-options").replaceChildren(...test.options.map(([value, text]) => {
    const label = document.createElement("label"), input = document.createElement("input");
    input.type = "radio"; input.name = "classification"; input.value = value; input.required = true;
    input.disabled = recorded; input.checked = recorded && value === test.answer;
    label.append(input, document.createTextNode(text)); return label;
  }));
  get("security-classification").querySelector("button").disabled = recorded;
  feedback("security-classification-feedback", recorded ? state.executions.get(test.id).learning + " +" + state.records.get(test.id) + " XP pela classificação." : "");
  get("next-security").hidden = !recorded;
  get("next-security").textContent = state.step === CASES.length - 1 ? "Emitir parecer →" : "Próximo cenário →";
  renderProgress();
  if (focus) get("security-check-title").focus();
}

function markExecution(id) {
  if (!canAct(id)) return;
  // Keep immutable observations: changing the later address must not rewrite the earlier read evidence.
  state.executions.set(id, Object.freeze(snapshot(id)));
  document.querySelector('[data-security-view="' + id + '"]').querySelectorAll("input, select, button").forEach(control => { control.disabled = true; });
  renderStep(false); get("security-classification").querySelector("input").focus();
}

function initializeMission() {
  get("security-concept").addEventListener("submit", event => {
    event.preventDefault();
    if (!ensureAccess() || state.finished || state.conceptPoints !== null) return;
    const answer = new FormData(get("security-concept")).get("concept");
    if (!answer) return;
    if (answer !== "identity") {
      state.mistakes.add("concept");
      feedback("security-concept-feedback", "Autenticação confirma a identidade; autorização limita os dados e as ações dessa identidade. Os outros tipos de teste têm objetivos próprios e não substituem esses controles. Corrija para ganhar 5 XP.");
      return;
    }
    state.conceptPoints = state.mistakes.has("concept") ? 5 : 10;
    get("security-concept-panel").hidden = true; get("security-workspace").hidden = false; renderStep();
  });
  get("security-check-guest").addEventListener("click", () => {
    if (!canAct("own") || state.session || state.guestDenied) return;
    state.guestDenied = true;
    get("security-check-guest").disabled = true; get("security-login").hidden = false;
    feedback("security-guest-feedback", "401 simulado · Acesso negado. Entre para ver Minha Conta. Nenhum dado privado foi exibido.");
    get("security-login").querySelector("button").focus();
  });
  get("security-login").addEventListener("submit", event => {
    event.preventDefault();
    if (!canAct("own") || !state.guestDenied || state.session) return;
    state.session = "ana";
    get("security-login").hidden = true; get("security-own-panels").hidden = false;
    get("security-session").textContent = sessionLabel();
    get("security-address").textContent = "bazaraza.test/account";
    get("security-check-own").focus();
  });
  get("security-check-own").addEventListener("click", () => {
    if (canAct("own") && state.guestDenied && state.session === "ana") markExecution("own");
  });
  get("security-open-foreign").addEventListener("click", () => {
    if (!canAct("read") || state.session !== "ana") return;
    showForeignOrder(get("security-foreign-order"), state.address); get("security-foreign-order").hidden = false;
    markExecution("read");
  });
  get("security-change-address").addEventListener("submit", event => {
    event.preventDefault();
    if (!canAct("write") || state.session !== "ana") return;
    const choice = get("security-new-address").value;
    if (!Object.hasOwn(ADDRESSES, choice)) return;
    state.previousAddress = state.address;
    // Intentional missing ownership check in this local fixture.
    state.address = ADDRESSES[choice];
    feedback("security-address-feedback", "Alteração aceita na simulação. Endereço atualizado para " + state.address + ".");
    markExecution("write");
  });
  get("security-test-known").addEventListener("click", () => {
    if (!canAct("message") || state.session || state.knownDenied) return;
    state.knownDenied = true; get("security-test-known").disabled = true;
    feedback("security-known-feedback", "Senha incorreta");
    get("security-test-unknown").disabled = false; get("security-test-unknown").focus();
  });
  get("security-test-unknown").addEventListener("click", () => {
    if (!canAct("message") || state.session || !state.knownDenied) return;
    feedback("security-unknown-feedback", "Esta conta não existe");
    markExecution("message");
  });
  get("security-classification").addEventListener("submit", event => {
    event.preventDefault();
    const test = currentCase();
    if (!ensureAccess() || state.finished || !state.executions.has(test.id) || state.records.has(test.id)) return;
    const answer = new FormData(get("security-classification")).get("classification");
    if (!answer) return;
    if (answer !== test.answer) {
      state.mistakes.add(test.id);
      feedback("security-classification-feedback", state.executions.get(test.id).learning +
        " Esperado: " + test.expected + " Observado: " + state.executions.get(test.id).observed + " Corrija para ganhar 5 XP.");
      return;
    }
    state.records.set(test.id, state.mistakes.has(test.id) ? 5 : 10);
    renderStep(false); get("next-security").focus();
  });
  get("next-security").addEventListener("click", () => {
    if (!ensureAccess() || state.finished || !state.records.has(currentCase().id)) return;
    if (state.step < CASES.length - 1) {
      state.step++;
      if (currentCase().id === "message") state.session = null;
      renderStep();
    } else {
      get("security-review").hidden = false; get("security-review-hint").hidden = true;
      get("next-security").hidden = true; get("security-review-title").focus();
    }
  });
  get("security-review").addEventListener("submit", event => {
    event.preventDefault();
    if (!ensureAccess() || state.finished || state.records.size !== CASES.length || get("security-review").hidden) return;
    const data = new FormData(get("security-review")), decision = data.get("decision"), reason = data.get("reason");
    if (!decision || !reason) return;
    for (const [key, answer, correct] of [["decision", decision, "return"], ["reason", reason, "controls"]]) {
      if (answer !== correct) state.mistakes.add(key);
      state.reviewPoints[key] = answer === correct ? state.mistakes.has(key) ? 5 : 10 : 0;
    }
    get("header-xp").textContent = String(score());
    if (decision !== "return" || reason !== "controls") {
      feedback("security-review-feedback", "O acesso próprio funcionou e as tentativas inválidas foram negadas. Mesmo assim, Ana leu e alterou o pedido de Bruno, e os erros distinguem contas. Devolva a candidata para correção e nova avaliação. Smoke, Sanidade, Regressão, E2E e Performance não substituem estes controles. Concluir a missão exige esse parecer fundamentado; a candidata permanece reprovada neste escopo, sem aprovação para produção. Cada item corrigido vale 5 XP.");
      return;
    }
    let saved;
    try { saved = progress.saveMissionResult("security", score()); }
    catch { feedback("security-review-feedback", "Não foi possível salvar. Confira a conclusão da Fase 4 e tente novamente."); return; }
    state.finished = true; get("security-workspace").hidden = true; get("security-result").hidden = false;
    get("security-result-xp").textContent = score() + " XP";
    get("security-result-summary").textContent = "Missão concluída pelo parecer correto; candidata reprovada neste escopo. Melhor resultado: " +
      saved.bestXp + " XP · Tentativas concluídas: " + saved.attempts + " · XP compartilhado: " + saved.totalXp + ".";
    get("security-result-evidence").replaceChildren(...CASES.map(test => evidence(test.id)));
    saveStatus.show(saved); get("security-result-title").focus();
  });
  get("restart-security").addEventListener("click", () => {
    if (!ensureAccess()) return;
    state = initialState();
    document.querySelectorAll(".security-page main form").forEach(form => form.reset());
    document.querySelectorAll(".security-store input, .security-store select, .security-store button").forEach(control => { control.disabled = false; });
    for (const id of ["security-login", "security-own-panels", "security-foreign-order", "security-review", "security-result"]) get(id).hidden = true;
    for (const id of ["security-concept-feedback", "security-guest-feedback", "security-address-feedback", "security-known-feedback", "security-unknown-feedback", "security-classification-feedback", "security-review-feedback"]) feedback(id, "");
    get("security-test-unknown").disabled = true; get("security-review-hint").hidden = false;
    get("security-concept-panel").hidden = false; get("security-workspace").hidden = true;
    get("security-foreign-order").replaceChildren(); get("security-result-evidence").replaceChildren();
    get("security-result").querySelector("details").open = false;
    saveStatus.reset(); renderStep(false);
    get("security-concept").querySelector("input").focus();
  });
  renderProgress();
}
if (ensureAccess()) initializeMission();
