// Focused sanity session for the fictional BZ-2026.10.1 candidate.
// Only the R$ 15,00 total discrepancy is intentional. Everything runs locally.
const UNIT_PRICE_CENTS = 18990;
const EXTRA_FEE_CENTS = 1500;
const STEP_IDS = ["open", "fields", "consistency", "empty"];
const STEP_LABELS = ["Abrir Checkout", "Validar campos", "Conferir dados", "Carrinho vazio"];
const progress = window.QAQuestProgress;
const get = (id) => document.getElementById(id);
const fieldsForm = get("sanity-fields-form");
const classificationForm = get("sanity-classification");
const reviewForm = get("sanity-review");
const saveStatus = document.querySelector("qa-save-status");

function initialState() {
  return {
    step: 0, cart: null, checkoutTotal: null, paymentLabel: null,
    actions: new Set(), records: new Map(), classificationAttempts: {},
    decisionAttempts: 0, reasonAttempts: 0, decisionPoints: 0, reasonPoints: 0,
    finished: false
  };
}
let state = initialState();

function money(cents) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function currentId() {
  return STEP_IDS[state.step];
}

function score() {
  return state.actions.size * 10 +
    [...state.records.values()].reduce((total, record) => total + record.points, 0) +
    state.decisionPoints + state.reasonPoints;
}

function feedback(id, message) {
  get(id).textContent = message;
  get(id).hidden = !message;
}

function ensureAccess() {
  const unlocked = progress.isTracksUnlocked();
  get("sanity-locked").hidden = unlocked;
  get("sanity-content").hidden = !unlocked;
  if (!unlocked && progress.isPhaseUnlocked(4)) {
    get("sanity-locked-link").href = "phase4.html";
    get("sanity-locked-link").textContent = "Continuar Fase 4";
  }
  return unlocked;
}

function checkFor(id) {
  const common = { title: STEP_LABELS[STEP_IDS.indexOf(id)], outcome: "pass" };
  if (id === "open") return {
    ...common,
    action: "Abrir /checkout com " + state.cart.quantity + " unidade(s) da Mochila Urbana.",
    expected: "O Checkout deve responder sem 503 e exibir entrega e pagamento.",
    observed: "HTTP 200 OK. A tela exibiu entrega e pagamento; o 503 da BZ-2026.10 não foi reproduzido.",
    impact: "O impedimento original de abertura foi corrigido. A coerência dos dados ainda precisa ser verificada."
  };
  if (id === "fields") return {
    ...common,
    action: "Preencher endereço e CEP fictícios e selecionar uma forma de pagamento de teste.",
    expected: "Os campos de entrega devem aceitar dados válidos e permitir escolher o pagamento.",
    observed: "Endereço e CEP foram aceitos. Opção selecionada: " + state.paymentLabel + ". Nenhum pedido ou pagamento foi enviado.",
    impact: "O cliente consegue informar os dados essenciais na área que voltou a carregar."
  };
  if (id === "consistency") return {
    ...common, outcome: "fail",
    action: "Comparar item, quantidade e total do carrinho com o Checkout.",
    expected: "Manter " + state.cart.quantity + " unidade(s) da Mochila Urbana e total " + money(state.cart.total) + ", com frete grátis.",
    observed: "Item e quantidade foram mantidos, mas o Checkout mostra " + money(state.checkoutTotal) + ": R$ 15,00 a mais, sem taxa contratada.",
    impact: "O cliente pode pagar mais do que o total confirmado. A candidata precisa de ajuste, embora o 503 tenha sido corrigido."
  };
  return {
    ...common,
    action: "Tentar abrir o Checkout com um carrinho vazio separado.",
    expected: "Permanecer no carrinho e pedir um item antes de abrir o Checkout.",
    observed: "A loja manteve o cliente no carrinho e exibiu Adicione um item antes de continuar.",
    impact: "O fluxo evita uma finalização sem produtos. Essa condição próxima está funcionando."
  };
}

