import "../core/progress.js";
import "../components/brand.js";
import "../components/theme-toggle.js";
import "../components/header.js";
import "../components/footer.js";
import "../components/save-status.js";
import "../components/support-material.js";
import "../components/stepscript-support.js";
import {
  CYPRESS_MISSION_ID,
  CYPRESS_STEPS,
  CYPRESS_ACTIONS,
  CYPRESS_PROFILES,
  createCypressSession,
  filterCatalog,
  recordCypressRun,
  answerCypressStep,
  advanceCypressStep,
  cypressScore,
  isCypressComplete,
  buildCypressCode,
} from "../core/cypress-lab.js";

const progress = window.QAQuestProgress;
const get = (id) => document.getElementById(id);
const controls = get("cy-answer-controls");
const form = get("cy-answer");
const saveStatus = document.querySelector("qa-save-status");
let session = createCypressSession();
let actionOrder = ["apply", "search", "filter"];
let finished = false;

function node(tag, text, className) {
  const result = document.createElement(tag);
  if (text !== undefined) result.textContent = text;
  if (className) result.className = className;
  return result;
}

function ensureAccess() {
  const readOnly = progress.isReadOnly();
  const allowed = progress.isTracksUnlocked() && !readOnly;
  get("cy-locked").hidden = allowed;
  get("cy-content").hidden = !allowed;
  get("cy-locked-title").textContent = readOnly
    ? "Atualize o QA Quest antes de salvar."
    : "Conclua a Fase 4 para começar.";
  get("cy-locked-copy").textContent = readOnly
    ? "O progresso pertence a uma versão mais recente e não será sobrescrito. A apostila continua acessível."
    : "Não é obrigatório concluir Fundamentos ou outra trilha. A apostila acima é livre e opcional.";
  return allowed;
}

function feedback(text = "", correct = false) {
  get("cy-feedback").textContent = text;
  get("cy-feedback").classList.toggle("is-correct", correct);
}

function renderProgress() {
  const count = Object.keys(session.awards).length;
  get("header-xp").textContent = cypressScore(session);
  get("cy-progress").value = count;
  get("cy-progress").textContent = `${count} de ${CYPRESS_STEPS.length}`;
  get("cy-progress-copy").textContent =
    `Etapa ${session.step + 1} de ${CYPRESS_STEPS.length} · ${cypressScore(session)} XP nesta rodada`;
  get("cy-code").textContent = buildCypressCode(session);
  get("cy-checkpoints").replaceChildren(
    ...CYPRESS_STEPS.map((step, index) => {
      const done = session.awards[step.id] !== undefined;
      const item = node(
        "li",
        `${String(index + 1).padStart(2, "0")} · ${step.title}${done ? " · concluída" : ""}`,
      );
      if (index === session.step) item.setAttribute("aria-current", "step");
      item.classList.toggle("is-done", done);
      return item;
    }),
  );
}

function select(labelText, name, options) {
  const label = node("label", undefined, "cy-field");
  const input = document.createElement("select");
  input.name = name;
  input.required = true;
  const placeholder = node("option", "Escolha uma opção");
  placeholder.value = "";
  placeholder.disabled = true;
  placeholder.selected = true;
  input.append(placeholder);
  for (const [value, text] of options) {
    const option = node("option", text);
    option.value = value;
    input.append(option);
  }
  label.append(node("span", labelText), input);
  controls.append(label);
}

function choices(options) {
  for (const [value, text] of options) {
    const label = node("label", undefined, "cy-choice");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "answer";
    input.value = value;
    input.required = true;
    label.append(input, node("span", text));
    controls.append(label);
  }
}

function renderOrder(focusId, direction) {
  const list = node("ol", undefined, "cy-action-list");
  actionOrder.forEach((id, index) => {
    const item = node("li");
    item.dataset.action = id;
    const buttons = node("div", undefined, "cy-move-buttons");
    const action = CYPRESS_ACTIONS.find((item) => item.id === id);
    for (const [offset, symbol, label] of [
      [-1, "↑", "Mover para cima"],
      [1, "↓", "Mover para baixo"],
    ]) {
      const button = node("button", symbol);
      button.type = "button";
      button.dataset.move = offset;
      button.setAttribute("aria-label", `${label}: ${action.code}`);
      button.disabled =
        index + offset < 0 || index + offset >= actionOrder.length;
      buttons.append(button);
    }
    item.append(node("code", action.code), buttons);
    list.append(item);
  });
  controls.replaceChildren(list);
  if (focusId) {
    const row = controls.querySelector(`[data-action="${focusId}"]`);
    const preferred = row.querySelector(`[data-move="${direction}"]`);
    (preferred.disabled
      ? row.querySelector("button:not(:disabled)")
      : preferred
    ).focus();
  }
}

