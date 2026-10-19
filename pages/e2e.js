// Guided E2E mission. Only the three documented inconsistencies are intentional.
const UNIT_PRICE_CENTS = 18990;
const STEP_IDS = ["catalog", "cart", "delivery", "payment", "order", "post"];
const CHECK_IDS = ["discount", "payment", "confirmation"];
const progress = window.QAQuestProgress;
const views = [...document.querySelectorAll("[data-e2e-view]")];
const workspace = document.querySelector("#e2e-workspace");
const result = document.querySelector("#e2e-result");
const review = document.querySelector("#e2e-review");
const checkForm = document.querySelector("#checkpoint-check");
const saveStatus = document.querySelector("qa-save-status");

function initialState() {
  return {
    currentView: "catalog", quantity: 1, couponApplied: false,
    cartSnapshot: null, checkoutTotal: null, delivery: null, order: null,
    checkpoints: new Set(), findings: new Map(),
    comparisonAttempts: {}, comparisonPoints: {}, reviewAttempts: 0,
    reviewPoints: 0, finished: false
  };
}
let state = initialState();

function money(cents) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function score() {
  return state.checkpoints.size * 10 +
    Object.values(state.comparisonPoints).reduce((total, points) => total + points, 0) +
    state.reviewPoints;
}

function updateProgress() {
  const count = state.checkpoints.size;
  document.querySelector("#checkpoint-count").textContent = count + " / 6";
  document.querySelector("#checkpoint-bar").style.width = (count / STEP_IDS.length * 100) + "%";
  document.querySelector("#checkpoint-progress").setAttribute("aria-valuenow", String(count));
  document.querySelector("#header-xp").textContent = String(score());
  document.querySelectorAll("[data-step]").forEach((step) => {
    const id = step.dataset.step;
    step.classList.toggle("is-complete", state.checkpoints.has(id));
    step.classList.toggle("is-current", state.currentView === id);
    if (state.currentView === id) step.setAttribute("aria-current", "step");
    else step.removeAttribute("aria-current");
  });
}

function completeCheckpoint(id) {
  state.checkpoints.add(id);
  updateProgress();
}

function comparisonId() {
  return { delivery: "discount", order: "payment", post: "confirmation" }[state.currentView];
}

function findingFor(id) {
  if (id === "discount") return {
    title: "O desconto se perde no checkout",
    question: "Compare o total confirmado no carrinho com o total no checkout. Os valores são consistentes?",
    expected: "Manter " + money(state.cartSnapshot.total) + " com o cupom BAZAR10 e frete grátis.",
    observed: "O checkout mostra " + money(state.checkoutTotal) + ", sem o desconto.",
    impact: "O cliente pode pagar mais do que o valor que confirmou no carrinho."
  };
  if (id === "payment") return {
    title: "Pagamento aprovado mantém pedido pendente",
    question: "Compare a aprovação do pagamento com o status do pedido. Os estados são consistentes?",
    expected: "Pagamento por " + state.order.methodLabel + " aprovado deve atualizar o pedido para pago.",
    observed: "O pagamento foi aprovado, mas o pedido permanece como Aguardando pagamento.",
    impact: "A divergência pode atrasar o processamento do pedido e provocar novas tentativas de pagamento."
  };
  return {
    title: "E-mail mostra total diferente do pedido",
    question: "Compare o valor do pedido com a confirmação por e-mail. Os dados são consistentes?",
    expected: "Informar " + money(state.order.total) + ", o mesmo valor registrado no pedido.",
    observed: "O e-mail mostra " + money(state.order.total + 1800) + ", com R$ 18,00 indevidos.",
    impact: "O cliente recebe uma confirmação financeira incorreta e pode precisar acionar o suporte."
  };
}

function renderComparison() {
  const id = comparisonId();
  checkForm.hidden = !id;
  if (!id) return;
  document.querySelector("#comparison-question").textContent = findingFor(id).question;
  checkForm.querySelectorAll("button").forEach((button) => { button.disabled = state.findings.has(id); });
  const feedback = document.querySelector("#comparison-feedback");
  feedback.hidden = !state.findings.has(id);
  feedback.textContent = state.findings.has(id) ? "Comparação registrada. Continue a jornada na loja." : "";
}