function makeEvidence(id) {
  const check = checkFor(id);
  const item = document.createElement("details");
  item.className = "sanity-evidence-item";
  item.dataset.outcome = check.outcome;
  const summary = document.createElement("summary");
  summary.textContent = check.title + " · " + (check.outcome === "pass" ? "Passou" : "Falhou");
  item.append(summary);
  for (const [label, value] of [
    ["Ação", check.action], ["Esperado", check.expected],
    ["Observado", check.observed], ["Impacto", check.impact]
  ]) {
    const paragraph = document.createElement("p");
    const prefix = document.createElement("b");
    prefix.textContent = label + ": ";
    paragraph.append(prefix, document.createTextNode(value));
    item.append(paragraph);
  }
  return item;
}

function renderProgress() {
  const count = state.records.size;
  get("sanity-count").textContent = count + " / 4";
  get("sanity-progress").setAttribute("aria-valuenow", String(count));
  get("sanity-bar").style.width = (count / STEP_IDS.length * 100) + "%";
  get("header-xp").textContent = String(score());
  get("sanity-steps").replaceChildren(...STEP_IDS.map((id, index) => {
    const item = document.createElement("li");
    item.className = index === state.step ? "is-current" : "";
    if (index === state.step) item.setAttribute("aria-current", "step");
    const number = document.createElement("span");
    number.textContent = String(index + 1).padStart(2, "0");
    const copy = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = STEP_LABELS[index];
    const status = document.createElement("small");
    status.textContent = state.records.has(id) ? (id === "consistency" ? "Falhou · total divergente" : "Passou") :
      state.actions.has(id) ? "Classifique o resultado" : index === state.step ? "Em verificação" : "Próximo";
    if (state.records.has(id)) item.dataset.outcome = id === "consistency" ? "fail" : "pass";
    copy.append(title, status);
    item.append(number, copy);
    return item;
  }));
  const status = get("sanity-candidate-status");
  status.dataset.failed = String(state.records.has("consistency"));
  status.textContent = state.records.has("consistency")
    ? "BZ-2026.10.1 · Total divergente. O 503 foi corrigido, mas esta candidata precisa voltar para ajuste."
    : state.records.has("open")
      ? "BZ-2026.10.1 · O 503 não se reproduz. Continue as verificações próximas antes de aceitar a correção."
      : "BZ-2026.10.1 · Aguardando verificações focadas.";
  if (count) {
    get("sanity-evidence").replaceChildren(...STEP_IDS.filter((id) => state.records.has(id)).map(makeEvidence));
  } else {
    const empty = document.createElement("p");
    empty.className = "sanity-tip";
    empty.textContent = "As evidências registradas poderão ser abertas aqui.";
    get("sanity-evidence").replaceChildren(empty);
  }
  reviewForm.hidden = count !== STEP_IDS.length;
  get("sanity-review-hint").hidden = count === STEP_IDS.length;
}

function renderStep(focus = true) {
  const id = currentId();
  const actionDone = state.actions.has(id);
  const recorded = state.records.has(id);
  const view = id === "empty" ? "empty" : id === "open" && !actionDone ? "cart" : "checkout";
  document.querySelectorAll("[data-sanity-view]").forEach((element) => {
    element.hidden = element.dataset.sanityView !== view;
  });
  get("sanity-address").textContent = "bazaraza.test/" + (view === "checkout" ? "checkout" : "cart");
  get("sanity-check-title").textContent = STEP_LABELS[state.step];
  const instructions = {
    open: "Com um item no carrinho, o Checkout deve abrir entrega e pagamento sem retornar 503.",
    fields: "Preencha dados fictícios e selecione um pagamento para verificar se os campos estão utilizáveis.",
    consistency: "Compare o mesmo item, a quantidade e o total. O frete é grátis e nenhuma taxa adicional foi contratada.",
    empty: "Neste caso separado, um carrinho vazio deve impedir a abertura do Checkout e pedir que um item seja adicionado."
  };
  get("sanity-expected").textContent = instructions[id];
  get("validate-sanity-fields").hidden = id !== "fields" || actionDone;
  get("compare-sanity-data").hidden = id !== "consistency" || actionDone;
  const fieldsDone = state.actions.has("fields");
  get("sanity-address-input").readOnly = fieldsDone;
  get("sanity-cep-input").readOnly = fieldsDone;
  get("sanity-payment-input").disabled = fieldsDone;
  get("sanity-observation").hidden = !actionDone;
  get("sanity-observed").textContent = actionDone ? checkFor(id).observed : "";
  classificationForm.hidden = !actionDone;
  classificationForm.querySelectorAll("button").forEach((button) => { button.disabled = recorded; });
  feedback("sanity-classification-feedback", recorded
    ? "Evidência registrada. " + checkFor(id).impact + " +" + state.records.get(id).points + " XP pela classificação." : "");
  get("next-sanity-check").hidden = !recorded;
  get("next-sanity-check").textContent = state.step === STEP_IDS.length - 1 ? "Emitir parecer →" : "Continuar verificação →";
  renderProgress();
  if (focus) get("sanity-check-title").focus();
}

