import "../core/progress.js";
import "../components/brand.js";
import "../components/theme-toggle.js";
import "../components/header.js";
import "../components/footer.js";
import "../components/save-status.js";
import "../components/support-material.js";
import "../components/stepscript-support.js";
import {
  PLAYWRIGHT_MISSION_ID,
  PLAYWRIGHT_STEPS,
  PLAYWRIGHT_ACTIONS,
  PLAYWRIGHT_PROFILES,
  createPlaywrightSession,
  filterPlaywrightCatalog,
  runPlaywrightCounterexample,
  recordPlaywrightRun,
  answerPlaywrightStep,
  advancePlaywrightStep,
  playwrightScore,
  isPlaywrightComplete,
  buildPlaywrightCode,
  buildFragilePlaywrightCode,
} from "../core/playwright-lab.js";

const progress = window.QAQuestProgress;
const get = (id) => document.getElementById(id);
const controls = get("pw-controls"),
  form = get("pw-answer");
const saveStatus = document.querySelector("qa-save-status");
const pointsText = (value) => value.toLocaleString("pt-BR");
let session = createPlaywrightSession(),
  actionOrder = ["apply", "search", "filter"],
  finished = false;

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}

function ensureAccess() {
  const readOnly = progress.isReadOnly(),
    allowed = progress.isTracksUnlocked() && !readOnly;
  get("pw-locked").hidden = allowed;
  get("pw-content").hidden = !allowed;
  get("pw-locked-title").textContent = readOnly
    ? "Atualize o QA Quest antes de salvar."
    : "Conclua a Fase 4 para começar.";
  get("pw-locked-copy").textContent = readOnly
    ? "Este save pertence a uma versão mais recente e não será sobrescrito. A apostila continua acessível."
    : "Nenhuma outra missão, extensão ou ferramenta instalada é obrigatória. A apostila acima é livre.";
  return allowed;
}

function feedback(text = "", correct = false) {
  get("pw-feedback").textContent = text;
  get("pw-feedback").classList.toggle("is-correct", correct);
}

