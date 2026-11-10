import { initializeLegacyHomeRedirect } from "../core/legacy-home-redirect.js";
import "../components/activity-streak.js";
import { initializeSitePage } from "../core/site-page.js";
import {
  getCompletedUniqueMissions,
  journeyGroups,
  learningTracks,
  uniqueMissions,
} from "../core/content-catalog.js";
import { createHomeInsightController } from "../core/home-insight-controller.js";
import { renderHomeInsight } from "../components/home-insight.js";

const get = (id) => document.getElementById(id);
let lastAnnouncement = "";

function updateLevel(state) {
  const level = Math.floor(state.totalXp / 500) + 1;
  const levelXp = state.totalXp % 500;
  const percentage = (levelXp / 500) * 100;
  get("total-xp-label").textContent = `${levelXp} / 500 XP`;
  get("total-xp-progress").classList.toggle("progress--empty", levelXp === 0);
  get("total-xp-progress").setAttribute("aria-valuenow", String(levelXp));
  get("total-xp-progress").setAttribute(
    "aria-label",
    `Progresso do nível: ${levelXp} de 500 XP`,
  );
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
    const recommendedRoute = "tracks.html";
    context.textContent = "JORNADA ATUAL CONCLUÍDA";
    title.textContent = "Todo o conteúdo disponível foi explorado";
    description.textContent =
      "Você pode escolher uma trilha no hub ou revisitar uma missão concluída.";
    status.textContent = "Continue praticando no seu ritmo";
    link.href = recommendedRoute;
    link.innerHTML = 'Abrir hub <span aria-hidden="true">→</span>';
    bottomTitle.textContent =
      "Revisite uma missão ou escolha sua próxima prática.";
    return;
  }

  const group = journeyGroups.find(
    (entry) => entry.id === recommendation.groupId,
  );
  context.textContent =
    recommendation.type === "phase"
      ? `FASE ${String(recommendation.phase).padStart(2, "0")} · BASE COMUM`
      : `TRILHA ${String(group.index).padStart(2, "0")} · ${group.title.toUpperCase()}`;
  title.textContent = recommendation.title;
  description.textContent = recommendation.description;
  status.textContent =
    recommendation.type === "phase"
      ? "Avance pela sequência guiada"
      : state.selectedTrack === recommendation.groupId
        ? "Prioridade da trilha escolhida"
        : "Próxima prática recomendada";
  link.href = recommendation.route;
  link.innerHTML = 'Continuar <span aria-hidden="true">→</span>';
  bottomTitle.textContent = `${recommendation.title} está esperando por você.`;
}

if (!initializeLegacyHomeRedirect()) {
  const insight = createHomeInsightController({
    getState: () => window.QAQuestProgress.getState(),
    render: (message) => renderHomeInsight(get("home-insight"), message),
    canRender: () => !get("home-insight").contains(document.activeElement),
  });

  get("home-insight").addEventListener("focusout", () =>
    queueMicrotask(insight.refresh),
  );
  initializeSitePage((state, { announce, recommendation }) => {
    insight.update(state, recommendation);
    updateLevel(state);
    updateRecommendation(state, recommendation);
    get("catalog-mission-count").textContent = String(uniqueMissions.length);
    get("catalog-track-count").textContent = String(learningTracks.length);
    get("catalog-completed-count").textContent = String(
      getCompletedUniqueMissions(state).length,
    );
    const message = recommendation
      ? `Próxima missão recomendada: ${recommendation.title}.`
      : "Todo o conteúdo disponível foi concluído.";
    if (announce && message !== lastAnnouncement)
      get("home-live-status").textContent = message;
    lastAnnouncement = message;
  });
}
