import "../core/progress.js";
import {
  catalogItems,
  getCompletedUniqueMissions,
  getRecommendedMission,
  isAvailable,
  isCompleted,
  journeyGroups,
  learningTracks,
  uniqueMissions
} from "../core/content-catalog.js";

const progress = window.QAQuestProgress;
const toast = document.querySelector("qa-toast");
const get = (id) => document.getElementById(id);
let recommendedRoute = "phase1.html";
let lastAnnouncement = "";

function groupFor(item) {
  return journeyGroups.find((group) => group.id === item.groupId);
}

function lockedMessage(item) {
  if (item.type === "phase") {
    return {
      title: `Fase ${item.phase} bloqueada`,
      detail: `Conclua a Fase ${item.phase - 1} para continuar sua jornada.`
    };
  }

  return {
    title: "Trilhas bloqueadas",
    detail: "Conclua a Fase 4 para explorar as trilhas de QA."
  };
}

function missionState(item, state, recommendation) {
  if (isCompleted(item, state)) return "done";
  if (!isAvailable(item, state)) return "locked";
  if (recommendation?.progressId === item.progressId) return "current";
  return "available";
}

function stateLabel(item, state, status) {
  if (status === "done") return `${state.missions[item.progressId]?.bestXp || 0} XP`;
  if (status === "current") return "PRÓXIMA";
  if (status === "available") return "DISPONÍVEL";
  return "BLOQUEADA";
}

function createMissionItem(item, group, state, recommendation, index) {
  const status = missionState(item, state, recommendation);
  const listItem = document.createElement("li");
  listItem.className = `journey-mission journey-mission--${status}`;

  const control = document.createElement(status === "locked" ? "button" : "a");
  control.className = "journey-mission__control";
  if (control instanceof HTMLAnchorElement) control.href = item.route;
  else {
    control.type = "button";
    control.dataset.lockedMission = item.id;
    control.setAttribute("aria-disabled", "true");
  }

  const icon = document.createElement("span");
  icon.className = "journey-mission__icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = status === "done" ? "✓" : status === "current" ? "◆" : "◇";

  const copy = document.createElement("span");
  copy.className = "journey-mission__copy";
  const eyebrow = document.createElement("small");
  eyebrow.textContent = item.type === "phase"
    ? `FASE ${String(item.phase).padStart(2, "0")}`
    : `MÓDULO ${String(index + 1).padStart(2, "0")}`;
  const title = document.createElement("strong");
  title.textContent = item.title;
  const description = document.createElement("span");
  description.textContent = item.description;
  copy.append(eyebrow, title, description);

  const badge = document.createElement("span");
  badge.className = "journey-mission__status";
  badge.textContent = stateLabel(item, state, status);

  const accessibleAction = status === "done"
    ? "Revisitar"
    : status === "locked"
      ? "Bloqueada"
      : "Abrir";
  control.setAttribute("aria-label", `${accessibleAction}: ${item.title}, ${group.title}`);
  control.append(icon, copy, badge);
  listItem.append(control);
  return listItem;
}

