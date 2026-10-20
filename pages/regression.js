// Local regression suite: BZ-2026.09 baseline vs BZ-2026.10.2 candidate.
// The category filter is the only intentional defect. Prices use integer cents.
const UNIT_PRICE_CENTS = 18990;
const PRODUCTS = Object.freeze([
  { name: "Mochila Urbana", category: "accessories", label: "Acessórios", price: UNIT_PRICE_CENTS },
  { name: "Mochila Notebook", category: "technology", label: "Tecnologia", price: 24990 }
]);
const CASES = ["login", "catalog", "cart", "checkout", "history"];
const LABELS = ["Login e painel", "Busca e filtro", "Carrinho", "Checkout corrigido", "Histórico do pedido"];
const progress = window.QAQuestProgress;
const get = id => document.getElementById(id);
const classification = get("regression-classification");
const review = get("regression-review");
const saveStatus = document.querySelector("qa-save-status");

function initialState() {
  return {
    step: 0, actions: new Set(), records: new Map(), mistakes: new Set(),
    reviewMistakes: new Set(), reviewPoints: { decision: 0, reason: 0 },
    searched: false, filter: null, cartAdded: false, cart: null,
    payment: null, order: null, finished: false
  };
}
let state = initialState();
const currentId = () => CASES[state.step];
const money = cents => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const score = () => state.actions.size * 8 +
  [...state.records.values()].reduce((sum, record) => sum + record.points, 0) +
  state.reviewPoints.decision + state.reviewPoints.reason;

function feedback(id, message) {
  get(id).textContent = message;
  get(id).hidden = !message;
}

function ensureAccess() {
  const unlocked = progress.isTracksUnlocked();
  get("regression-locked").hidden = unlocked;
  get("regression-content").hidden = !unlocked;
  if (!unlocked) {
    const link = get("regression-locked-link");
    link.href = progress.isPhaseUnlocked(4) ? "phase4.html" : "index.html";
    link.textContent = progress.isPhaseUnlocked(4) ? "Continuar Fase 4" : "Voltar à jornada";
  }
  return unlocked;
}

function canAct(id) {
  return ensureAccess() && !state.finished && currentId() === id && !state.actions.has(id);
}