function enterSection(title, panel) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  title.focus({ preventScroll: true });
  title.scrollIntoView({
    block: "start",
    behavior: reduced ? "instant" : "smooth",
  });
  if (!reduced)
    panel.animate(
      [
        { opacity: 0.3, transform: "translateY(8px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 280, easing: "cubic-bezier(.22,1,.36,1)" },
    );
}

function renderStep(focus = true) {
  const step = CYPRESS_STEPS[session.step];
  get("cy-step-label").textContent =
    `ETAPA ${session.step + 1} · ATÉ ${step.points} XP`;
  get("cy-step-title").textContent = step.title;
  get("cy-instruction").textContent = step.instruction;
  controls.replaceChildren();
  get("cy-answer-fieldset").disabled = false;
  get("cy-check").disabled = false;
  get("cy-next").hidden = true;
  get("cy-next").textContent =
    session.step === CYPRESS_STEPS.length - 1
      ? "Concluir missão e salvar →"
      : "Próxima etapa →";
  get("cy-run-controls").hidden = step.kind !== "diagnosis";
  if (step.kind === "structure") {
    select("Agrupar os casos", "suite", [
      ["describe", 'describe("Catálogo Fikily", () => { … })'],
      ["should", 'should("Catálogo", …)'],
    ]);
    select("Definir um caso", "test", [
      ["visit", 'cy.visit("filtra acessórios")'],
      ["it", 'it("filtra acessórios por busca", () => { … })'],
    ]);
    select("Abrir o catálogo dentro do caso", "visit", [
      ["visit", 'cy.visit("/catalog")'],
      ["get", 'cy.get("/catalog")'],
    ]);
  } else if (step.kind === "order") renderOrder();
  else if (step.kind === "assertions") {
    select("Quando conferir os cards?", "sync", [
      ["fixed", "Depois de cy.wait(300), sem observar o estado"],
      [
        "ready",
        'cy.get(results, { timeout: 2000 }).should("have.attr", "data-state", "ready")',
      ],
    ]);
    select("Quantidade", "count", [
      ["nonempty", "expect($cards.length).to.be.greaterThan(0)"],
      ["empty", "Aceitar uma lista vazia se não houver eletrônicos"],
    ]);
    select("Categoria dos cards", "category", [
      ["some", "Conferir somente o primeiro card"],
      ["every", 'Conferir data-category = "accessories" em todos os cards'],
    ]);
  } else if (step.kind === "diagnosis") {
    const options = [
      ["pass", "Caso atende à regra neste escopo"],
      ["product", "Defeito do produto, mesmo após a atualização"],
      ["test", "Falha do teste: leitura antes da atualização"],
    ];
    for (const profile of CYPRESS_PROFILES)
      select(profile.label, profile.id, options);
  } else if (step.kind === "review") {
    select("Sincronização e assertion", "sync", [
      ["remove", "Remover a assertion para deixar verde"],
      ["condition", "Observar o estado pronto com limite e manter a assertion"],
    ]);
    select("Estado inicial do teste", "isolation", [
      ["previous", "Depender do filtro selecionado por outro it"],
      ["own", "Cada it visita e prepara seus próprios filtros e dados"],
    ]);
    select("Parecer sobre a candidata", "verdict", [
      ["release", "Aprovar produção porque a referência passou"],
      [
        "return",
        "Devolver a candidata para ajuste; a missão conclui pelo diagnóstico correto",
      ],
    ]);
  } else choices(step.options);
  feedback();
  renderProgress();
  if (focus)
    enterSection(get("cy-step-title"), document.querySelector(".cy-task"));
}

function renderProducts(products) {
  get("cy-products").replaceChildren(
    ...products.map((product) => {
      const item = node("li");
      item.dataset.testid = "product-card";
      item.dataset.category = product.category;
      item.append(
        node("strong", product.name),
        node("span", `${product.label} · ${product.id}`),
      );
      return item;
    }),
  );
  if (!products.length)
    get("cy-products").append(
      node("li", "Nenhum produto para essa combinação."),
    );
}

function evidenceNode(run) {
  const article = node("article", undefined, "cy-evidence-card");
  article.append(
    node(
      "h4",
      CYPRESS_PROFILES.find((profile) => profile.id === run.profile).label,
    ),
  );
  const trace = node("ol");
  run.trace.forEach((line) => trace.append(node("li", line)));
  article.append(trace);
  for (const [label, text] of [
    ["Esperado", run.expected],
    ["Observado", run.observed],
    ["Impacto", run.impact],
  ]) {
    const p = node("p");
    p.append(node("strong", label + ": "), document.createTextNode(text));
    article.append(p);
  }
  return article;
}

controls.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-move]");
  if (
    !button ||
    !ensureAccess() ||
    finished ||
    session.awards.actions !== undefined
  )
    return;
  const id = button.closest("[data-action]").dataset.action;
  const from = actionOrder.indexOf(id),
    to = from + Number(button.dataset.move);
  if (to < 0 || to >= actionOrder.length) return;
  [actionOrder[from], actionOrder[to]] = [actionOrder[to], actionOrder[from]];
  renderOrder(id, button.dataset.move);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!ensureAccess() || finished) return;
  const step = CYPRESS_STEPS[session.step],
    data = new FormData(form);
  const answer =
    step.kind === "order"
      ? actionOrder
      : step.kind === "choice"
        ? data.get("answer")
        : Object.fromEntries(data);
  const result = answerCypressStep(session, answer);
  session = result.session;
  feedback(
    result.feedback +
      (result.points === undefined ? "" : ` +${result.points} XP.`),
    result.correct,
  );
  if (result.correct) {
    get("cy-answer-fieldset").disabled = true;
    get("cy-check").disabled = true;
    get("cy-next").hidden = false;
    get("cy-next").focus();
  }
  renderProgress();
});

