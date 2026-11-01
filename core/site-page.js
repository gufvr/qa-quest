import "./progress.js";
import "../components/brand.js";
import "../components/theme-toggle.js";
import "../components/header.js";
import "../components/footer.js";
import { initializeHomeHeader, initializeHomeNavigation } from "./home-interactions.js";
import { getRecommendedMission } from "./content-catalog.js";

// Read-only subscribers: rendering a page never awards XP or changes progress.
export function subscribeToProgress(render) {
  const controller = new AbortController();
  const options = { signal: controller.signal };
  let previousState;
  function refresh({ announce = false } = {}) {
    const state = window.QAQuestProgress.getState();
    const serialized = JSON.stringify(state);
    if (serialized === previousState) return;
    previousState = serialized;
    render(state, { announce });
  }
  window.addEventListener("qaquest:progress", () => refresh({ announce: true }), options);
  window.addEventListener("storage", (event) => {
    if (event.key === window.QAQuestProgress.storageKey || event.key === null) refresh({ announce: true });
  }, options);
  window.addEventListener("pageshow", () => refresh(), options);
  window.addEventListener("focus", () => refresh(), options);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refresh();
  }, options);
  refresh();
  return () => controller.abort();
}

export function initializeSitePage(render = () => {}) {
  const unsubscribe = subscribeToProgress((state, options) => {
    const recommendation = getRecommendedMission(state);
    document.querySelectorAll("a[data-start]").forEach((link) => {
      link.href = recommendation?.route || "tracks.html";
      if (link.closest(".site-header")) {
        link.textContent = recommendation ? (state.totalXp ? "Continuar" : "Começar") : "Revisitar";
      }
    });
    render(state, { ...options, recommendation });
  });
  const cleanupHeader = initializeHomeHeader();
  const cleanupNavigation = initializeHomeNavigation();
  return () => {
    unsubscribe();
    cleanupHeader();
    cleanupNavigation();
  };
}