function checkFor(id) {
  const base = { title: LABELS[CASES.indexOf(id)], outcome: "pass" };
  const cartCopy = state.cart
    ? state.cart.quantity + " × Mochila Urbana · " + money(state.cart.total)
    : "Mochila Urbana com quantidade e total coerentes";
  if (id === "login") return {
    ...base, path: "login", instruction: "Use a conta fictícia fornecida para entrar e verificar o painel.",
    baseline: "A conta de teste entrava e o painel era exibido com acesso autorizado.",
    action: "Entrar com qa@bazaraza.test e abrir o painel.",
    expected: "Acesso autorizado e painel da Pessoa de teste carregado.",
    observed: "Acesso autorizado. O painel da Pessoa de teste carregou com pedidos e endereços.",
    impact: "O acesso à conta continua disponível nesta candidata."
  };
  if (id === "catalog") {
    const category = state.filter === "technology" ? "Tecnologia" : "Acessórios";
    const product = state.filter === "technology" ? "Mochila Notebook" : "Mochila Urbana";
    return {
      ...base, outcome: "fail", path: "catalog",
      instruction: "Busque Mochila, selecione Acessórios ou Tecnologia e confira se a lista respeita a categoria.",
      baseline: "A busca Mochila retornava dois produtos. Acessórios deixava apenas Mochila Urbana; Tecnologia, apenas Mochila Notebook.",
      action: "Buscar Mochila e aplicar a categoria " + category + ".",
      expected: state.filter ? "O filtro " + category + " deve deixar somente " + product + " (1 resultado)." : "Buscar Mochila retorna dois produtos; selecionar uma categoria deve deixar somente os produtos correspondentes.",
      observed: "A busca encontrou as duas mochilas. O filtro mostra " + category + " selecionado, mas a lista mantém Mochila Urbana (Acessórios) e Mochila Notebook (Tecnologia): 2 resultados.",
      impact: "A busca funciona, mas o filtro deixou de restringir os produtos. O cliente recebe itens fora da categoria. A candidata exige investigação ou ajuste."
    };
  }
  if (id === "cart") return {
    ...base, path: "cart", instruction: "Adicione a Mochila Urbana, altere para 2 ou 3 unidades e confira o total.",
    baseline: "Adicionar uma Mochila Urbana e alterar para 2 unidades atualizava o total para R$ 379,80; 3 unidades totalizavam R$ 569,70.",
    action: "Adicionar Mochila Urbana e alterar a quantidade para " + (state.cart?.quantity || "2 ou 3") + ".",
    expected: "Quantidade selecionada × R$ 189,90, sem taxas adicionais.",
    observed: cartCopy + ". O total corresponde ao preço unitário multiplicado pela quantidade.",
    impact: "O cliente continua conseguindo adicionar o produto e atualizar o carrinho com o valor correto."
  };
  if (id === "checkout") return {
    ...base, path: "checkout", instruction: "Use dados fictícios, escolha o pagamento e compare o total com o carrinho de referência.",
    baseline: "O Checkout carregava entrega e pagamento e preservava item, quantidade e total do carrinho, com frete grátis.",
    action: "Abrir o Checkout preparado, preencher entrega e escolher " + (state.payment || "um pagamento de teste") + ".",
    expected: "HTTP 200, campos utilizáveis e o mesmo item, quantidade e total do carrinho: " + cartCopy + ".",
    observed: "HTTP 200. Entrega aceita e pagamento selecionado: " + (state.payment || "não informado") + ". Checkout: " + cartCopy + ". Taxas: R$ 0,00. O 503 e os R$ 15,00 indevidos não se reproduziram.",
    impact: "Os defeitos anteriores do Checkout estão corrigidos nos dados testados. Isso não elimina a falha de regressão no catálogo."
  };
  return {
    ...base, path: "orders", instruction: "Crie um pedido apenas no simulador e compare a confirmação com o histórico.",
    baseline: "O pedido de teste aparecia no histórico com o mesmo identificador, itens, quantidade e total da confirmação.",
    action: "Criar o pedido local BZ-REG-1042 e comparar confirmação e histórico.",
    expected: "Mesmo pedido BZ-REG-1042, mesmo item e quantidade e mesmo total nas duas telas.",
    observed: "Confirmação e histórico mostram BZ-REG-1042 · " + cartCopy + " · " + (state.payment || "Pagamento de teste") + ". Dados coincidem; nenhum pedido ou pagamento real foi realizado.",
    impact: "O cliente continua conseguindo consultar os dados coerentes de seu pedido. Este caso usa um pedido isolado de teste."
  };
}

function makeEvidence(id) {
  const check = checkFor(id);
  const item = document.createElement("details");
  item.className = "regression-evidence-item";
  item.dataset.outcome = check.outcome;
  const summary = document.createElement("summary");
  summary.textContent = check.title + " · " + (check.outcome === "pass" ? "Passou" : "Falhou");
  item.append(summary);
  for (const [label, text] of [
    ["Antes · BZ-2026.09", check.baseline], ["Ação", check.action],
    ["Esperado", check.expected], ["Observado", check.observed], ["Impacto", check.impact]
  ]) {
    const paragraph = document.createElement("p"), strong = document.createElement("b");
    strong.textContent = label + ": ";
    paragraph.append(strong, document.createTextNode(text));
    item.append(paragraph);
  }
  return item;
}

