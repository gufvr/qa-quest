// Deterministic teaching fixtures, not measurements of this browser or a live site.
const WINDOW_SECONDS = 60;
const LIMITS = Object.freeze({ users: 300, mean: 2, p95: 3, errorRate: 1 });
const SAMPLES = Object.freeze([
  Object.freeze({ users: 100, requests: 6000, errors: 6, mean: 0.65, p95: 1.2 }),
  Object.freeze({ users: 300, requests: 18000, errors: 90, mean: 1.4, p95: 2.6 }),
  Object.freeze({ users: 600, requests: 24000, errors: 1920, mean: 3.8, p95: 6.5 })
]);
const progress = window.QAQuestProgress;
const get = id => document.getElementById(id);
const saveStatus = document.querySelector("qa-save-status");
const number = value => value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
const errorRate = sample => sample.errors / sample.requests * 100;
const isStress = sample => sample.users > LIMITS.users;
const withinLimits = sample => sample.mean <= LIMITS.mean && sample.p95 <= LIMITS.p95 && errorRate(sample) < LIMITS.errorRate;
const correctClassification = sample => isStress(sample) ? "stress" : withinLimits(sample) ? "meets" : "reject";
const classificationLabel = sample => isStress(sample) ? "Estresse: investigar degradação" : "Carga: critérios atendidos";

function initialState() {
  return { step: 0, planning: new Map(), executed: new Set(), records: new Map(),
    mistakes: new Set(), reviewPoints: { decision: 0, reason: 0 }, finished: false };
}
let state = initialState();
const currentSample = () => SAMPLES[state.step];
const score = () => [...state.planning.values()].reduce((sum, points) => sum + points, 0) +
  state.executed.size * 10 + [...state.records.values()].reduce((sum, points) => sum + points, 0) +
  state.reviewPoints.decision + state.reviewPoints.reason;

function feedback(id, text) {
  get(id).textContent = text;
  get(id).hidden = !text;
}

function ensureAccess() {
  const unlocked = progress.isTracksUnlocked();
  get("performance-locked").hidden = unlocked;
  get("performance-content").hidden = !unlocked;
  if (!unlocked) {
    const phase4Available = progress.isPhaseUnlocked(4);
    get("performance-locked-link").href = phase4Available ? "phase4.html" : "index.html";
    get("performance-locked-link").textContent = phase4Available ? "Continuar Fase 4" : "Voltar à jornada";
  }
  return unlocked;
}

function canWork() {
  return ensureAccess() && !state.finished && state.planning.size === 2;
}

function observation(sample) {
  return number(sample.requests) + " requisições em " + WINDOW_SECONDS + " s (" +
    number(sample.requests / WINDOW_SECONDS) + " req/s); média " + number(sample.mean) +
    " s; p95 " + number(sample.p95) + " s; " + number(sample.errors) + " erros (" +
    number(errorRate(sample)) + "%).";
}

function expected(sample) {
  return isStress(sample)
    ? "Observar se há degradação acima da carga prevista. Usar média ≤ 2 s, p95 ≤ 3 s e erros < 1% como referência, sem promessa de aprovação para 600 usuários."
    : "Neste patamar até 300 usuários: média ≤ 2 s, p95 ≤ 3 s e erros < 1%, simultaneamente.";
}

function impact(sample) {
  return isStress(sample)
    ? "Buscas e filtros demoram mais; 1.920 requisições retornam HTTP 503. O cliente pode esperar ou precisar tentar novamente. De 300 para 600 usuários, o volume sobe de 18.000 para 24.000 requisições, sem acompanhar proporcionalmente o aumento de usuários."
    : "Buscas e filtros respondem dentro dos limites combinados. Há " + number(sample.errors) +
      " respostas com erro nesta janela, abaixo de 1%; atender ao limite não significa ausência de falhas.";
}