function setView(view, focus = true) {
  state.currentView = view;
  views.forEach((element) => { element.hidden = element.dataset.e2eView !== view; });
  const paths = { catalog: "catalog", cart: "cart", delivery: "checkout", payment: "payment", order: "orders/BZ-314", post: "confirmation/BZ-314" };
  document.querySelector("#e2e-address").textContent = "bazaraza.test/" + paths[view];
  const instructions = {
    catalog: "Escolha a Mochila Urbana para iniciar um único pedido.",
    cart: "Escolha de 1 a 3 unidades, aplique BAZAR10 e confira o total.",
    delivery: "Compare os totais no checkpoint abaixo e informe uma entrega fictícia.",
    payment: "Confira os dados da entrega e escolha Pix ou cartão de teste.",
    order: "Compare o pagamento aprovado com o status registrado no pedido.",
    post: "Compare o valor do pedido com o e-mail e revise as evidências."
  };
  document.querySelector("#checkpoint-instruction").textContent = instructions[view];
  renderComparison();
  updateProgress();
  if (focus) document.querySelector('[data-e2e-view="' + view + '"] h2').focus();
}

function renderCart() {
  const subtotal = UNIT_PRICE_CENTS * state.quantity;
  const total = state.couponApplied ? Math.round(subtotal * 0.9) : subtotal;
  document.querySelector("#cart-subtotal").textContent = money(subtotal);
  document.querySelector("#cart-summary-total").textContent = money(total);
}

function renderDetails(selector, data) {
  const details = document.querySelector(selector);
  const rows = [
    ["Produto", "Mochila Urbana × " + data.quantity],
    ["Cupom", "BAZAR10 · 10%"],
    ["Entrega", data.delivery.address],
    ["CEP", data.delivery.cep]
  ];
  if (data.methodLabel) rows.push(["Pagamento", data.methodLabel]);
  details.replaceChildren(...rows.map(([label, value]) => {
    const row = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value;
    row.append(term, description);
    return row;
  }));
}

function addFinding(id) {
  const finding = findingFor(id);
  state.findings.set(id, finding);
  const list = document.querySelector("#finding-list");
  list.querySelector(".finding-list__empty")?.remove();
  const item = document.createElement("article");
  item.className = "finding-item";
  item.dataset.finding = id;
  const icon = document.createElement("span");
  icon.textContent = "!";
  icon.setAttribute("aria-hidden", "true");
  const copy = document.createElement("div");
  const heading = document.createElement("strong");
  heading.textContent = finding.title;
  copy.append(heading);
  [["Esperado", finding.expected], ["Obtido", finding.observed], ["Impacto", finding.impact]].forEach(([label, text]) => {
    const paragraph = document.createElement("p");
    const prefix = document.createElement("b");
    prefix.textContent = label + ": ";
    paragraph.append(prefix, document.createTextNode(text));
    copy.append(paragraph);
  });
  item.append(icon, copy);
  list.append(item);
}

function showLocked() {
  document.querySelector("#e2e-content").hidden = true;
  document.querySelector("#e2e-locked").hidden = false;
  const link = document.querySelector("#e2e-locked-link");
  if (progress.isPhaseUnlocked(4)) {
    link.href = "phase4.html";
    link.textContent = "Continuar Fase 4";
  } else {
    link.href = "index.html";
    link.textContent = "Voltar à jornada";
  }
}

function resetMission(focus = true) {
  state = initialState();
  document.querySelector("#e2e-content").hidden = false;
  document.querySelector("#e2e-locked").hidden = true;
  document.querySelector("#e2e-quantity").value = "1";
  document.querySelector("#e2e-coupon").value = "";
  document.querySelector("#coupon-feedback").textContent = "";
  ["delivery-address", "delivery-cep"].forEach((id) => {
    const input = document.getElementById(id);
    input.value = "";
    input.removeAttribute("aria-invalid");
  });
  document.querySelector("#delivery-message").textContent = "";
  document.querySelector('input[name="payment"][value="pix"]').checked = true;
  document.querySelector("#order-chip").textContent = "Pedido em andamento";
  document.querySelector("#finding-list").replaceChildren(Object.assign(document.createElement("p"), {
    className: "finding-list__empty",
    textContent: "Registre as comparações para formar suas evidências."
  }));
  document.querySelector("#e2e-review-options").replaceChildren();
  document.querySelector("#e2e-review-error").hidden = true;
  review.hidden = true;
  workspace.hidden = false;
  result.hidden = true;
  saveStatus.reset();
  renderCart();
  setView("catalog", focus);
}

