import "../core/progress.js";
import "../components/brand.js";
import "../components/theme-toggle.js";
import "../components/header.js";
import "../components/footer.js";
import "../components/save-status.js";
import "../components/support-material.js";
import {
  SELENIUM_MISSION_ID,
  SELENIUM_CASE,
  SELENIUM_STEPS,
  SELENIUM_ACTIONS,
  SELENIUM_PROFILES,
  createSeleniumSession,
  runSeleniumCounterexample,
  recordSeleniumRun,
  answerSeleniumStep,
  advanceSeleniumStep,
  seleniumScore,
  isSeleniumComplete,
  buildSeleniumCode,
  buildFragileSeleniumCode,
} from "../core/selenium-lab.js";

const progress = window.QAQuestProgress;
const get = (id) => document.getElementById(id);
const controls = get("sel-controls");
const form = get("sel-answer");
const saveStatus = document.querySelector("qa-save-status");
const pointsText = (value) => value.toLocaleString("pt-BR");
let session = createSeleniumSession();
let actionOrder = ["assert", "click", "find", "wait", "fill"];
let finished = false;

function node(tag, content, className) {
  const element = document.createElement(tag);
  if (content !== undefined) element.textContent = content;
  if (className) element.className = className;
  return element;
}

function ensureAccess() {
  const readOnly = progress.isReadOnly();
  const allowed = progress.isTracksUnlocked() && !readOnly;
  get("sel-locked").hidden = allowed;
  get("sel-content").hidden = !allowed;
  get("sel-locked-title").textContent = readOnly
    ? "Atualize o QA Quest antes de salvar."
    : "Conclua a Fase 4 para começar.";
  get("sel-locked-copy").textContent = readOnly
    ? "Este save pertence a uma versão mais recente e não será sobrescrito. A apostila continua acessível."
    : "Nenhum módulo anterior ou ferramenta instalada é obrigatório. A apostila acima é livre.";
  return allowed;
}

function feedback(message = "", correct = false) {
  get("sel-feedback").textContent = message;
  get("sel-feedback").classList.toggle("is-correct", correct);
}

