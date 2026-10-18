// Open-ended exploratory testing mission for the fictional Bazaraza store.
const discoveries = {
  stock: {
    title: "Quantidade supera o estoque informado",
    detail: "O carrinho aceita mais de 5 unidades mesmo com o estoque exibido limitado a 5.",
    points: 15
  },
  coupon: {
    title: "Desconto permanece após remover o cupom",
    detail: "O cupom é removido visualmente, mas o total continua com desconto.",
    points: 15
  },
  address: {
    title: "Endereço com caracteres especiais é rejeitado",
    detail: "Um complemento válido com # é tratado como erro, bloqueando a entrega.",
    points: 15
  },
  checkout: {
    title: "Pedido é criado sem dados obrigatórios",
    detail: "A loja confirma a compra sem endereço ou CEP preenchidos.",
    points: 15
  }
};

const state = { quantity: 0, couponApplied: false, discountStuck: false, discovered: new Set() };
const views = [...document.querySelectorAll("[data-shop-view]")];
const headerXp = document.querySelector("#header-xp");
const evidenceList = document.querySelector("#evidence-list");
const evidenceCount = document.querySelector("#evidence-count");
const evidenceProgress = document.querySelector("#evidence-progress");
const evidenceReview = document.querySelector("#evidence-review");
const evidenceOptions = document.querySelector("#evidence-options");
const workspace = document.querySelector("#exploratory-workspace");
const result = document.querySelector("#exploratory-result");
const saveStatus = document.querySelector("qa-save-status");

function formatMoney(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function setView(view) {
  views.forEach((element) => { element.hidden = element.dataset.shopView !== view; });
  document.querySelector("#shop-address").textContent = `bazaraza.test/${view === "catalog" ? "catalog" : view}`;
}

function updateCart() {
  const fullTotal = state.quantity * 189.9;
  const shouldDiscount = state.couponApplied || state.discountStuck;
  const total = shouldDiscount ? fullTotal * 0.9 : fullTotal;
  document.querySelector("#quantity-value").textContent = String(state.quantity);
  document.querySelector("#cart-count").textContent = String(state.quantity);
  document.querySelector("#cart-total").textContent = formatMoney(total);
  const message = document.querySelector("#stock-message");
  message.textContent = state.quantity === 0
    ? "Adicione um item para começar."
    : state.quantity > 5
      ? "Estoque disponível: 5 unidades."
      : `Estoque disponível: ${5 - state.quantity} unidades.`;
}

function discover(id) {
  if (state.discovered.has(id)) return;
  state.discovered.add(id);
  const finding = discoveries[id];
  const item = document.createElement("article");
  item.className = "evidence-item";
  item.dataset.evidence = id;
  item.innerHTML = `<span aria-hidden="true">✓</span><div><strong>${finding.title}</strong><p>${finding.detail}</p></div>`;
  evidenceList.querySelector(".evidence-list__empty")?.remove();
  evidenceList.append(item);
  const count = state.discovered.size;
  evidenceCount.textContent = `${count} / ${Object.keys(discoveries).length}`;
  evidenceProgress.style.width = `${(count / Object.keys(discoveries).length) * 100}%`;
  headerXp.textContent = String(count * 15);
  if (count === Object.keys(discoveries).length) renderReview();
}

function renderReview() {
  evidenceReview.hidden = false;
  evidenceOptions.replaceChildren(...Object.entries(discoveries).map(([id, finding]) => {
    const label = document.createElement("label");
    label.className = "review-option";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = "evidence";
    input.value = id;
    const copy = document.createElement("span");
    copy.textContent = finding.title;
    label.append(input, copy);
    return label;
  }));
  evidenceReview.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function restart() {
  state.quantity = 0;
  state.couponApplied = false;
  state.discountStuck = false;
  state.discovered.clear();
  document.querySelector("#coupon-input").value = "";
  document.querySelector("#coupon-message").textContent = "";
  document.querySelector("#remove-coupon").hidden = true;
  document.querySelector("#address-input").value = "";
  document.querySelector("#cep-input").value = "";
  document.querySelector("#checkout-message").textContent = "";
  evidenceList.replaceChildren(Object.assign(document.createElement("p"), { className: "evidence-list__empty", textContent: "Nenhuma evidência registrada ainda." }));
  evidenceCount.textContent = "0 / 4";
  evidenceProgress.style.width = "0";
  evidenceReview.hidden = true;
  headerXp.textContent = "0";
  updateCart();
  setView("catalog");
  workspace.hidden = false;
  result.hidden = true;
  saveStatus.reset();
}

document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));