function renderProgress() {
  const completed = Object.keys(session.awards).length;
  get("header-xp").textContent = pointsText(playwrightScore(session));
  get("pw-progress").value = completed;
  get("pw-progress").textContent = `${completed} de 7`;
  get("pw-progress-copy").textContent =
    `Etapa ${session.step + 1} de 7 · ${pointsText(playwrightScore(session))} pontos nesta rodada`;
  get("pw-code").textContent = buildPlaywrightCode(session);
  get("pw-checkpoints").replaceChildren(
    ...PLAYWRIGHT_STEPS.map((step, index) => {
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
  const label = node("label", undefined, "pw-field"),
    input = document.createElement("select");
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
  const list = node("ol", undefined, "pw-order");
  actionOrder.forEach((id, index) => {
    const action = PLAYWRIGHT_ACTIONS.find((item) => item.id === id),
      item = node("li"),
      buttons = node("div", undefined, "pw-move");
    item.dataset.action = id;
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
    const row = controls.querySelector(`[data-action="${focusId}"]`),
      preferred = row.querySelector(`[data-move="${direction}"]`);
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
  const step = PLAYWRIGHT_STEPS[session.step];
  get("pw-step-label").textContent =
    `ETAPA ${session.step + 1} · ATÉ ${step.points} XP`;
  get("pw-step-title").textContent = step.title;
  get("pw-instruction").textContent = step.instruction;
  controls.replaceChildren();
  get("pw-fieldset").disabled = false;
  get("pw-check").disabled = false;
  get("pw-next").hidden = true;
  get("pw-next").textContent =
    session.step === 6 ? "Concluir missão e salvar →" : "Próxima etapa →";
  get("pw-run-controls").hidden = step.kind !== "diagnosis";
  get("pw-counterexample").hidden = step.kind !== "assertions";
  get("pw-counterexample-result").hidden =
    step.kind !== "assertions" || !session.counterexample;
  if (step.kind === "structure") {
    select("Importar test e expect", "imports", [
      ["native", 'import { test, expect } from "@playwright/test";'],
      ["vitest", 'import { test, expect } from "vitest";'],
    ]);
    select("Preparar a visita de cada caso", "setup", [
      ["previous", "Outro teste visita primeiro; este depende dele"],
      [
        "beforeEach",
        'test.beforeEach(async ({ page }) => { await page.goto("/catalog"); });',
      ],
    ]);
    select("Operações assíncronas", "async", [
      ["await", "Funções async e await nas ações e assertions assíncronas"],
      ["sync", "Omitir await: tudo termina imediatamente"],
    ]);
  } else if (step.kind === "locators") {
    select("Categoria: rótulo associado", "category", [
      ["style", 'page.locator(".select-purple")'],
      ["label", 'page.getByLabel("Categoria", { exact: true })'],
    ]);
    select("Busca: tipo e nome acessível", "search", [
      [
        "role",
        'page.getByRole("searchbox", { name: "Buscar produto", exact: true })',
      ],
      ["wrong", 'page.getByRole("button", { name: "Buscar produto" })'],
    ]);
    select("Aplicar: botão com esse nome", "apply", [
      ["position", 'page.locator("button").first()'],
      ["button", 'page.getByRole("button", { name: "Aplicar", exact: true })'],
    ]);
  } else if (step.kind === "order") renderOrder();
  else if (step.kind === "assertions") {
    select("Quantidade na massa conhecida", "count", [
      ["two", "await expect(cards).toHaveCount(2);"],
      ["empty", "Aceitar zero cards se não houver eletrônicos"],
    ]);
    select("Nomes dos produtos", "text", [
      [
        "names",
        'await expect(cards).toContainText(["Mochila Aurora", "Estojo Aurora"]);',
      ],
      ["visible", "Conferir somente que a página está visível"],
    ]);
    select("Categoria", "category", [
      ["first", "Conferir somente o primeiro card"],
      [
        "every",
        'toHaveAttribute("data-category", "accessories") nos dois cards esperados',
      ],
    ]);
  } else if (step.kind === "choice") {
    for (const [value, text] of step.options) {
      const label = node("label", undefined, "pw-choice"),
        input = document.createElement("input");
      input.type = "radio";
      input.name = "answer";
      input.value = value;
      input.required = true;
      label.append(input, node("span", text));
      controls.append(label);
    }
  } else if (step.kind === "diagnosis") {
    const options = [
      ["pass", "Caso atende ao contrato neste escopo"],
      ["product", "Defeito do produto mesmo com lista pronta"],
      ["test", "Falha do teste por leitura prematura"],
    ];
    for (const profile of PLAYWRIGHT_PROFILES)
      select(profile.label, profile.id, options);
  } else {
    select("Isolamento", "isolation", [
      ["state", "Projects ou storageState bastam para garantir independência"],
      [
        "context",
        "Contexto isolado por teste; fixtures e beforeEach preparam estado conhecido",
      ],
    ]);
    select("trace: on-first-retry no projeto real", "trace", [
      ["retry", "Requer retries habilitados; a simulação não gera trace"],
      ["always", "Sempre grava uma execução sem retries nem configuração"],
    ]);
    select("Parecer técnico", "verdict", [
      [
        "return",
        "Devolver a candidata por falha no filtro e revisar o teste frágil",
      ],
      ["production", "Aprovar produção porque a referência passou"],
    ]);
  }
  feedback();
  renderProgress();
  if (focus)
    enterSection(get("pw-step-title"), document.querySelector(".pw-task"));
}

function renderProducts(products) {
  get("pw-products").replaceChildren(
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
    get("pw-products").append(
      node("li", "Nenhum produto para essa combinação."),
    );
}

function evidenceNode(run) {
  const article = node("article", undefined, "pw-evidence-card");
  article.append(
    node(
      "h4",
      PLAYWRIGHT_PROFILES.find((profile) => profile.id === run.profile).label,
    ),
  );
  const timeline = node("ol", undefined, "pw-timeline");
  for (const event of run.trace) {
    const item = node("li"),
      time = node("time", `${event.at} ms · ${event.state}`);
    time.dateTime = `PT${event.at / 1000}S`;
    item.append(time, node("span", event.detail));
    timeline.append(item);
  }
  article.append(timeline);
  for (const [label, text] of [
    ["Esperado", run.expected],
    ["Observado", run.observed],
    ["Impacto", run.impact],
  ]) {
    const paragraph = node("p");
    paragraph.append(
      node("strong", label + ": "),
      document.createTextNode(text),
    );
    article.append(paragraph);
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
  const id = button.closest("[data-action]").dataset.action,
    from = actionOrder.indexOf(id),
    to = from + Number(button.dataset.move);
  if (to < 0 || to >= actionOrder.length) return;
  [actionOrder[from], actionOrder[to]] = [actionOrder[to], actionOrder[from]];
  renderOrder(id, button.dataset.move);
});

get("pw-counterexample").addEventListener("click", () => {
  if (!ensureAccess() || finished) return;
  const updated = runPlaywrightCounterexample(session);
  if (updated === session) return;
  session = updated;
  const result = session.counterexample;
  get("pw-counterexample-result").hidden = false;
  get("pw-counterexample-result").textContent =
    `${result.products.map((product) => product.name).join(" + ")}: quantidade 2 ${result.countPass ? "passou" : "falhou"}; nomes ${result.namesPass ? "passaram" : "falharam"}; categoria ${result.categoryPass ? "passou" : "falhou"}. Contagem sozinha não comprova a regra.`;
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!ensureAccess() || finished) return;
  const step = PLAYWRIGHT_STEPS[session.step],
    data = new FormData(form);
  const answer =
    step.kind === "order"
      ? actionOrder
      : step.kind === "choice"
        ? data.get("answer")
        : Object.fromEntries(data);
  const result = answerPlaywrightStep(session, answer);
  session = result.session;
  feedback(
    result.feedback +
      (result.points === undefined
        ? ""
        : ` +${pointsText(result.points)} pontos.`),
    result.correct,
  );
  if (result.correct) {
    get("pw-fieldset").disabled = true;
    get("pw-check").disabled = true;
    get("pw-counterexample").disabled = step.id === "assertions";
    get("pw-next").hidden = false;
    get("pw-next").focus();
  }
  renderProgress();
});

get("pw-run-controls").replaceChildren(
  ...PLAYWRIGHT_PROFILES.map((profile) => {
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
get("pw-run-controls").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-run]");
  if (!button || !ensureAccess() || finished) return;
  const updated = recordPlaywrightRun(session, button.dataset.run);
  if (updated === session) return;
  session = updated;
  get("pw-evidence-panel").hidden = false;
  get("pw-evidence").replaceChildren(
    ...Object.values(session.runs).map(evidenceNode),
  );
  button.disabled = true;
  feedback(
    session.runs[button.dataset.run].observed +
      (PLAYWRIGHT_PROFILES.every((profile) => session.runs[profile.id])
        ? " Três evidências disponíveis: classifique os resultados."
        : " Simule também os outros perfis."),
  );
});

get("pw-preview-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const products = filterPlaywrightCatalog(
    get("pw-category").value,
    get("pw-search").value,
  );
  renderProducts(products);
  get("pw-preview-state").textContent =
    `Referência interativa · pronta · ${products.length} resultado(s). Sem efeito na pontuação ou nas fixtures.`;
});

get("pw-next").addEventListener("click", () => {
  if (!ensureAccess() || finished) return;
  if (!isPlaywrightComplete(session)) {
    const updated = advancePlaywrightStep(session);
    if (updated !== session) {
      session = updated;
      renderStep();
    }
    return;
  }
  const rawScore = playwrightScore(session),
    earnedXp = Math.round(rawScore);
  let saved;
  try {
    saved = progress.saveMissionResult(PLAYWRIGHT_MISSION_ID, earnedXp);
  } catch (error) {
    feedback(error.message || "Não foi possível salvar. Tente novamente.");
    return;
  }
  finished = true;
  get("pw-workspace").hidden = true;
  get("pw-result").hidden = false;
  get("pw-result-xp").textContent = earnedXp + " XP";
  get("pw-rounding").textContent =
    `${pointsText(rawScore)} pontos na rodada → ${earnedXp} XP registrados. O total só é arredondado ao salvar.`;
  get("pw-result-summary").textContent =
    `Melhor resultado: ${saved.bestXp} XP · Tentativas concluídas: ${saved.attempts} · XP compartilhado: ${saved.totalXp}.`;
  get("pw-result-records").replaceChildren(
    ...PLAYWRIGHT_STEPS.map((step) =>
      node(
        "li",
        `${step.title}: ${pointsText(session.awards[step.id])} de ${step.points} pontos. ${step.feedback}`,
      ),
    ),
  );
  get("pw-result-evidence").replaceChildren(
    ...Object.values(session.runs).map(evidenceNode),
  );
  saveStatus.show(saved);
  enterSection(get("pw-result-title"), get("pw-result"));
});

get("pw-restart").addEventListener("click", () => {
  if (!ensureAccess()) return;
  session = createPlaywrightSession();
  actionOrder = ["apply", "search", "filter"];
  finished = false;
  get("pw-result").hidden = true;
  get("pw-workspace").hidden = false;
  get("pw-result").querySelector("details").open = false;
  for (const id of ["pw-evidence", "pw-result-evidence", "pw-result-records"])
    get(id).replaceChildren();
  get("pw-evidence-panel").hidden = true;
  get("pw-counterexample-result").textContent = "";
  get("pw-counterexample").disabled = false;
  get("pw-run-controls")
    .querySelectorAll("button")
    .forEach((button) => {
      button.disabled = false;
    });
  get("pw-preview-form").reset();
  renderProducts(filterPlaywrightCatalog());
  get("pw-preview-state").textContent =
    "Referência interativa · lista pronta · 3 produtos.";
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
get("pw-fragile-code").textContent = buildFragilePlaywrightCode();
renderProducts(filterPlaywrightCatalog());
get("pw-preview-state").textContent =
  "Referência interativa · lista pronta · 3 produtos.";
renderStep(false);
ensureAccess();
