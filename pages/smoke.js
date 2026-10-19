// Six independent smoke checks for a deterministic, fictional Bazaraza release.
// Responses are local fixtures: no requests, authentication or purchases are performed.
const checks = [
  {
    id: "home", title: "Home", path: "/", action: "Abrir loja",
    expected: "A página inicial abre com a marca, a navegação e o acesso ao catálogo.",
    previewTitle: "Uma nova versão da sua loja.",
    previewDescription: "Abra a loja e confira se o conteúdo essencial está disponível.",
    status: "200 OK", outcome: "pass",
    observed: "A home abriu com a marca Bazaraza, navegação e botão de acesso ao catálogo.",
    detail: "Bazaraza\nInício · Catálogo · Carrinho · Minha conta\n[Ver produtos]",
    impact: "O cliente consegue acessar a loja e localizar o catálogo."
  },
  {
    id: "catalog", title: "Catálogo", path: "/catalog", action: "Carregar produtos",
    expected: "O catálogo exibe pelo menos um produto com nome, preço e disponibilidade.",
    previewTitle: "Produtos para o seu dia.",
    previewDescription: "Confira apenas se o catálogo está utilizável; filtros e combinações ficam para testes posteriores.",
    status: "200 OK", outcome: "pass",
    observed: "A Mochila Urbana foi exibida por R$ 189,90, com estoque e opção de adicionar ao carrinho.",
    detail: "Mochila Urbana · R$ 189,90\nEstoque: 5 unidades\n[Adicionar ao carrinho]",
    impact: "O cliente consegue encontrar um produto disponível para compra."
  },
  {
    id: "cart", title: "Carrinho", path: "/cart", action: "Adicionar item de teste",
    expected: "Ao adicionar uma Mochila Urbana, o carrinho mostra 1 unidade e total de R$ 189,90.",
    previewTitle: "Seu carrinho de teste.",
    previewDescription: "Adicione um produto de teste e confira quantidade e total, sem explorar cupons ou limites.",
    status: "200 OK", outcome: "pass",
    observed: "Uma Mochila Urbana foi adicionada. Quantidade: 1. Total: R$ 189,90.",
    detail: "Mochila Urbana × 1\nTotal: R$ 189,90\n[Ir para checkout]",
    impact: "A inclusão básica do item no carrinho funciona."
  },
  {
    id: "checkout", title: "Checkout", path: "/checkout", action: "Abrir checkout",
    expected: "Com um item de teste no carrinho, o checkout abre os campos de entrega e pagamento.",
    previewTitle: "Finalização da compra.",
    previewDescription: "Um carrinho de teste já está preparado para esta verificação independente.",
    status: "503 Service Unavailable", outcome: "fail",
    observed: "O checkout exibiu Serviço indisponível. Nenhum campo de entrega ou pagamento foi carregado.",
    detail: "Serviço indisponível\nNão foi possível abrir o checkout.\nReferência: BZ-CHECKOUT-503",
    impact: "O cliente fica impedido de avançar para a finalização da compra. É uma falha crítica."
  },
  {
    id: "login", title: "Login", path: "/login", action: "Entrar com conta de teste",
    expected: "A conta fictícia de teste acessa Minha conta e recebe uma confirmação de sessão.",
    previewTitle: "Acesse sua conta de teste.",
    previewDescription: "Use a conta preparada cliente@bazaraza.test. Nenhuma senha ou informação pessoal é necessária.",
    status: "200 OK", outcome: "pass",
    observed: "A conta fictícia entrou e a área Minha conta exibiu a sessão autenticada.",
    detail: "Bem-vindo, Cliente de teste!\nMinha conta\nSessão de teste: autenticada",
    impact: "O acesso básico à conta está disponível."
  },
  {
    id: "api", title: "API de pedidos", path: "/api/orders", action: "Consultar pedidos",
    expected: "A consulta de pedidos da conta de teste responde com status 200 e uma lista, mesmo que vazia.",
    previewTitle: "Consulta de pedidos.",
    previewDescription: "O painel representa uma resposta de API simulada. Verifique o status e o conteúdo.",
    status: "500 Internal Server Error", outcome: "fail",
    observed: "A consulta retornou status 500 com erro de consulta, em vez de uma lista de pedidos.",
    detail: '{\n  "error": "ORDERS_QUERY_FAILED",\n  "message": "Não foi possível consultar os pedidos"\n}',
    impact: "O cliente não consegue consultar seus pedidos. Este serviço essencial está indisponível."
  }
];
const progress = window.QAQuestProgress;
const get = (id) => document.getElementById(id);
const classificationForm = get("smoke-classification");
const reviewForm = get("smoke-review");
const saveStatus = document.querySelector("qa-save-status");

function initialState() {
  return {
    selected: "home", observed: new Set(), records: new Map(),
    attempts: {}, decisionAttempts: 0, impactAttempts: 0,
    decisionPoints: 0, impactPoints: 0, finished: false
  };
}
let state = initialState();

