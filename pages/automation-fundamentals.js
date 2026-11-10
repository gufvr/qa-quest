import "../core/progress.js";
import "../components/brand.js";
import "../components/theme-toggle.js";
import "../components/header.js";
import "../components/footer.js";
import "../components/save-status.js";
import "../components/support-material.js";
import {
  ACTIONS,
  AUTOMATION_MISSION_ID,
  AUTOMATION_STEPS,
  createLabSession,
  answerCheckpoint,
  advanceCheckpoint,
  runLabFixture,
  simulateCatalog,
  isLabComplete,
  labScore,
  buildLabCode,
} from "../core/automation-lab.js";

const progress = window.QAQuestProgress;
const get = (id) => document.getElementById(id);
const form = get("lab-answer");
const controls = get("lab-answer-controls");
const saveStatus = document.querySelector("qa-save-status");
let session = createLabSession();
let actionOrder = ["wait", "filter", "open"];
let finished = false;

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function ensureAccess() {
  const readOnly = progress.isReadOnly();
  const allowed = progress.isTracksUnlocked() && !readOnly;
  get("lab-locked").hidden = allowed;
  get("lab-content").hidden = !allowed;
  get("lab-locked-title").textContent = readOnly
    ? "Atualize o QA Quest antes de salvar."
    : "Conclua a Fase 4 para começar.";
  get("lab-locked-copy").textContent = readOnly
    ? "Este progresso pertence a uma versão mais recente. O save original permanece intacto; esta versão não tentará sobrescrevê-lo."
    : "A missão não exige outras trilhas, ferramentas instaladas ou extensões.";
  get("lab-locked-link").href =
    !readOnly && progress.isPhaseUnlocked(4) ? "phase4.html" : "jornada.html";
  get("lab-locked-link").textContent =
    !readOnly && progress.isPhaseUnlocked(4)
      ? "Continuar Fase 4"
      : "Voltar à jornada";
  return allowed;
}

function feedback(text = "", correct = false) {
  get("lab-feedback").textContent = text;
  get("lab-feedback").classList.toggle("lab-feedback--correct", correct);
}

function renderProgress() {
  const completed = Object.keys(session.awards).length;
  get("header-xp").textContent = labScore(session);
  get("lab-progress").value = completed;
  get("lab-progress").textContent = `${completed} de 7`;
  get("lab-progress-copy").textContent =
    `Etapa ${session.step + 1} de 7 · ${labScore(session)} XP nesta rodada`;
  get("lab-code").textContent = buildLabCode(session);
  get("lab-checkpoints").replaceChildren(
    ...AUTOMATION_STEPS.map((step, index) => {
      const done = session.awards[step.id] !== undefined;
      const item = element(
        "li",
        `${String(index + 1).padStart(2, "0")} · ${step.title}${done ? " · concluída" : ""}`,
      );
      if (index === session.step) item.setAttribute("aria-current", "step");
      item.classList.toggle("lab-checkpoint--done", done);
      return item;
    }),
  );
}

function appendChoices(options, name = "answer") {
  for (const [value, text] of options) {
    const label = element("label", undefined, "lab-choice");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = name;
    input.value = value;
    input.required = true;
    label.append(input, element("span", text));
    controls.append(label);
  }
}

function appendSelect(labelText, name, options) {
  const label = element("label", undefined, "lab-field");
  const select = document.createElement("select");
  select.name = name;
  select.required = true;
  const placeholder = element("option", "Escolha uma opção");
  placeholder.value = "";
  placeholder.disabled = true;
  placeholder.selected = true;
  select.append(placeholder);
  for (const [value, text] of options) {
    const option = element("option", text);
    option.value = value;
    select.append(option);
  }
  label.append(element("span", labelText), select);
  controls.append(label);
}