document.querySelector("#add-product").addEventListener("click", () => {
  state.quantity += 1;
  updateCart();
  setView("cart");
});

document.querySelector("#increase-quantity").addEventListener("click", () => {
  state.quantity += 1;
  updateCart();
  if (state.quantity > 5) discover("stock");
});

document.querySelector("#decrease-quantity").addEventListener("click", () => {
  state.quantity = Math.max(0, state.quantity - 1);
  updateCart();
});

document.querySelector("#apply-coupon").addEventListener("click", () => {
  const coupon = document.querySelector("#coupon-input").value.trim().toUpperCase();
  const message = document.querySelector("#coupon-message");
  if (coupon === "BAZAR10") {
    state.couponApplied = true;
    message.textContent = "Cupom BAZAR10 aplicado: 10% de desconto.";
    document.querySelector("#remove-coupon").hidden = false;
  } else {
    message.textContent = "Cupom não encontrado.";
  }
  updateCart();
});

document.querySelector("#remove-coupon").addEventListener("click", () => {
  state.couponApplied = false;
  state.discountStuck = true;
  document.querySelector("#coupon-message").textContent = "Cupom removido.";
  document.querySelector("#remove-coupon").hidden = true;
  updateCart();
  discover("coupon");
});

document.querySelector("#address-input").addEventListener("change", (event) => {
  const message = document.querySelector("#checkout-message");
  if (event.target.value.includes("#")) {
    message.textContent = "Endereço inválido. Remova caracteres especiais.";
    discover("address");
  }
});

document.querySelector("#finish-order").addEventListener("click", () => {
  const address = document.querySelector("#address-input").value.trim();
  const cep = document.querySelector("#cep-input").value.trim();
  const message = document.querySelector("#checkout-message");
  if (!address || !cep) {
    message.textContent = "Pedido #BZ-2048 confirmado. Enviaremos novidades por e-mail.";
    discover("checkout");
  } else {
    message.textContent = "Pedido enviado para análise.";
  }
});

document.querySelector("#simulate-refresh").addEventListener("click", () => {
  state.quantity = 0;
  state.couponApplied = false;
  state.discountStuck = false;
  document.querySelector("#coupon-message").textContent = "Carrinho restaurado vazio após a atualização simulada.";
  updateCart();
  setView("cart");
});

evidenceReview.addEventListener("submit", (event) => {
  event.preventDefault();
  const selected = [...evidenceReview.querySelectorAll("input:checked")].map((input) => input.value);
  const error = document.querySelector("#review-error");
  if (selected.length !== Object.keys(discoveries).length) {
    error.hidden = false;
    error.textContent = "Revise todas as quatro evidências encontradas antes de concluir.";
    return;
  }
  const xp = 100;
  const saved = window.QAQuestProgress.saveMissionResult("exploratory", xp);
  workspace.hidden = true;
  result.hidden = false;
  document.querySelector("#result-evidence").textContent = "4 / 4";
  document.querySelector("#result-review").textContent = "4 / 4";
  document.querySelector("#result-xp").textContent = String(xp);
  document.querySelector("#result-summary").textContent = "Você variou ações, encontrou falhas de estoque, desconto, endereço e checkout, e transformou os sinais em evidências reportáveis.";
  saveStatus.show(saved);
  document.querySelector("#result-title").focus();
});

document.querySelector("#restart-exploration").addEventListener("click", restart);
restart();