function score() {
  return [...state.records.values()].reduce((total, record) => total + record.points, 0) +
    state.decisionPoints + state.impactPoints;
}

function showFeedback(id, message) {
  const element = get(id);
  element.textContent = message;
  element.hidden = !message;
}

function ensureAccess() {
  const unlocked = progress.isTracksUnlocked();
  get("smoke-locked").hidden = unlocked;
  get("smoke-content").hidden = !unlocked;
  if (!unlocked && progress.isPhaseUnlocked(4)) {
    get("smoke-locked-link").href = "phase4.html";
    get("smoke-locked-link").textContent = "Continuar Fase 4";
  }
  return unlocked;
}

function makeEvidence(check) {
  const evidence = document.createElement("details");
  evidence.className = "smoke-evidence-item";
  evidence.dataset.outcome = check.outcome;
  const summary = document.createElement("summary");
  const title = document.createElement("strong");
  title.textContent = check.title + " · " + (check.outcome === "pass" ? "Passou" : "Falhou — crítico");
  summary.append(title);
  evidence.append(summary);
  const facts = [
    ["Ação", check.action + " em bazaraza.test" + check.path],
    ["Esperado", check.expected],
    ["Observado", check.status + ". " + check.observed],
    ["Impacto", check.impact]
  ];
  for (const [label, value] of facts) {
    const paragraph = document.createElement("p");
    const prefix = document.createElement("b");
    prefix.textContent = label + ": ";
    paragraph.append(prefix, document.createTextNode(value));
    evidence.append(paragraph);
  }
  return evidence;
}

function renderChecklist() {
  get("smoke-checks").replaceChildren(...checks.map((check, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.check = check.id;
    button.setAttribute("aria-pressed", String(state.selected === check.id));
    const number = document.createElement("span");
    number.className = "smoke-check-number";
    number.textContent = String(index + 1).padStart(2, "0");
    const copy = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = check.title;
    const status = document.createElement("small");
    const record = state.records.get(check.id);
    status.textContent = record ? (check.outcome === "pass" ? "Passou" : "Falhou — crítico") :
      state.observed.has(check.id) ? "Classificação pendente" : "Não executado";
    if (record) button.dataset.outcome = check.outcome;
    copy.append(title, status);
    button.append(number, copy);
    button.addEventListener("click", () => {
      if (!state.finished && ensureAccess()) selectCheck(check.id);
    });
    item.append(button);
    return item;
  }));
}

function updateProgress() {
  const count = state.records.size;
  get("smoke-count").textContent = count + " / " + checks.length;
  get("smoke-progress").setAttribute("aria-valuenow", String(count));
  get("smoke-bar").style.width = (count / checks.length * 100) + "%";
  get("header-xp").textContent = String(score());
  const failures = checks.filter((check) => check.outcome === "fail" && state.records.has(check.id));
  const status = get("smoke-release-status");
  status.dataset.blocked = String(failures.length > 0);
  status.textContent = failures.length
    ? "Smoke reprovado · BZ-2026.10 · " + failures.length + " falha(s) crítica(s). Esta release está bloqueada; testes aprofundados não liberados."
    : count === checks.length
      ? "Smoke aprovado tecnicamente · checks essenciais aprovados. Testes aprofundados liberados; produção ainda não avaliada."
      : count ? "Em avaliação · há verificações essenciais restantes."
        : "Em avaliação · nenhum resultado registrado.";
  if (count) {
    get("smoke-evidence").replaceChildren(...checks.filter((check) => state.records.has(check.id)).map(makeEvidence));
  } else {
    const empty = document.createElement("p");
    empty.className = "smoke-empty";
    empty.textContent = "Os resultados aparecerão aqui depois que você os classificar corretamente.";
    get("smoke-evidence").replaceChildren(empty);
  }
  reviewForm.hidden = count !== checks.length;
  get("smoke-review-hint").hidden = count === checks.length;
  renderChecklist();
}

function selectCheck(id, focus = true) {
  state.selected = id;
  const check = checks.find((entry) => entry.id === id);
  const observed = state.observed.has(id);
  const recorded = state.records.has(id);
  get("check-title").textContent = check.title;
  get("check-expected").textContent = "Esperado: " + check.expected;
  get("smoke-address").textContent = "bazaraza.test" + check.path;
  get("preview-kicker").textContent = check.title.toLocaleUpperCase("pt-BR");
  get("preview-title").textContent = check.previewTitle;
  get("preview-description").textContent = check.previewDescription;
  get("run-smoke-check").textContent = observed ? "Ação executada" : check.action;
  get("run-smoke-check").disabled = observed;
  get("smoke-observation").hidden = !observed;
  get("smoke-observation").dataset.outcome = check.outcome;
  get("observation-status").textContent = check.status;
  get("observation-description").textContent = check.observed;
  get("observation-detail").textContent = check.detail;
  classificationForm.hidden = !observed;
  classificationForm.querySelectorAll("button").forEach((button) => { button.disabled = recorded; });
  showFeedback("classification-feedback", recorded
    ? "Evidência registrada. " + check.impact + " +" + state.records.get(id).points + " XP nesta tentativa." : "");
  const next = checks.find((entry) => !state.records.has(entry.id));
  get("next-smoke-check").hidden = !recorded;
  get("next-smoke-check").textContent = next ? "Abrir próximo check →" : "Revisar e emitir parecer →";
  renderChecklist();
  if (focus) get("check-title").focus();
}