function interpretation(sample) {
  return isStress(sample)
    ? "Os limites de referência foram ultrapassados em 600 usuários. Investigue a degradação e a capacidade; isso não reprova automaticamente os resultados até 300. Não se determinou a capacidade máxima nem a causa raiz."
    : "Média, p95 e erros atendem juntos aos critérios neste patamar de carga. A quantidade de requisições, sozinha, não determina aprovação.";
}

function evidence(index) {
  const sample = SAMPLES[index], item = document.createElement("details");
  const classified = state.records.has(index);
  item.className = "performance-evidence-item";
  item.dataset.stress = String(isStress(sample));
  const title = document.createElement("summary");
  title.textContent = sample.users + " usuários · " + (classified ? classificationLabel(sample) : "Interpretação pendente");
  item.append(title);
  for (const [label, text] of [
    ["Carga aplicada", sample.users + " usuários simultâneos · " + WINDOW_SECONDS + " s simulados · 70% buscas / 30% filtros"],
    ["Esperado", expected(sample)], ["Observado", observation(sample)], ["Impacto", impact(sample)],
    ["Interpretação", classified ? interpretation(sample) : "Compare as três métricas aos limites e considere se este patamar é carga prevista ou estresse."]
  ]) {
    const paragraph = document.createElement("p"), strong = document.createElement("b");
    strong.textContent = label + ": ";
    paragraph.append(strong, document.createTextNode(text)); item.append(paragraph);
  }
  return item;
}

function renderReport() {
  const executed = [...state.executed].sort((a, b) => a - b);
  get("performance-report-empty").hidden = executed.length > 0;
  get("performance-chart").hidden = executed.length === 0;
  get("performance-chart-rows").replaceChildren(...executed.map(index => {
    const sample = SAMPLES[index], item = document.createElement("li");
    const label = document.createElement("span"), track = document.createElement("span"), fill = document.createElement("i"), value = document.createElement("strong");
    label.textContent = sample.users + " usuários";
    track.className = "performance-chart-track";
    track.setAttribute("aria-hidden", "true");
    fill.style.width = sample.p95 / 8 * 100 + "%";
    item.dataset.stress = String(isStress(sample));
    track.append(fill); value.textContent = number(sample.p95) + " s";
    item.append(label, track, value); return item;
  }));
  get("performance-evidence").replaceChildren(...executed.map(evidence));
}

function renderProgress() {
  get("header-xp").textContent = String(score());
  get("performance-count").textContent = state.records.size + " / 3";
  get("performance-progress").setAttribute("aria-valuenow", String(state.records.size));
  get("performance-bar").style.width = state.records.size / SAMPLES.length * 100 + "%";
  get("performance-steps").replaceChildren(...SAMPLES.map((sample, index) => {
    const item = document.createElement("li"), title = document.createElement("strong"), status = document.createElement("small");
    title.textContent = sample.users + " usuários · " + (isStress(sample) ? "Estresse" : "Carga");
    status.textContent = state.records.has(index) ? "✓ " + classificationLabel(sample) :
      state.executed.has(index) ? "Classifique a evidência" : index === state.step ? "Próxima execução" : "Aguardando";
    if (index === state.step) item.setAttribute("aria-current", "step");
    item.append(title, status); return item;
  }));
  renderReport();
}

function renderMetrics(sample) {
  get("performance-metrics").replaceChildren(...[
    ["Usuários simultâneos", number(sample.users)],
    ["Requisições / 60 s", number(sample.requests) + " · " + number(sample.requests / WINDOW_SECONDS) + " req/s"],
    ["Tempo médio", number(sample.mean) + " s"],
    ["Percentil 95", number(sample.p95) + " s"],
    ["Taxa de erros", number(errorRate(sample)) + "% · " + number(sample.errors) + " erros"]
  ].map(([label, value]) => {
    const item = document.createElement("div"), term = document.createElement("dt"), description = document.createElement("dd");
    term.textContent = label; description.textContent = value; item.append(term, description); return item;
  }));
  get("performance-store-status").textContent = isStress(sample)
    ? "Respostas lentas e HTTP 503 em 8% das requisições simuladas. p95: 6,5 s."
    : "Mochila Urbana · R$ 189,90 · Busca e filtro respondem. p95: " + number(sample.p95) + " s.";
  get("performance-store-status").dataset.stress = String(isStress(sample));
  get("performance-observed").textContent = observation(sample);
}