function requireComparison(message) {
  const id = comparisonId();
  if (!id || state.findings.has(id)) return true;
  const feedback = document.querySelector("#comparison-feedback");
  feedback.textContent = message;
  feedback.hidden = false;
  checkForm.querySelector("button").focus();
  return false;
}

function openReview() {
  if (state.currentView !== "post" || state.finished ||
      state.checkpoints.size !== STEP_IDS.length || state.findings.size !== CHECK_IDS.length) {
    requireComparison("Registre a comparação do e-mail antes da revisão final.");
    return;
  }
  if (!review.hidden) return;
  const choices = CHECK_IDS.map((id) => ({ id, title: state.findings.get(id).title }));
  choices.push({ id: "consistent-data", title: "Quantidade, endereço e meio de pagamento foram mantidos corretamente." });
  document.querySelector("#e2e-review-options").replaceChildren(...choices.map((choice) => {
    const label = document.createElement("label");
    label.className = "e2e-review-option";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = "finding";
    input.value = choice.id;
    const text = document.createElement("span");
    text.textContent = choice.title;
    label.append(input, text);
    return label;
  }));
  review.hidden = false;
  review.querySelector("input").focus();
}

function bindMission() {
  document.querySelector("#add-e2e-product").addEventListener("click", () => {
    if (state.currentView !== "catalog") return;
    completeCheckpoint("catalog");
    setView("cart");
  });

  document.querySelector("#e2e-quantity").addEventListener("change", (event) => {
    if (state.currentView !== "cart") return;
    state.quantity = Math.min(3, Math.max(1, Number(event.target.value) || 1));
    renderCart();
  });

  document.querySelector("#apply-e2e-coupon").addEventListener("click", () => {
    if (state.currentView !== "cart") return;
    const coupon = document.querySelector("#e2e-coupon").value.trim().toUpperCase();
    const feedback = document.querySelector("#coupon-feedback");
    if (coupon !== "BAZAR10") {
      feedback.textContent = state.couponApplied ? "Cupom não encontrado. BAZAR10 continua aplicado." : "Use o cupom do roteiro: BAZAR10.";
      return;
    }
    state.couponApplied = true;
    renderCart();
    feedback.textContent = "BAZAR10 aplicado. Frete grátis e 10% de desconto confirmados.";
  });

  document.querySelector("#to-delivery").addEventListener("click", () => {
    if (state.currentView !== "cart") return;
    if (!state.couponApplied) {
      document.querySelector("#coupon-feedback").textContent = "Aplique BAZAR10 para comparar o desconto entre as etapas.";
      return;
    }
    const subtotal = UNIT_PRICE_CENTS * state.quantity;
    state.cartSnapshot = Object.freeze({ quantity: state.quantity, total: Math.round(subtotal * 0.9) });
    // Intentional defect: checkout integration drops the discount.
    state.checkoutTotal = subtotal;
    document.querySelector("#cart-reference-total").textContent = money(state.cartSnapshot.total);
    document.querySelector("#checkout-summary-total").textContent = money(state.checkoutTotal);
    completeCheckpoint("cart");
    setView("delivery");
  });

  checkForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const id = comparisonId();
    if (!id || state.findings.has(id) || state.finished) return;
    state.comparisonAttempts[id] = (state.comparisonAttempts[id] || 0) + 1;
    const feedback = document.querySelector("#comparison-feedback");
    feedback.hidden = false;
    if (event.submitter?.value !== "divergent") {
      feedback.textContent = "Compare novamente: " + findingFor(id).expected + " " + findingFor(id).observed;
      return;
    }
    state.comparisonPoints[id] = state.comparisonAttempts[id] === 1 ? 10 : 5;
    addFinding(id);
    checkForm.querySelectorAll("button").forEach((button) => { button.disabled = true; });
    feedback.textContent = "Evidência registrada. +" + state.comparisonPoints[id] + " XP pela comparação.";
    if (id === "payment") completeCheckpoint("order");
    if (id === "confirmation") completeCheckpoint("post");
    updateProgress();
  });

  document.querySelector("#to-payment").addEventListener("click", () => {
    if (state.currentView !== "delivery") return;
    const addressInput = document.querySelector("#delivery-address");
    const cepInput = document.querySelector("#delivery-cep");
    const address = addressInput.value.trim();
    const cep = cepInput.value.trim();
    const addressValid = address.length >= 5;
    const cepValid = /^\d{5}-?\d{3}$/.test(cep);
    addressInput.setAttribute("aria-invalid", String(!addressValid));
    cepInput.setAttribute("aria-invalid", String(!cepValid));
    if (!addressValid || !cepValid) {
      document.querySelector("#delivery-message").textContent = "Informe um endereço fictício e um CEP com oito dígitos, como 01001-000.";
      (!addressValid ? addressInput : cepInput).focus();
      return;
    }
    if (!requireComparison("Registre a comparação do desconto antes de continuar.")) return;
    state.delivery = Object.freeze({ address, cep });
    renderDetails("#payment-details", { quantity: state.cartSnapshot.quantity, delivery: state.delivery });
    document.querySelector("#payment-summary-total").textContent = money(state.checkoutTotal);
    completeCheckpoint("delivery");
    setView("payment");
  });

  document.querySelector("#approve-payment").addEventListener("click", () => {
    if (state.currentView !== "payment" || !state.delivery || state.order) return;
    const method = document.querySelector('input[name="payment"]:checked').value;
    state.order = Object.freeze({
      id: "BZ-314", quantity: state.cartSnapshot.quantity, delivery: state.delivery,
      total: state.checkoutTotal, method, methodLabel: method === "pix" ? "Pix simulado" : "Cartão de teste · final 4242",
      paymentStatus: "Aprovado",
      // Intentional defect: order status is not synchronized with payment.
      status: "Aguardando pagamento"
    });
    document.querySelector("#payment-status").textContent = state.order.status;
    document.querySelector("#payment-result").textContent = state.order.methodLabel + " · pagamento " + state.order.paymentStatus.toLowerCase() + ".";
    document.querySelector("#order-summary-total").textContent = money(state.order.total);
    document.querySelector("#order-chip").textContent = "Pedido #" + state.order.id;
    renderDetails("#order-details", state.order);
    completeCheckpoint("payment");
    setView("order");
  });

  document.querySelector("#to-post-purchase").addEventListener("click", () => {
    if (state.currentView !== "order" || !state.order) return;
    if (!requireComparison("Compare a aprovação do pagamento com o status do pedido.")) return;
    renderDetails("#email-details", state.order);
    document.querySelector("#order-reference-total").textContent = money(state.order.total);
    // Intentional defect: the email integration adds an uncontracted fee.
    document.querySelector("#email-summary-total").textContent = money(state.order.total + 1800);
    setView("post");
  });

  document.querySelector("#open-e2e-review").addEventListener("click", openReview);
  review.addEventListener("submit", (event) => {
    event.preventDefault();
    if (state.finished || review.hidden || state.checkpoints.size !== STEP_IDS.length || state.findings.size !== CHECK_IDS.length) return;
    if (!progress.isTracksUnlocked()) { showLocked(); return; }
    const selected = [...review.querySelectorAll("input:checked")].map((input) => input.value);
    const correct = selected.length === CHECK_IDS.length && CHECK_IDS.every((id) => selected.includes(id));
    const error = document.querySelector("#e2e-review-error");
    if (!correct) {
      state.reviewAttempts += 1;
      error.hidden = false;
      error.textContent = "Reporte as três divergências. Quantidade, endereço e forma de pagamento foram preservados e não são defeitos.";
      return;
    }
    state.reviewPoints = state.reviewAttempts === 0 ? 10 : 5;
    const earnedXp = score();
    const saved = progress.saveMissionResult("e2e", earnedXp);
    state.finished = true;
    workspace.hidden = true;
    result.hidden = false;
    document.querySelector("#e2e-result-xp").textContent = String(earnedXp);
    document.querySelector("#e2e-result-checkpoints").textContent = state.checkpoints.size + " / 6";
    document.querySelector("#e2e-result-findings").textContent = state.findings.size + " / 3";
    document.querySelector("#e2e-result-summary").textContent = "Você verificou o mesmo pedido entre catálogo, carrinho, entrega, pagamento e confirmação. O E2E revela falhas na passagem de dados entre etapas, complementando a validação funcional do login e a exploração livre.";
    updateProgress();
    saveStatus.show(saved);
    document.querySelector("#e2e-result-title").focus();
  });
  document.querySelector("#restart-e2e").addEventListener("click", () => {
    if (!progress.isTracksUnlocked()) { showLocked(); return; }
    resetMission();
  });
}

if (progress.isTracksUnlocked()) {
  bindMission();
  resetMission(false);
} else {
  showLocked();
}