function createJourneyGroup(group, state, recommendation) {
  const completed = group.items.filter((item) => isCompleted(item, state)).length;
  const unlocked = group.id === "base" || Boolean(state.missions.phase4?.completed);
  const article = document.createElement("article");
  article.className = "journey-group";
  article.dataset.group = group.id;
  article.classList.toggle("journey-group--locked", !unlocked);

  const header = document.createElement("header");
  header.className = "journey-group__header";
  const headingCopy = document.createElement("div");
  const eyebrow = document.createElement("span");
  eyebrow.className = "journey-group__eyebrow";
  eyebrow.textContent = group.id === "base"
    ? "COMECE AQUI"
    : `TRILHA ${String(group.index).padStart(2, "0")}`;
  const title = document.createElement("h3");
  title.textContent = group.title;
  const description = document.createElement("p");
  description.textContent = group.description;
  headingCopy.append(eyebrow, title, description);

  const counter = document.createElement("span");
  counter.className = "journey-group__counter";
  counter.textContent = `${completed} / ${group.items.length}`;
  counter.setAttribute("aria-label", `${completed} de ${group.items.length} concluídas`);
  header.append(headingCopy, counter);

  const meter = document.createElement("div");
  meter.className = "journey-group__progress";
  meter.setAttribute("aria-hidden", "true");
  const meterBar = document.createElement("span");
  meterBar.style.width = `${(completed / group.items.length) * 100}%`;
  meter.append(meterBar);

  const list = document.createElement("ol");
  list.className = "journey-group__missions";
  list.replaceChildren(
    ...group.items.map((item, index) => createMissionItem(item, group, state, recommendation, index))
  );
  article.append(header, meter, list);
  return article;
}

function updateLevel(state) {
  const level = Math.floor(state.totalXp / 500) + 1;
  const levelXp = state.totalXp % 500;
  const percentage = (levelXp / 500) * 100;
  get("total-xp-label").textContent = `${levelXp} / 500 XP`;
  get("total-xp-progress").classList.toggle("progress--empty", levelXp === 0);
  get("total-xp-progress").setAttribute("aria-valuenow", String(levelXp));
  get("total-xp-progress").setAttribute("aria-label", `Progresso do nível: ${levelXp} de 500 XP`);
  get("total-xp-progress-bar").style.width = `${percentage}%`;
  get("level-badge").textContent = `NV. ${String(level).padStart(2, "0")}`;
  get("level-badge").setAttribute("aria-label", `Nível ${level}`);
}

function updateRecommendation(state, recommendation) {
  const title = get("current-mission-title");
  const context = get("current-mission-context");
  const description = get("current-mission-description");
  const status = get("current-mission-status");
  const link = get("current-mission-link");
  const bottomTitle = get("bottom-cta-title");

  if (!recommendation) {
    recommendedRoute = "tracks.html";
    context.textContent = "JORNADA ATUAL CONCLUÍDA";
    title.textContent = "Todo o conteúdo disponível foi explorado";
    description.textContent = "Você pode escolher uma trilha no hub ou revisitar uma missão concluída.";
    status.textContent = "Continue praticando no seu ritmo";
    link.href = recommendedRoute;
    link.innerHTML = "Abrir hub <span aria-hidden=\"true\">→</span>";
    bottomTitle.textContent = "Revisite uma missão ou escolha sua próxima prática.";
    return;
  }

  const group = groupFor(recommendation);
  recommendedRoute = recommendation.route;
  context.textContent = recommendation.type === "phase"
    ? `FASE ${String(recommendation.phase).padStart(2, "0")} · BASE COMUM`
    : `TRILHA ${String(group.index).padStart(2, "0")} · ${group.title.toUpperCase()}`;
  title.textContent = recommendation.title;
  description.textContent = recommendation.description;
  status.textContent = recommendation.type === "phase"
    ? "Avance pela sequência guiada"
    : state.selectedTrack === recommendation.groupId
      ? "Prioridade da trilha escolhida"
      : "Próxima prática recomendada";
  link.href = recommendation.route;
  link.innerHTML = "Continuar <span aria-hidden=\"true\">→</span>";
  bottomTitle.textContent = `${recommendation.title} está esperando por você.`;
}