function renderStep(focus = true) {
  const sample = currentSample(), executed = state.executed.has(state.step), recorded = state.records.has(state.step);
  get("performance-stage-label").textContent = "CHECKPOINT 0" + (state.step + 1) + " · " + (isStress(sample) ? "ESTRESSE" : "CARGA");
  get("performance-run-title").textContent = "Simular " + sample.users + " usuários";
  get("performance-stage-description").textContent = isStress(sample)
    ? "Agora ultrapasse a previsão de 300 usuários. Observe a degradação usando os limites como referência para investigação."
    : "Execute uma janela simulada de 60 segundos e compare média, p95 e erros aos critérios da campanha.";
  get("performance-profile").disabled = state.executed.size > 0;
  get("run-performance").disabled = executed || !get("performance-profile").checked;
  get("run-performance").textContent = executed ? "Patamar executado · +10 XP" : "Simular " + sample.users + " usuários";
  get("performance-sample").hidden = !executed;
  get("performance-classification").querySelectorAll("input, button").forEach(control => { control.disabled = recorded; });
  feedback("performance-classification-feedback", recorded
    ? interpretation(sample) + " +" + state.records.get(state.step) + " XP pela classificação." : "");
  get("next-performance").hidden = !recorded;
  get("next-performance").textContent = state.step === SAMPLES.length - 1 ? "Emitir parecer →" : "Próximo patamar →";
  if (executed) renderMetrics(sample);
  renderProgress();
  if (focus) get("performance-run-title").focus();
}