function markAction(id) {
  if (state.actions.has(id)) return;
  state.actions.add(id);
  renderStep(false);
  classificationForm.querySelector("button").focus();
}

function populateCheckout() {
  const quantity = Number(get("sanity-quantity").value);
  if (![1, 2, 3].includes(quantity)) return false;
  state.cart = Object.freeze({ quantity, total: quantity * UNIT_PRICE_CENTS });
  state.checkoutTotal = state.cart.total + EXTRA_FEE_CENTS;
  get("sanity-cart-reference").textContent = quantity + " × Mochila Urbana · " + money(state.cart.total);
  get("sanity-checkout-quantity").textContent = quantity + " unidade(s)";
  get("sanity-item-subtotal").textContent = money(state.cart.total);
  get("sanity-checkout-total").textContent = money(state.checkoutTotal);
  return true;
}

function initializeMission() {
  get("sanity-quantity").addEventListener("change", () => {
    if (currentId() !== "open" || state.actions.has("open")) return;
    const quantity = Number(get("sanity-quantity").value);
    if ([1, 2, 3].includes(quantity)) get("sanity-cart-total").textContent = money(quantity * UNIT_PRICE_CENTS);
  });

  get("open-sanity-checkout").addEventListener("click", () => {
    if (state.finished || !ensureAccess() || currentId() !== "open" || state.actions.has("open")) return;
    if (populateCheckout()) markAction("open");
  });

  fieldsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (state.finished || !ensureAccess() || currentId() !== "fields" || state.actions.has("fields")) return;
    const address = get("sanity-address-input");
    const cep = get("sanity-cep-input");
    const payment = get("sanity-payment-input");
    const validAddress = address.value.trim().length >= 5;
    const validCep = /^\d{5}-?\d{3}$/.test(cep.value.trim());
    const labels = { pix: "Pix de teste", card: "Cartão de teste · final 4242" };
    const validPayment = Object.hasOwn(labels, payment.value);
    address.setAttribute("aria-invalid", String(!validAddress));
    cep.setAttribute("aria-invalid", String(!validCep));
    payment.setAttribute("aria-invalid", String(!validPayment));
    if (!validAddress || !validCep || !validPayment) {
      feedback("sanity-fields-feedback", "Use um endereço fictício com pelo menos 5 caracteres, CEP com 8 dígitos e escolha um pagamento de teste.");
      (!validAddress ? address : !validCep ? cep : payment).focus();
      return;
    }
    state.paymentLabel = labels[payment.value];
    feedback("sanity-fields-feedback", "Dados de teste aceitos. Nenhum pedido ou pagamento foi realizado. O formulário fica somente para consulta após esta verificação.");
    markAction("fields");
  });

  get("compare-sanity-data").addEventListener("click", () => {
    if (state.finished || !ensureAccess() || currentId() !== "consistency" || state.actions.has("consistency")) return;
    const comparison = get("sanity-comparison");
    comparison.replaceChildren();
    for (const [label, total] of [["Carrinho", state.cart.total], ["Checkout", state.checkoutTotal]]) {
      const row = document.createElement("p");
      const title = document.createElement("strong");
      title.textContent = label + ": ";
      row.append(title, document.createTextNode(state.cart.quantity + " × Mochila Urbana · " + money(total)));
      comparison.append(row);
    }
    comparison.hidden = false;
    markAction("consistency");
  });

  get("open-empty-sanity-checkout").addEventListener("click", () => {
    if (state.finished || !ensureAccess() || currentId() !== "empty" || state.actions.has("empty")) return;
    get("sanity-empty-guard").hidden = false;
    get("open-empty-sanity-checkout").disabled = true;
    markAction("empty");
  });

  classificationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const id = currentId();
    if (state.finished || !ensureAccess() || !state.actions.has(id) || state.records.has(id)) return;
    const answer = event.submitter?.value;
    if (!["pass", "fail"].includes(answer)) return;
    state.classificationAttempts[id] = (state.classificationAttempts[id] || 0) + 1;
    const check = checkFor(id);
    if (answer !== check.outcome) {
      feedback("sanity-classification-feedback", "Compare novamente. Esperado: " + check.expected +
        " Observado: " + check.observed + " Corrigir esta resposta valerá 5 XP.");
      return;
    }
    state.records.set(id, { points: state.classificationAttempts[id] === 1 ? 10 : 5 });
    renderStep(false);
    get("next-sanity-check").focus();
  });

  get("next-sanity-check").addEventListener("click", () => {
    if (state.finished || !ensureAccess() || !state.records.has(currentId())) return;
    if (state.step < STEP_IDS.length - 1) {
      state.step += 1;
      renderStep();
    } else {
      reviewForm.querySelector("input").focus();
    }
  });

  reviewForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (state.finished || !ensureAccess() || state.records.size !== STEP_IDS.length) return;
    const data = new FormData(reviewForm);
    const decision = data.get("decision");
    const reason = data.get("reason");
    if (!decision || !reason) {
      feedback("sanity-review-feedback", "Selecione o parecer e a evidência que o fundamenta.");
      return;
    }
    state.decisionAttempts += 1;
    state.reasonAttempts += 1;
    const correctDecision = decision === "return";
    const correctReason = reason === "total";
    if (correctDecision && !state.decisionPoints) state.decisionPoints = state.decisionAttempts === 1 ? 10 : 5;
    if (correctReason && !state.reasonPoints) state.reasonPoints = state.reasonAttempts === 1 ? 10 : 5;
    get("header-xp").textContent = String(score());
    if (!correctDecision || !correctReason) {
      const messages = [];
      if (!correctDecision) messages.push("Devolva a BZ-2026.10.1 para ajuste. O 503 foi corrigido, mas a candidata cobra R$ 15,00 indevidos no Checkout.");
      if (!correctReason) messages.push("O 503 não se reproduziu: o Checkout respondeu 200. A evidência que impede aceitar a candidata é o total divergente. Sanidade cobre a correção e seu entorno; não exige executar toda a regressão nesta missão.");
      messages.push("Revise o parecer. Cada resposta incorreta valerá 5 XP quando corrigida.");
      feedback("sanity-review-feedback", messages.join(" "));
      return;
    }
    let saved;
    try {
      saved = progress.saveMissionResult("sanity", score());
    } catch {
      feedback("sanity-review-feedback", "Não foi possível concluir. Confirme que a Fase 4 está concluída e tente novamente.");
      return;
    }
    state.finished = true;
    get("sanity-workspace").hidden = true;
    get("sanity-result").hidden = false;
    get("sanity-result-xp").textContent = score() + " XP";
    get("sanity-result-summary").textContent = "Missão concluída pelo parecer correto; candidata devolvida para ajuste. Melhor resultado: " +
      saved.bestXp + " XP · Tentativas concluídas: " + saved.attempts + " · XP compartilhado: " + saved.totalXp + ".";
    get("sanity-result-evidence").replaceChildren(...STEP_IDS.map(makeEvidence));
    saveStatus.show(saved);
    get("sanity-result-title").focus();
  });

  get("restart-sanity").addEventListener("click", () => {
    if (!ensureAccess()) return;
    state = initialState();
    fieldsForm.reset();
    reviewForm.reset();
    get("sanity-quantity").value = "1";
    get("sanity-cart-total").textContent = money(UNIT_PRICE_CENTS);
    fieldsForm.querySelectorAll("[aria-invalid]").forEach((field) => field.removeAttribute("aria-invalid"));
    feedback("sanity-fields-feedback", "");
    feedback("sanity-review-feedback", "");
    get("sanity-comparison").hidden = true;
    get("sanity-comparison").replaceChildren();
    get("sanity-empty-guard").hidden = true;
    get("open-empty-sanity-checkout").disabled = false;
    get("sanity-result").hidden = true;
    get("sanity-workspace").hidden = false;
    get("sanity-result-evidence").replaceChildren();
    get("sanity-result").querySelector("details").open = false;
    saveStatus.reset();
    renderStep();
  });

  renderStep(false);
}

if (ensureAccess()) initializeMission();