function updateOverview(state, completedMissions) {
  const total = uniqueMissions.length;
  const completed = completedMissions.length;
  const percentage = total ? (completed / total) * 100 : 0;
  const tracksUnlocked = Boolean(state.missions.phase4?.completed);
  const hubLink = get("tracks-hub-link");

  get("catalog-mission-count").textContent = String(total);
  get("catalog-track-count").textContent = String(learningTracks.length);
  get("catalog-completed-count").textContent = String(completed);
  get("journey-progress-label").textContent = `${completed} de ${total} missões concluídas`;
  get("journey-progress-description").textContent = completed === total
    ? "Todo o conteúdo atual foi concluído. Continue revisitando e praticando."
    : tracksUnlocked
      ? "As trilhas estão abertas e podem ser exploradas de forma independente."
      : "Conclua a base comum para liberar as trilhas práticas.";
  get("journey-progress").setAttribute("aria-valuemax", String(total));
  get("journey-progress").setAttribute("aria-valuenow", String(completed));
  get("journey-progress").setAttribute("aria-label", `${completed} de ${total} missões concluídas`);
  get("journey-progress-bar").style.width = `${percentage}%`;

  hubLink.href = tracksUnlocked ? "tracks.html" : "phase4.html";
  hubLink.classList.toggle("is-locked", !tracksUnlocked);
  hubLink.innerHTML = tracksUnlocked
    ? "Abrir hub de trilhas <span aria-hidden=\"true\">→</span>"
    : "Concluir base para liberar <span aria-hidden=\"true\">→</span>";
}

function updateCompletedList(completedMissions) {
  const list = get("completed-missions-list");
  const empty = get("completed-missions-empty");
  get("completed-missions-count").textContent = String(completedMissions.length);
  empty.hidden = completedMissions.length > 0;

  list.replaceChildren(...completedMissions.map((item) => {
    const listItem = document.createElement("li");
    const link = document.createElement("a");
    const copy = document.createElement("span");
    const title = document.createElement("strong");
    const context = document.createElement("small");
    const action = document.createElement("span");
    link.href = item.route;
    title.textContent = item.title;
    context.textContent = item.type === "phase" ? `Fase ${item.phase} · Base comum` : item.groupTitle;
    action.textContent = "Revisitar →";
    copy.append(title, context);
    link.append(copy, action);
    listItem.append(link);
    return listItem;
  }));
}

function initializeCompletedDetails() {
  const section = get("completed-missions");
  const toggle = get("completed-missions-toggle");
  const panel = get("completed-missions-panel");
  toggle.addEventListener("click", () => {
    const shouldOpen = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(shouldOpen));
    panel.setAttribute("aria-hidden", String(!shouldOpen));
    panel.inert = !shouldOpen;
    section.classList.toggle("is-open", shouldOpen);
  });
}

function renderHome({ announce = false } = {}) {
  const state = progress.getState();
  const recommendation = getRecommendedMission(state);
  const completedMissions = getCompletedUniqueMissions(state);
  updateLevel(state);
  updateRecommendation(state, recommendation);
  updateOverview(state, completedMissions);
  updateCompletedList(completedMissions);
  get("journey-groups").replaceChildren(
    ...journeyGroups.map((group) => createJourneyGroup(group, state, recommendation))
  );

  const message = recommendation
    ? `Próxima missão recomendada: ${recommendation.title}.`
    : "Todo o conteúdo disponível foi concluído.";
  if (announce && message !== lastAnnouncement) get("journey-live-status").textContent = message;
  lastAnnouncement = message;
}

document.addEventListener("click", (event) => {
  const start = event.target.closest("[data-start]");
  if (start) {
    event.preventDefault();
    window.location.href = recommendedRoute;
    return;
  }

  const lockedControl = event.target.closest("[data-locked-mission]");
  if (!lockedControl) return;
  const item = catalogItems.find((candidate) => candidate.id === lockedControl.dataset.lockedMission);
  if (!item) return;
  const message = lockedMessage(item);
  toast.show(message.title, message.detail);
});

window.addEventListener("qaquest:progress", () => renderHome({ announce: true }));
window.addEventListener("storage", (event) => {
  if (event.key === progress.storageKey || event.key === null) renderHome({ announce: true });
});
window.addEventListener("pageshow", () => renderHome());
window.addEventListener("focus", () => renderHome());
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) renderHome();
});

renderHome();
initializeCompletedDetails();