function renderOrder(focusId, direction) {
  controls.replaceChildren();
  const list = element("ol", undefined, "lab-action-list");
  actionOrder.forEach((id, index) => {
    const action = ACTIONS.find((item) => item.id === id);
    const item = element("li");
    item.dataset.action = id;
    const buttons = element("div", undefined, "lab-move-buttons");
    for (const [offset, symbol, label] of [
      [-1, "↑", "Mover para cima"],
      [1, "↓", "Mover para baixo"],
    ]) {
      const button = element("button", symbol);
      button.type = "button";
      button.dataset.move = offset;
      button.setAttribute("aria-label", `${label}: ${action.label}`);
      button.disabled =
        index + offset < 0 || index + offset >= actionOrder.length;
      buttons.append(button);
    }
    item.append(element("span", action.label), buttons);
    list.append(item);
  });
  controls.append(list);
  if (focusId) {
    const row = controls.querySelector(`[data-action="${focusId}"]`);
    const preferred = row.querySelector(`[data-move="${direction}"]`);
    (preferred.disabled
      ? row.querySelector("button:not(:disabled)")
      : preferred
    ).focus();
  }
}

function renderStep({ focus = true } = {}) {
  const step = AUTOMATION_STEPS[session.step];
  get("lab-step-label").textContent =
    `ETAPA ${session.step + 1} · ATÉ ${step.points} XP`;
  get("lab-step-title").textContent = step.title;
  get("lab-instruction").textContent = step.instruction;
  controls.replaceChildren();
  get("lab-answer-fieldset").disabled = false;
  get("lab-check").disabled = false;
  get("lab-next").hidden = true;
  get("lab-next").textContent =
    session.step === AUTOMATION_STEPS.length - 1
      ? "Concluir missão e salvar →"
      : "Próxima etapa →";
  get("lab-run-controls").hidden = step.kind !== "diagnosis";
  get("lab-target").classList.toggle(
    "lab-filter-target--active",
    step.id === "selector",
  );
  if (step.kind === "order") renderOrder();
  else if (step.kind === "assertion") {
    appendSelect("O que verificar?", "subject", [
      ["visible", "A página está visível"],
      ["categories", "Categoria dos produtos, com lista não vazia"],
    ]);
    appendSelect("Qual condição?", "operator", [
      ["some", "Pelo menos um resultado corresponde"],
      ["every", "Todos os resultados correspondem"],
    ]);
    appendSelect("Qual valor esperado?", "value", [
      ["accessories", "Acessórios"],
      ["electronics", "Eletrônicos"],
    ]);
  } else if (step.kind === "maintenance") {
    controls.append(
      element(
        "pre",
        "ANTES: TARGET .filter--purple\nESTILO NOVO: .filter--compact",
        "lab-maintenance-code",
      ),
    );
    appendSelect("Substituir o seletor por", "selector", [
      ["style", ".filter--compact (continuar dependendo do estilo)"],
      ["stable", '[data-testid="category-filter"]'],
      ["any", "Qualquer select da página"],
    ]);
    appendSelect("E a assertion da categoria?", "assertion", [
      ["remove", "Remover para o teste ficar verde"],
      ["keep", "Manter a verificação de todos os produtos"],
    ]);
  } else appendChoices(step.options);
  feedback();
  renderProgress();
  if (focus) {
    get("lab-step-title").focus({ preventScroll: true });
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    get("lab-step-title").scrollIntoView({
      block: "start",
      behavior: reducedMotion ? "instant" : "smooth",
    });
    if (!reducedMotion) {
      document.querySelector(".lab-task").animate(
        [
          { opacity: 0.4, transform: "translateY(8px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 240, easing: "ease-out" },
      );
    }
  }
}

function renderProducts(items) {
  get("lab-products").replaceChildren(
    ...items.map((product) => {
      const item = element("li");
      item.append(
        element("strong", product.name),
        element("span", product.categoryLabel),
      );
      return item;
    }),
  );
}

function evidenceNode(run) {
  const article = element("article", undefined, "lab-evidence-card");
  article.append(
    element(
      "h4",
      run.profile === "reference"
        ? "Referência fixa · caso passou"
        : "Candidata fixa · caso falhou",
    ),
  );
  const trace = element("ol");
  run.trace.forEach((line) => trace.append(element("li", line)));
  article.append(trace);
  for (const [label, text] of [
    ["Esperado", run.expected],
    ["Observado", run.observed],
    ["Impacto", run.impact],
  ]) {
    const p = element("p");
    p.append(element("strong", label + ": "), document.createTextNode(text));
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
  const step = AUTOMATION_STEPS[session.step];
  const data = new FormData(form);
  const answer =
    step.kind === "order"
      ? actionOrder
      : ["assertion", "maintenance"].includes(step.kind)
        ? Object.fromEntries(data)
        : data.get("answer");
  const result = answerCheckpoint(session, answer);
  session = result.session;
  const points =
    result.points === undefined
      ? ""
      : ` +${result.points.toLocaleString("pt-BR")} XP.`;
  feedback(result.feedback + points, result.correct);
  if (result.correct) {
    get("lab-answer-fieldset").disabled = true;
    get("lab-check").disabled = true;
    get("lab-next").hidden = false;
    get("lab-next").focus();
  }
  renderProgress();
});

get("lab-preview-filter").addEventListener("change", (event) => {
  const items = simulateCatalog("candidate").products;
  const category = event.target.value;
  renderProducts(
    category === "all"
      ? items
      : items.filter((item) => item.category === category),
  );
  get("lab-preview-state").textContent =
    "Exploração da referência local · lista pronta. As evidências registradas abaixo não são alteradas por este controle.";
});

get("lab-run-controls").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-run]");
  if (!button || !ensureAccess() || finished) return;
  const updated = runLabFixture(session, button.dataset.run);
  if (updated === session) return;
  session = updated;
  const run = session.runs[button.dataset.run];
  renderProducts(run.products);
  get("lab-preview-filter").value = "accessories";
  get("lab-preview-state").textContent =
    (run.profile === "reference" ? "Referência fixa" : "Candidata fixa") +
    " · lista pronta · " +
    (run.passed ? "assertion passou" : "assertion falhou");
  get("lab-evidence-panel").hidden = false;
  get("lab-evidence").replaceChildren(
    ...Object.values(session.runs).map(evidenceNode),
  );
  button.disabled = true;
  feedback(
    "Fixture simulada. " +
      run.observed +
      (session.runs.reference && session.runs.candidate
        ? " As duas evidências estão disponíveis; classifique o resultado."
        : " Simule também a outra fixture."),
  );
});