function renderProgress() {
  const completed = Object.keys(session.awards).length;
  get("header-xp").textContent = pointsText(seleniumScore(session));
  get("sel-progress").value = completed;
  get("sel-progress").textContent = `${completed} de 7`;
  get("sel-progress-copy").textContent =
    `Etapa ${session.step + 1} de 7 · ${pointsText(seleniumScore(session))} pontos nesta rodada`;
  get("sel-code").textContent = buildSeleniumCode(session);
  get("sel-checkpoints").replaceChildren(
    ...SELENIUM_STEPS.map((step, index) => {
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
  const label = node("label", undefined, "sel-field");
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

function renderOrder(focusId, direction) {
  const list = node("ol", undefined, "sel-order");
  actionOrder.forEach((id, index) => {
    const action = SELENIUM_ACTIONS.find((item) => item.id === id);
    const item = node("li");
    const buttons = node("div", undefined, "sel-move");
    item.dataset.action = id;
    for (const [offset, symbol, label] of [
      [-1, "↑", "Mover para cima"],
      [1, "↓", "Mover para baixo"],
    ]) {
      const button = node("button", symbol);
      button.type = "button";
      button.dataset.move = offset;
      button.setAttribute("aria-label", `${label}: ${action.label}`);
      button.disabled =
        index + offset < 0 || index + offset >= actionOrder.length;
      buttons.append(button);
    }
    item.append(node("span", action.label), buttons);
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
  const step = SELENIUM_STEPS[session.step];
  get("sel-step-label").textContent =
    `ETAPA ${session.step + 1} · ATÉ ${step.points} XP`;
  get("sel-step-title").textContent = step.title;
  get("sel-instruction").textContent = step.instruction;
  controls.replaceChildren();
  get("sel-fieldset").disabled = false;
  get("sel-check").disabled = false;
  get("sel-next").hidden = true;
  get("sel-next").textContent =
    session.step === 6 ? "Concluir missão e salvar →" : "Próxima etapa →";
  get("sel-run-controls").hidden = step.kind !== "diagnosis";
  get("sel-counterexample").hidden = step.kind !== "checks";
  get("sel-counterexample-result").hidden =
    step.kind !== "checks" || !session.counterexample;

  if (step.kind === "structure") {
    select("Importação", "imports", [
      [
        "webdriver",
        'Builder, By e until de "selenium-webdriver"; assert de "node:assert/strict"',
      ],
      ["playwright", 'test e expect de "@playwright/test"'],
    ]);
    select("Estado inicial", "session", [
      ["shared", "Depender da sessão e do carrinho de outro teste"],
      ["fresh", "Criar sessão própria e abrir a URL autorizada configurada"],
    ]);
    select("Encerramento", "cleanup", [
      ["finally", "Usar try/finally e quit quando o driver existir"],
      ["skip", "Encerrar somente quando todas as verificações passarem"],
    ]);
  } else if (step.kind === "locators") {
    select("Campo de cupom", "field", [
      ["id", 'By.id("coupon-code")'],
      ["style", 'By.css(".campo-roxo:first-child")'],
    ]);
    select("Botão Aplicar cupom", "button", [
      ["position", 'By.css("button:first-child")'],
      ["testid", "By.css('[data-testid=\"apply-coupon\"]')"],
    ]);
    select("Região de resultado", "result", [
      ["testid", "By.css('[data-testid=\"coupon-result\"]')"],
      ["message", 'By.id("coupon-code") prova que o resultado está pronto'],
    ]);
  } else if (step.kind === "order") renderOrder();
  else if (step.kind === "choice") {
    for (const [value, text] of step.options) {
      const label = node("label", undefined, "sel-choice");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "answer";
      input.value = value;
      input.required = true;
      label.append(input, node("span", text));
      controls.append(label);
    }
  } else if (step.kind === "checks") {
    select("Mensagem", "message", [
      ["text", 'assert.equal(message, "Cupom aplicado")'],
      ["skip", "Não ler a mensagem"],
    ]);
    select("Desconto", "discount", [
      ["amount", 'assert.equal(discount, "R$ 20,00")'],
      ["skip", "Confiar somente na mensagem positiva"],
    ]);
    select("Total", "total", [
      ["amount", 'assert.equal(total, "R$ 180,00")'],
      ["skip", "Conferir apenas que o botão foi clicado"],
    ]);
  } else if (step.kind === "diagnosis") {
    const options = [
      ["pass", "Caso atende ao contrato neste escopo"],
      ["product", "Defeito do produto mesmo com resultado pronto"],
      ["test", "Falha do teste por leitura prematura"],
    ];
    for (const profile of SELENIUM_PROFILES)
      select(profile.label, profile.id, options);
  } else {
    select("Independência", "isolation", [
      ["shared", "Reutilizar sessão alterada pelo teste anterior"],
      ["fresh", "Preparar estado conhecido e sessão independente"],
    ]);
    select("Encerramento", "cleanup", [
      ["skip", "Não encerrar se uma assertion falhar"],
      ["finally", "Encerrar em finally quando o driver tiver sido criado"],
    ]);
    select("Parecer técnico", "verdict", [
      [
        "return",
        "Devolver a candidata e corrigir a sincronização do teste frágil",
      ],
      ["production", "Aprovar produção porque apareceu Cupom aplicado"],
    ]);
  }

  feedback();
  renderProgress();
  if (focus)
    enterSection(get("sel-step-title"), document.querySelector(".sel-task"));
}

function evidenceNode(run) {
  const article = node("article", undefined, "sel-evidence-card");
  const label = SELENIUM_PROFILES.find((item) => item.id === run.profile).label;
  article.append(node("h4", label));
  for (const [title, value] of [
    ["Esperado", run.expected],
    ["Observado", run.observed],
    ["Impacto", run.impact],
  ]) {
    const paragraph = node("p");
    paragraph.append(
      node("strong", `${title}: `),
      document.createTextNode(value),
    );
    article.append(paragraph);
  }
  const timeline = node("ol", undefined, "sel-timeline");
  for (const event of run.timeline) {
    const item = node("li");
    const time = node("time", `${event.at} ms · ${event.state}`);
    time.dateTime = `PT${event.at / 1000}S`;
    item.append(time, node("span", event.detail));
    timeline.append(item);
  }
  article.append(timeline);
  return article;
}

controls.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-move]");
  if (!button || !ensureAccess() || finished) return;
  const item = button.closest("[data-action]");
  const index = actionOrder.indexOf(item.dataset.action);
  const direction = Number(button.dataset.move);
  const next = index + direction;
  if (next < 0 || next >= actionOrder.length) return;
  [actionOrder[index], actionOrder[next]] = [
    actionOrder[next],
    actionOrder[index],
  ];
  renderOrder(item.dataset.action, direction);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!ensureAccess() || finished) return;
  const step = SELENIUM_STEPS[session.step];
  const data = new FormData(form);
  const answer =
    step.kind === "order"
      ? actionOrder
      : step.kind === "choice"
        ? data.get("answer")
        : Object.fromEntries(data);
  const result = answerSeleniumStep(session, answer);
  session = result.session;
  feedback(
    result.feedback +
      (result.points === undefined
        ? ""
        : ` +${pointsText(result.points)} pontos.`),
    result.correct,
  );
  if (result.correct) {
    get("sel-fieldset").disabled = true;
    get("sel-check").disabled = true;
    get("sel-counterexample").disabled = step.id === "checks";
    get("sel-next").hidden = false;
    get("sel-next").focus();
  }
  renderProgress();
});

get("sel-counterexample").addEventListener("click", () => {
  if (!ensureAccess() || finished) return;
  session = runSeleniumCounterexample(session);
  if (!session.counterexample) return;
  const found = session.counterexample;
  get("sel-counterexample-result").hidden = false;
  get("sel-counterexample-result").textContent =
    `${found.result.message}; desconto ${found.result.discount}; total ${found.result.total}. ` +
    `Mensagem correta: ${found.messagePass ? "sim" : "não"}. ` +
    `Desconto correto: ${found.discountPass ? "sim" : "não"}. ` +
    `Total correto: ${found.totalPass ? "sim" : "não"}.`;
  feedback(
    "Contraprova observada. Agora selecione verificações que detectem a divergência.",
  );
});

get("sel-run-controls").replaceChildren(
  ...SELENIUM_PROFILES.map((profile) => {
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

get("sel-run-controls").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-run]");
  if (!button || !ensureAccess() || finished) return;
  const updated = recordSeleniumRun(session, button.dataset.run);
  if (updated === session) return;
  session = updated;
  get("sel-evidence-panel").hidden = false;
  get("sel-evidence").replaceChildren(
    ...Object.values(session.runs).map(evidenceNode),
  );
  button.disabled = true;
  feedback(
    session.runs[button.dataset.run].observed +
      (SELENIUM_PROFILES.every((profile) => session.runs[profile.id])
        ? " Três evidências disponíveis: classifique os resultados."
        : " Simule também os outros perfis."),
  );
});

get("sel-preview-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const valid =
    get("coupon-code").value.trim().toUpperCase() === SELENIUM_CASE.coupon;
  const result = get("sel-preview-result");
  result.dataset.state = "ready";
  result.querySelector('[data-testid="coupon-message"]').textContent = valid
    ? SELENIUM_CASE.message
    : "Cupom não encontrado";
  result.querySelector('[data-testid="coupon-discount"]').textContent = valid
    ? SELENIUM_CASE.discount
    : "R$ 0,00";
  result.querySelector('[data-testid="coupon-total"]').textContent = valid
    ? SELENIUM_CASE.total
    : SELENIUM_CASE.subtotal;
});

get("sel-next").addEventListener("click", () => {
  if (!ensureAccess() || finished) return;
  if (!isSeleniumComplete(session)) {
    const updated = advanceSeleniumStep(session);
    if (updated !== session) {
      session = updated;
      renderStep();
    }
    return;
  }
  const rawScore = seleniumScore(session);
  const earnedXp = Math.round(rawScore);
  let saved;
  try {
    saved = progress.saveMissionResult(SELENIUM_MISSION_ID, earnedXp);
  } catch (error) {
    feedback(error.message || "Não foi possível salvar. Tente novamente.");
    return;
  }
  finished = true;
  get("sel-workspace").hidden = true;
  get("sel-result").hidden = false;
  get("sel-result-xp").textContent = earnedXp + " XP";
  get("sel-rounding").textContent =
    `${pointsText(rawScore)} pontos na rodada → ${earnedXp} XP registrados. O total só é arredondado ao salvar.`;
  get("sel-result-summary").textContent =
    `Melhor resultado: ${saved.bestXp} XP · Tentativas concluídas: ${saved.attempts} · XP compartilhado: ${saved.totalXp}.`;
  get("sel-result-records").replaceChildren(
    ...SELENIUM_STEPS.map((step) =>
      node(
        "li",
        `${step.title}: ${pointsText(session.awards[step.id])} de ${step.points} pontos. ${step.feedback}`,
      ),
    ),
  );
  get("sel-result-evidence").replaceChildren(
    ...Object.values(session.runs).map(evidenceNode),
  );
  saveStatus.show(saved);
  enterSection(get("sel-result-title"), get("sel-result"));
});

get("sel-restart").addEventListener("click", () => {
  if (!ensureAccess()) return;
  session = createSeleniumSession();
  actionOrder = ["assert", "click", "find", "wait", "fill"];
  finished = false;
  get("sel-result").hidden = true;
  get("sel-workspace").hidden = false;
  get("sel-result").querySelector("details").open = false;
  for (const id of [
    "sel-evidence",
    "sel-result-evidence",
    "sel-result-records",
  ])
    get(id).replaceChildren();
  get("sel-evidence-panel").hidden = true;
  get("sel-counterexample-result").textContent = "";
  get("sel-counterexample").disabled = false;
  get("sel-run-controls")
    .querySelectorAll("button")
    .forEach((button) => {
      button.disabled = false;
    });
  get("sel-preview-form").reset();
  get("sel-preview-result").dataset.state = "idle";
  get("sel-preview-result").querySelector(
    '[data-testid="coupon-message"]',
  ).textContent = "Aguardando cupom";
  get("sel-preview-result").querySelector(
    '[data-testid="coupon-discount"]',
  ).textContent = "R$ 0,00";
  get("sel-preview-result").querySelector(
    '[data-testid="coupon-total"]',
  ).textContent = SELENIUM_CASE.subtotal;
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

get("sel-fragile-code").textContent = buildFragileSeleniumCode();
renderStep(false);
ensureAccess();