function initializeMission() {
  for (const [id, field, correct, success, correction] of [
    ["performance-question", "question", "capacity", "Pergunta definida: desempenho da busca e do filtro sob a carga prevista.",
      "A campanha pergunta sobre resposta e erros sob uso simultâneo. A correção isolada é Sanidade; a compra de ponta a ponta é E2E."],
    ["performance-criteria", "criteria", "all", "Critérios definidos em conjunto: média ≤ 2 s, p95 ≤ 3 s e erros < 1%.",
      "A média pode esconder respostas lentas, e alto volume pode incluir muitos erros. Use média, p95 e taxa de erros juntos nos patamares até 300 usuários."]
  ]) {
    get(id).addEventListener("submit", event => {
      event.preventDefault();
      if (!ensureAccess() || state.finished || state.planning.has(field) || (field === "criteria" && !state.planning.has("question"))) return;
      const answer = new FormData(get(id)).get(field);
      if (!answer) return;
      if (answer !== correct) {
        state.mistakes.add(field);
        feedback(id + "-feedback", correction + " Corrija para ganhar 5 XP neste item."); return;
      }
      const points = state.mistakes.has(field) ? 5 : 10;
      state.planning.set(field, points);
      get(id).querySelectorAll("input, button").forEach(control => { control.disabled = true; });
      feedback(id + "-feedback", success + " +" + points + " XP.");
      get("header-xp").textContent = String(score());
      if (field === "question") {
        get("performance-criteria").hidden = false; get("performance-criteria-title").focus();
      } else {
        get("performance-planning").hidden = true;
        get("performance-workspace").hidden = false; renderStep();
      }
    });
  }
  get("performance-profile").addEventListener("change", () => {
    if (canWork()) get("run-performance").disabled = !get("performance-profile").checked || state.executed.has(state.step);
  });
  get("run-performance").addEventListener("click", () => {
    if (!canWork() || !get("performance-profile").checked || state.executed.has(state.step)) return;
    state.executed.add(state.step); renderStep(false);
    get("performance-classification").querySelector("input").focus();
  });
  get("performance-classification").addEventListener("submit", event => {
    event.preventDefault();
    if (!canWork() || !state.executed.has(state.step) || state.records.has(state.step)) return;
    const answer = new FormData(get("performance-classification")).get("classification");
    if (!answer) return;
    const sample = currentSample(), mistakeKey = "sample-" + state.step;
    if (answer !== correctClassification(sample)) {
      state.mistakes.add(mistakeKey);
      feedback("performance-classification-feedback", interpretation(sample) + " Corrija sua interpretação para ganhar 5 XP."); return;
    }
    state.records.set(state.step, state.mistakes.has(mistakeKey) ? 5 : 10);
    renderStep(false); get("next-performance").focus();
  });
  get("next-performance").addEventListener("click", () => {
    if (!canWork() || !state.records.has(state.step)) return;
    if (state.step < SAMPLES.length - 1) {
      state.step++;
      get("performance-classification").reset(); renderStep();
    } else {
      get("performance-review-panel").hidden = false;
      get("next-performance").hidden = true;
      get("performance-review-title").focus();
    }
  });
  get("performance-review").addEventListener("submit", event => {
    event.preventDefault();
    if (!canWork() || state.records.size !== SAMPLES.length || get("performance-review-panel").hidden) return;
    const data = new FormData(get("performance-review")), decision = data.get("decision"), reason = data.get("reason");
    if (!decision || !reason) return;
    for (const [key, answer, correct] of [["decision", decision, "scoped"], ["reason", reason, "metrics"]]) {
      if (answer !== correct) state.mistakes.add(key);
      state.reviewPoints[key] = answer === correct ? state.mistakes.has(key) ? 5 : 10 : 0;
    }
    get("header-xp").textContent = String(score());
    if (decision !== "scoped" || reason !== "metrics") {
      feedback("performance-review-feedback",
        "Em 100 e 300 usuários, média, p95 e erros atendem aos critérios. Em 600, há degradação de estresse para investigar, sem reprovar a carga prevista. Smoke observa disponibilidade essencial; Sanidade, uma correção; Regressão, comportamentos conhecidos; E2E, uma jornada integrada. Nenhum deles, sozinho, comprova capacidade sob esta carga. O parecer aprova apenas o escopo de carga testado; produção ainda depende de ambiente, riscos e negócio. Cada item corrigido vale 5 XP.");
      return;
    }
    let saved;
    try { saved = progress.saveMissionResult("performance", score()); }
    catch { feedback("performance-review-feedback", "Não foi possível salvar. Confira a conclusão da Fase 4 e tente novamente."); return; }
    state.finished = true;
    get("performance-workspace").hidden = true;
    get("performance-result").hidden = false;
    get("performance-result-xp").textContent = score() + " XP";
    get("performance-result-summary").textContent = "Missão concluída pela interpretação correta. Melhor resultado: " + saved.bestXp +
      " XP · Tentativas concluídas: " + saved.attempts + " · XP compartilhado: " + saved.totalXp + ".";
    get("performance-result-evidence").replaceChildren(...SAMPLES.map((_, index) => evidence(index)));
    saveStatus.show(saved); get("performance-result-title").focus();
  });
  get("restart-performance").addEventListener("click", () => {
    if (!ensureAccess()) return;
    state = initialState();
    document.querySelectorAll(".performance-page main form").forEach(form => {
      form.reset(); form.querySelectorAll("input, button").forEach(control => { control.disabled = false; });
    });
    get("performance-profile").checked = false; get("performance-profile").disabled = false;
    for (const id of ["performance-criteria", "performance-workspace", "performance-review-panel", "performance-result"]) get(id).hidden = true;
    for (const id of ["performance-question-feedback", "performance-criteria-feedback", "performance-classification-feedback", "performance-review-feedback"]) feedback(id, "");
    get("performance-planning").hidden = false;
    get("performance-result-evidence").replaceChildren();
    get("performance-result").querySelector("details").open = false;
    saveStatus.reset(); renderStep(false);
    get("performance-question").querySelector("input").focus();
  });
  renderProgress();
}
if (ensureAccess()) initializeMission();
