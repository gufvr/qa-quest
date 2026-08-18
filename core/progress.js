// Global progress state, independent from page interfaces.
(function initializeProgress(global) {
  const STORAGE_KEY = "qa-quest-progress";
  const CURRENT_VERSION = 1;
  const MAX_XP_PER_PHASE = 100;
  const phaseNumbers = { phase1: 1, phase2: 2, phase3: 3, phase4: 4 };

  function createInitialState() {
    return {
      version: CURRENT_VERSION,
      totalXp: 0,
      unlockedPhase: 1,
      missions: {}
    };
  }

  let memoryState = createInitialState();

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clampXp(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.min(MAX_XP_PER_PHASE, Math.max(0, Math.round(number)));
  }

  function normalizeMission(mission) {
    if (!mission || typeof mission !== "object") return null;

    return {
      completed: Boolean(mission.completed),
      bestXp: clampXp(mission.bestXp),
      attempts: Math.max(0, Math.round(Number(mission.attempts) || 0)),
      lastCompletedAt: typeof mission.lastCompletedAt === "string" ? mission.lastCompletedAt : null
    };
  }

  function normalizeState(value) {
    const initial = createInitialState();
    if (!value || typeof value !== "object") return initial;

    const missions = {};
    Object.entries(value.missions || {}).forEach(([missionId, mission]) => {
      const normalized = normalizeMission(mission);
      if (normalized && phaseNumbers[missionId]) missions[missionId] = normalized;
    });

    const totalXp = Object.values(missions).reduce((total, mission) => total + mission.bestXp, 0);
    const completedPhases = Object.entries(missions)
      .filter(([, mission]) => mission.completed)
      .map(([missionId]) => phaseNumbers[missionId]);
    const highestCompleted = completedPhases.length ? Math.max(...completedPhases) : 0;

    return {
      version: CURRENT_VERSION,
      totalXp,
      unlockedPhase: Math.max(1, Math.min(5, Math.max(Number(value.unlockedPhase) || 1, highestCompleted + 1))),
      missions
    };
  }

  function readState() {
    try {
      const stored = global.localStorage.getItem(STORAGE_KEY);
      if (!stored) return clone(memoryState);
      const normalized = normalizeState(JSON.parse(stored));
      memoryState = normalized;
      return clone(normalized);
    } catch (error) {
      return clone(memoryState);
    }
  }

  function writeState(state) {
    const normalized = normalizeState(state);
    memoryState = normalized;

    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (error) {
      // Keeps progress in memory when browser storage is unavailable.
    }

    return clone(normalized);
  }

  function saveMissionResult(missionId, earnedXp) {
    const phaseNumber = phaseNumbers[missionId];
    if (!phaseNumber) throw new Error(`Missão desconhecida: ${missionId}`);

    const state = readState();
    const previous = normalizeMission(state.missions[missionId]) || {
      completed: false,
      bestXp: 0,
      attempts: 0,
      lastCompletedAt: null
    };
    const bestXp = Math.max(previous.bestXp, clampXp(earnedXp));
    const gainedXp = bestXp - previous.bestXp;

    state.missions[missionId] = {
      completed: true,
      bestXp,
      attempts: previous.attempts + 1,
      lastCompletedAt: new Date().toISOString()
    };
    state.unlockedPhase = Math.max(state.unlockedPhase, phaseNumber + 1);

    const savedState = writeState(state);

    try {
      global.dispatchEvent(new CustomEvent("qaquest:progress", { detail: clone(savedState) }));
    } catch (error) {
      // The event is only a convenience for pages running in limited contexts.
    }

    return {
      gainedXp,
      bestXp,
      attempts: savedState.missions[missionId].attempts,
      totalXp: savedState.totalXp,
      unlockedPhase: savedState.unlockedPhase
    };
  }

  function isPhaseUnlocked(phaseNumber) {
    return readState().unlockedPhase >= phaseNumber;
  }

  function getMission(missionId) {
    return readState().missions[missionId] || null;
  }

  global.QAQuestProgress = Object.freeze({
    storageKey: STORAGE_KEY,
    getState: readState,
    getMission,
    isPhaseUnlocked,
    saveMissionResult
  });
})(window);