function renderProgress() {
  const count = state.records.size;
  get("header-xp").textContent = String(score());
  get("regression-count").textContent = count + " / 5";
  get("regression-progress").setAttribute("aria-valuenow", String(count));
  get("regression-bar").style.width = count * 20 + "%";
  get("regression-steps").replaceChildren(...CASES.map((id, index) => {
    const item = document.createElement("li"), number = document.createElement("span");
    number.textContent = String(index + 1).padStart(2, "0");
    const copy = document.createElement("div"), title = document.createElement("strong"), small = document.createElement("small");
    title.textContent = LABELS[index];
    small.textContent = state.records.has(id) ? (id === "catalog" ? "Falhou · filtro" : "Passou") :
      state.actions.has(id) ? "Classifique a evidência" : index === state.step ? "Em execução" : "Próximo caso";
    if (index === state.step) item.setAttribute("aria-current", "step");
    if (state.records.has(id)) item.dataset.outcome = checkFor(id).outcome;
    copy.append(title, small); item.append(number, copy); return item;
  }));
  const status = get("regression-candidate-status");
  status.dataset.failed = String(state.records.has("catalog"));
  status.textContent = state.records.has("catalog")
    ? "BZ-2026.10.2 · Regressão no filtro registrada. Continue os casos isolados para mapear o impacto; a candidata permanece sem aprovação."
    : "BZ-2026.10.2 · " + count + " de 5 casos registrados. Parecer pendente.";
  if (count) get("regression-evidence").replaceChildren(...CASES.filter(id => state.records.has(id)).map(makeEvidence));
  else {
    const empty = document.createElement("p");
    empty.className = "regression-tip"; empty.textContent = "Suas evidências aparecerão aqui com antes, esperado, observado e impacto.";
    get("regression-evidence").replaceChildren(empty);
  }
  review.hidden = count !== CASES.length;
  get("regression-review-hint").hidden = count === CASES.length;
}

function renderStep(focus = true) {
  const id = currentId(), check = checkFor(id), recorded = state.records.has(id), done = state.actions.has(id);
  document.querySelectorAll("[data-regression-view]").forEach(section => { section.hidden = section.dataset.regressionView !== id; });
  get("regression-address").textContent = "bazaraza.test/" + check.path;
  get("regression-case-id").textContent = "CASO REG-0" + (state.step + 1) + " · REPETIR E COMPARAR";
  get("regression-check-title").textContent = check.title;
  get("regression-instruction").textContent = check.instruction;
  get("regression-baseline").textContent = check.baseline;
  get("regression-expected").textContent = check.expected;
  get("regression-observation").hidden = !done;
  get("regression-observed").textContent = done ? check.observed : "";
  classification.hidden = !done;
  classification.querySelectorAll("button").forEach(button => { button.disabled = recorded; });
  feedback("regression-classification-feedback", recorded ? "Evidência registrada. " + check.impact + " +" + state.records.get(id).points + " XP pela classificação." : "");
  get("next-regression-check").hidden = !recorded;
  get("next-regression-check").textContent = state.step === CASES.length - 1 ? "Emitir parecer →" : "Próximo caso →";
  if (id === "checkout" && state.cart) {
    get("regression-checkout-reference").textContent = state.cart.quantity + " × Mochila Urbana · " + money(state.cart.total);
    get("regression-checkout-total").textContent = money(state.cart.total);
  }
  renderProgress();
  if (focus) get("regression-check-title").focus();
}

function markAction(id) {
  if (!canAct(id)) return;
  state.actions.add(id);
  document.querySelector('[data-regression-view="' + id + '"]').querySelectorAll("input, select, button").forEach(control => { control.disabled = true; });
  renderStep(false);
  classification.querySelector("button").focus();
}