function initializeMission() {
  get("run-smoke-check").addEventListener("click", () => {
    if (state.finished || !ensureAccess()) return;
    state.observed.add(state.selected);
    selectCheck(state.selected, false);
    classificationForm.querySelector("button").focus();
  });

  classificationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const check = checks.find((entry) => entry.id === state.selected);
    if (state.finished || !ensureAccess() || !state.observed.has(check.id) || state.records.has(check.id)) return;
    const answer = event.submitter?.value;
    if (!["pass", "fail"].includes(answer)) return;
    state.attempts[check.id] = (state.attempts[check.id] || 0) + 1;
    if (answer !== check.outcome) {
      showFeedback("classification-feedback",
        "Compare novamente. Esperado: " + check.expected + " Observado: " + check.observed +
        " " + (check.outcome === "fail" ? "O fluxo essencial está indisponível." : "A ação essencial foi concluída conforme esperado.") +
        " Corrigir esta resposta valerá 5 XP.");
      return;
    }
    state.records.set(check.id, { points: state.attempts[check.id] === 1 ? 10 : 5 });
    updateProgress();
    selectCheck(check.id, false);
    get("next-smoke-check").focus();
  });

  get("next-smoke-check").addEventListener("click", () => {
    if (state.finished || !ensureAccess()) return;
    const next = checks.find((check) => !state.records.has(check.id));
    if (next) selectCheck(next.id);
    else reviewForm.querySelector("input").focus();
  });

  reviewForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (state.finished || !ensureAccess() || state.records.size !== checks.length) return;
    const data = new FormData(reviewForm);
    const decision = data.get("decision");
    const impact = data.get("impact");
    if (!decision || !impact) {
      showFeedback("smoke-review-feedback", "Informe a decisão e o impacto para emitir o parecer.");
      return;
    }
    state.decisionAttempts += 1;
    state.impactAttempts += 1;
    const correctDecision = decision === "block";
    const correctImpact = impact === "critical";
    // Once demonstrated, a correct answer retains its points while another answer is corrected.
    if (correctDecision && !state.decisionPoints) state.decisionPoints = state.decisionAttempts === 1 ? 20 : 10;
    if (correctImpact && !state.impactPoints) state.impactPoints = state.impactAttempts === 1 ? 20 : 10;
    get("header-xp").textContent = String(score());
    if (!correctDecision || !correctImpact) {
      const messages = [];
      if (!correctDecision) messages.push("Reprove o Smoke Test e bloqueie apenas esta release, BZ-2026.10: o checkout retorna 503 e a API de pedidos retorna 500. As falhas críticas impedem liberar testes aprofundados; isso não reprova a Bazaraza como produto.");
      if (!correctImpact) messages.push("O cliente não consegue concluir a compra nem consultar pedidos. Quatro checks aprovados não compensam esses impedimentos. Um Smoke Test aprovado liberaria apenas testes aprofundados; não aprovaria a aplicação para produção.");
      messages.push("Revise o parecer. Respostas incorretas passam a valer 10 XP quando corrigidas.");
      showFeedback("smoke-review-feedback", messages.join(" "));
      return;
    }
    let saved;
    try {
      saved = progress.saveMissionResult("smoke", score());
    } catch {
      showFeedback("smoke-review-feedback", "Não foi possível concluir a missão. Confirme que a Fase 4 está concluída e tente novamente.");
      return;
    }
    state.finished = true;
    get("smoke-workspace").hidden = true;
    get("smoke-result").hidden = false;
    get("smoke-result-xp").textContent = score() + " XP";
    get("smoke-result-summary").textContent = "Missão concluída com o parecer técnico correto: o Smoke Test da release BZ-2026.10 foi reprovado e somente esta release está bloqueada. Melhor resultado: " + saved.bestXp +
      " XP · Tentativas concluídas: " + saved.attempts + " · XP compartilhado: " + saved.totalXp + ".";
    get("smoke-result-evidence").replaceChildren(...checks.map(makeEvidence));
    saveStatus.show(saved);
    get("smoke-result-title").focus();
  });

  get("restart-smoke").addEventListener("click", () => {
    if (!ensureAccess()) return;
    state = initialState();
    reviewForm.reset();
    showFeedback("smoke-review-feedback", "");
    saveStatus.reset();
    get("smoke-result-evidence").replaceChildren();
    get("smoke-result").hidden = true;
    get("smoke-workspace").hidden = false;
    updateProgress();
    selectCheck("home");
  });

  updateProgress();
  selectCheck("home", false);
}

if (ensureAccess()) initializeMission();