get("cy-run-controls").replaceChildren(
  ...CYPRESS_PROFILES.map((profile) => {
    const button = node(
      "button",
      `Simular: ${profile.label}`,
      "button button--ghost",
    );
    button.type = "button";
    button.dataset.run = profile.id;
    return button;
  }),
);
get("cy-run-controls").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-run]");
  if (!button || !ensureAccess() || finished) return;
  const updated = recordCypressRun(session, button.dataset.run);
  if (updated === session) return;
  session = updated;
  get("cy-evidence-panel").hidden = false;
  get("cy-evidence").replaceChildren(
    ...Object.values(session.runs).map(evidenceNode),
  );
  button.disabled = true;

  feedback(
    session.runs[button.dataset.run].observed +
      (CYPRESS_PROFILES.every((profile) => session.runs[profile.id])
        ? " Três evidências disponíveis: classifique cada perfil."
        : " Simule também os perfis restantes."),
  );
});

get("cy-preview-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const products = filterCatalog(
    get("cy-preview-category").value,
    get("cy-preview-search").value,
  );
  renderProducts(products);
  get("cy-preview-state").textContent =
    `Referência local · lista pronta · ${products.length} resultado(s). Sem efeito na pontuação ou nas evidências.`;
});

get("cy-next").addEventListener("click", () => {
  if (!ensureAccess() || finished) return;
  if (!isCypressComplete(session)) {
    const updated = advanceCypressStep(session);
    if (updated !== session) {
      session = updated;
      renderStep();
    }
    return;
  }
  let saved;
  try {
    saved = progress.saveMissionResult(
      CYPRESS_MISSION_ID,
      cypressScore(session),
    );
  } catch (error) {
    feedback(error.message || "Não foi possível salvar. Tente novamente.");
    return;
  }
  finished = true;
  get("cy-workspace").hidden = true;
  get("cy-result").hidden = false;
  get("cy-result-xp").textContent = cypressScore(session) + " XP";
  get("cy-result-summary").textContent =
    `Melhor resultado: ${saved.bestXp} XP · Tentativas concluídas: ${saved.attempts} · XP compartilhado: ${saved.totalXp}.`;
  get("cy-result-records").replaceChildren(
    ...CYPRESS_STEPS.map((step) =>
      node(
        "li",
        `${step.title}: ${session.awards[step.id]} de ${step.points} XP. ${step.feedback}`,
      ),
    ),
  );
  get("cy-result-evidence").replaceChildren(
    ...Object.values(session.runs).map(evidenceNode),
  );
  saveStatus.show(saved);
  enterSection(get("cy-result-title"), get("cy-result"));
});

get("cy-restart").addEventListener("click", () => {
  if (!ensureAccess()) return;
  session = createCypressSession();
  actionOrder = ["apply", "search", "filter"];
  finished = false;
  get("cy-result").hidden = true;
  get("cy-workspace").hidden = false;
  get("cy-result").querySelector("details").open = false;
  for (const id of ["cy-evidence", "cy-result-records", "cy-result-evidence"])
    get(id).replaceChildren();
  get("cy-evidence-panel").hidden = true;
  get("cy-run-controls")
    .querySelectorAll("button")
    .forEach((button) => {
      button.disabled = false;
    });
  get("cy-preview-form").reset();
  renderProducts(filterCatalog());
  get("cy-preview-state").textContent =
    "Referência local · lista pronta · 3 produtos.";
  saveStatus.reset();
  renderStep();
});

window.addEventListener("qaquest:progress", ensureAccess);
window.addEventListener("storage", (event) => {
  if (event.key === progress.storageKey || event.key === null) ensureAccess();
});
window.addEventListener("pageshow", ensureAccess);
window.addEventListener("focus", ensureAccess);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) ensureAccess();
});
renderProducts(filterCatalog());
get("cy-preview-state").textContent =
  "Referência local · lista pronta · 3 produtos.";
renderStep(false);
ensureAccess();