function initializeMission() {
  get("regression-login-form").addEventListener("submit", event => {
    event.preventDefault();
    if (!canAct("login")) return;
    if (get("regression-email").value.trim().toLowerCase() !== "qa@bazaraza.test" || get("regression-password").value !== "Bazaraza123!") {
      feedback("regression-login-feedback", "Use apenas a conta de teste fornecida: qa@bazaraza.test · Bazaraza123!.");
      return;
    }
    get("regression-dashboard").hidden = false;
    get("regression-login-form").hidden = true;
    markAction("login");
  });

  get("regression-search-form").addEventListener("submit", event => {
    event.preventDefault();
    if (!canAct("catalog")) return;
    if (get("regression-search").value.trim().toLowerCase() !== "mochila") {
      feedback("regression-search-feedback", "Este caso conhecido usa a busca Mochila. Repita os mesmos dados da referência para comparar.");
      return;
    }
    state.searched = true;
    get("regression-search-results").hidden = false;
    get("regression-search").readOnly = true;
    get("regression-search-form").querySelector("button").disabled = true;
    feedback("regression-search-feedback", "Busca concluída: 2 mochilas. Selecione Acessórios ou Tecnologia para verificar o filtro.");
    get("regression-products").replaceChildren(...PRODUCTS.map(product => {
      const item = document.createElement("li"), title = document.createElement("strong"), detail = document.createElement("span");
      title.textContent = product.name; detail.textContent = product.label + " · " + money(product.price);
      item.append(title, detail); return item;
    }));
  });
  get("regression-filter").addEventListener("change", () => {
    if (!canAct("catalog") || !state.searched) return;
    const filter = get("regression-filter").value;
    state.filter = ["accessories", "technology"].includes(filter) ? filter : null;
    get("regression-expected").textContent = checkFor("catalog").expected;
    // Intentional regression: selected category changes, product results stay unfiltered.
    get("regression-filter-status").textContent = "Categoria: " + get("regression-filter").selectedOptions[0].textContent + " · 2 resultados";
  });
  get("check-regression-filter").addEventListener("click", () => {
    if (!canAct("catalog") || !state.searched) return;
    const filter = get("regression-filter").value;
    if (!["accessories", "technology"].includes(filter)) {
      feedback("regression-search-feedback", "Escolha Acessórios ou Tecnologia antes de conferir o resultado.");
      return;
    }
    state.filter = filter; markAction("catalog");
  });

  get("add-regression-product").addEventListener("click", () => {
    if (!canAct("cart") || state.cartAdded) return;
    state.cartAdded = true;
    get("add-regression-product").disabled = true;
    get("regression-cart-empty").hidden = true;
    get("regression-cart-item").hidden = false;
    get("regression-quantity").focus();
  });
  get("regression-quantity").addEventListener("change", () => {
    if (!canAct("cart") || !state.cartAdded) return;
    const quantity = Number(get("regression-quantity").value);
    if ([1, 2, 3].includes(quantity)) get("regression-cart-total").textContent = money(quantity * UNIT_PRICE_CENTS);
  });
  get("check-regression-cart").addEventListener("click", () => {
    if (!canAct("cart") || !state.cartAdded) return;
    const quantity = Number(get("regression-quantity").value);
    if (![2, 3].includes(quantity)) {
      feedback("regression-cart-feedback", "Altere para 2 ou 3 unidades para verificar também a atualização do total.");
      return;
    }
    state.cart = Object.freeze({ quantity, total: quantity * UNIT_PRICE_CENTS });
    feedback("regression-cart-feedback", "Quantidade e total atualizados: " + quantity + " unidade(s) · " + money(state.cart.total) + ".");
    markAction("cart");
  });

  get("regression-checkout-form").addEventListener("submit", event => {
    event.preventDefault();
    if (!canAct("checkout") || !state.cart) return;
    const address = get("regression-address-input"), cep = get("regression-cep"), payment = get("regression-payment");
    const payments = { pix: "Pix de teste", card: "Cartão de teste · final 4242" };
    const valid = [address.value.trim().length >= 5, /^\d{5}-?\d{3}$/.test(cep.value.trim()), Object.hasOwn(payments, payment.value)];
    [address, cep, payment].forEach((field, index) => field.setAttribute("aria-invalid", String(!valid[index])));
    if (valid.includes(false)) {
      feedback("regression-checkout-feedback", "Use endereço fictício com pelo menos 5 caracteres, CEP com 8 dígitos e um pagamento simulado.");
      [address, cep, payment][valid.indexOf(false)].focus(); return;
    }
    state.payment = payments[payment.value];
    feedback("regression-checkout-feedback", "Campos aceitos e total preservado. Nenhum pagamento foi processado.");
    markAction("checkout");
  });

  get("create-regression-order").addEventListener("click", () => {
    if (!canAct("history") || !state.cart || state.order) return;
    state.order = Object.freeze({ id: "BZ-REG-1042", ...state.cart, payment: state.payment });
    const copy = state.order.quantity + " × Mochila Urbana · " + money(state.order.total) + " · " + state.order.payment;
    get("regression-confirmation").textContent = copy;
    get("regression-history").textContent = copy;
    get("regression-order-panels").hidden = false;
    get("create-regression-order").disabled = true;
  });
  get("check-regression-history").addEventListener("click", () => {
    if (canAct("history") && state.order) markAction("history");
  });

  classification.addEventListener("submit", event => {
    event.preventDefault();
    const id = currentId();
    if (!ensureAccess() || state.finished || !state.actions.has(id) || state.records.has(id)) return;
    const answer = event.submitter?.value, check = checkFor(id);
    if (!["pass", "fail"].includes(answer)) return;
    if (answer !== check.outcome) {
      state.mistakes.add(id);
      feedback("regression-classification-feedback", "Compare a referência com o resultado. Esperado: " + check.expected + " Observado: " + check.observed + " A resposta corrigida vale 4 XP.");
      return;
    }
    state.records.set(id, { points: state.mistakes.has(id) ? 4 : 8 });
    renderStep(false); get("next-regression-check").focus();
  });
  get("next-regression-check").addEventListener("click", () => {
    if (!ensureAccess() || state.finished || !state.records.has(currentId())) return;
    if (state.step < CASES.length - 1) { state.step++; renderStep(); }
    else review.querySelector("input").focus();
  });
  review.addEventListener("submit", event => {
    event.preventDefault();
    if (!ensureAccess() || state.finished || state.records.size !== CASES.length) return;
    const data = new FormData(review), decision = data.get("decision"), reason = data.get("reason");
    if (!decision || !reason) { feedback("regression-review-feedback", "Escolha o parecer sobre a candidata e sua evidência."); return; }
    for (const [key, answer, correct] of [["decision", decision, "return"], ["reason", reason, "filter"]]) {
      if (answer !== correct) state.reviewMistakes.add(key);
      else if (!state.reviewPoints[key]) state.reviewPoints[key] = state.reviewMistakes.has(key) ? 5 : 10;
    }
    get("header-xp").textContent = String(score());
    if (decision !== "return" || reason !== "filter") {
      feedback("regression-review-feedback", "Login, Carrinho, Checkout e Histórico passaram; o filtro regrediu. O 503 e os R$ 15,00 estão corrigidos, mas isso não aprova a candidata nesta suíte. Devolva a BZ-2026.10.2 para investigar o filtro antes de nova regressão. Concluir a missão exige esse parecer fundamentado, sem aprovação para produção. Cada resposta incorreta corrigida vale 5 XP.");
      return;
    }
    let saved;
    try { saved = progress.saveMissionResult("regression", score()); }
    catch { feedback("regression-review-feedback", "Não foi possível salvar. Verifique a conclusão da Fase 4 e tente novamente."); return; }
    state.finished = true;
    get("regression-workspace").hidden = true; get("regression-result").hidden = false;
    get("regression-result-xp").textContent = score() + " XP";
    get("regression-result-summary").textContent = "Missão concluída pelo parecer correto; candidata reprovada na regressão do filtro. Melhor resultado: " + saved.bestXp + " XP · Tentativas concluídas: " + saved.attempts + " · XP compartilhado: " + saved.totalXp + ".";
    get("regression-result-evidence").replaceChildren(...CASES.map(makeEvidence));
    saveStatus.show(saved); get("regression-result-title").focus();
  });

  get("restart-regression").addEventListener("click", () => {
    if (!ensureAccess()) return;
    state = initialState();
    document.querySelectorAll(".regression-store form").forEach(form => form.reset());
    review.reset();
    document.querySelectorAll(".regression-store input, .regression-store select, .regression-store button").forEach(control => {
      control.disabled = false; control.removeAttribute("aria-invalid");
      if (control.tagName === "INPUT") control.readOnly = false;
    });
    get("regression-quantity").value = "1"; get("regression-filter").value = "all";
    get("regression-cart-total").textContent = money(UNIT_PRICE_CENTS);
    for (const id of ["regression-dashboard", "regression-search-results", "regression-cart-item", "regression-order-panels"]) get(id).hidden = true;
    get("regression-login-form").hidden = false; get("regression-cart-empty").hidden = false;
    for (const id of ["regression-login-feedback", "regression-search-feedback", "regression-cart-feedback", "regression-checkout-feedback", "regression-review-feedback"]) feedback(id, "");
    get("regression-filter-status").textContent = "Categoria: Todas · 2 resultados";
    get("regression-products").replaceChildren(); get("regression-result-evidence").replaceChildren();
    get("regression-result").querySelector("details").open = false;
    get("regression-result").hidden = true; get("regression-workspace").hidden = false;
    saveStatus.reset(); renderStep();
  });
  renderStep(false);
}
if (ensureAccess()) initializeMission();