get("lab-next").addEventListener("click", () => {
  if (!ensureAccess() || finished) return;
  if (!isLabComplete(session)) {
    const updated = advanceCheckpoint(session);
    if (updated !== session) {
      session = updated;
      renderStep();
    }
    return;
  }
  let saved;
  try {
    saved = progress.saveMissionResult(
      AUTOMATION_MISSION_ID,
      labScore(session),
    );
  } catch (error) {
    feedback(error.message || "Não foi possível salvar. Tente novamente.");
    return;
  }
  finished = true;
  get("lab-workspace").hidden = true;
  get("lab-result").hidden = false;
  get("lab-result-xp").textContent = labScore(session) + " XP";
  get("lab-result-summary").textContent =
    `Melhor resultado: ${saved.bestXp} XP · Tentativas concluídas: ${saved.attempts} · XP compartilhado: ${saved.totalXp}.`;
  get("lab-result-records").replaceChildren(
    ...AUTOMATION_STEPS.map((step) =>
      element(
        "li",
        `${step.title}: ${session.awards[step.id].toLocaleString("pt-BR")} de ${step.points} XP. ${step.hint}`,
      ),
    ),
  );
  get("lab-result-evidence").replaceChildren(
    ...Object.values(session.runs).map(evidenceNode),
  );
  saveStatus.show(saved);
  get("lab-result-title").focus();
});

get("lab-restart").addEventListener("click", () => {
  if (!ensureAccess()) return;
  session = createLabSession();
  finished = false;
  actionOrder = ["wait", "filter", "open"];
  get("lab-result").hidden = true;
  get("lab-workspace").hidden = false;
  get("lab-result").querySelector("details").open = false;
  get("lab-result-records").replaceChildren();
  get("lab-result-evidence").replaceChildren();
  get("lab-evidence").replaceChildren();
  get("lab-evidence-panel").hidden = true;
  document.querySelectorAll("[data-run]").forEach((button) => {
    button.disabled = false;
  });
  get("lab-preview-filter").value = "all";
  renderProducts(simulateCatalog("candidate").products);
  get("lab-preview-state").textContent = "Referência local · lista pronta";
  saveStatus.reset();
  renderStep();
});

window.addEventListener("qaquest:progress", ensureAccess);
window.addEventListener("storage", (event) => {
  if (event.key === progress.storageKey || event.key === null) ensureAccess();
});
window.addEventListener("pageshow", ensureAccess);
renderProducts(simulateCatalog("candidate").products);
renderStep({ focus: false });
ensureAccess();
