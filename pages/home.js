// Comportamentos exclusivos da página inicial.
const startButtons = document.querySelectorAll("[data-start]");
const phaseNodes = document.querySelectorAll("[data-phase]");
const totalXpLabel = document.querySelector("#total-xp-label");
const totalXpProgress = document.querySelector("#total-xp-progress");
const totalXpProgressBar = document.querySelector("#total-xp-progress-bar");
const levelBadge = document.querySelector("#level-badge");
const currentMissionTitle = document.querySelector("#current-mission-title");
const toast = document.querySelector("qa-toast");
const routes = { 1: "missao.html", 2: "fase2.html", 3: "fase3.html" };
const titles = { 1: "Fundamentos de QA", 2: "Análise de Requisitos", 3: "Simulador de Login" };
let currentPhase = 1;

function showLockedMessage(phaseNumber) {
  toast.show(
    `Fase ${phaseNumber} bloqueada`,
    `Conclua a Fase ${phaseNumber - 1} para continuar sua jornada.`
  );
}

function applySavedProgress() {
  const state = window.QAQuestProgress.getState();
  const level = Math.floor(state.totalXp / 500) + 1;
  const levelXp = state.totalXp % 500;
  const levelPercentage = (levelXp / 500) * 100;
  const incompletePhase = [1, 2, 3].find((phaseNumber) => {
    const mission = state.missions[`phase${phaseNumber}`];
    return state.unlockedPhase >= phaseNumber && !mission?.completed;
  });

  currentPhase = incompletePhase || Math.min(3, state.unlockedPhase);
  totalXpLabel.textContent = `${levelXp} / 500 XP`;
  totalXpProgress.classList.toggle("progress--empty", levelXp === 0);
  totalXpProgress.setAttribute("aria-valuenow", String(levelXp));
  totalXpProgress.setAttribute("aria-label", `Progresso do nível: ${levelXp} de 500 XP`);
  totalXpProgressBar.style.width = `${levelPercentage}%`;
  levelBadge.textContent = `NV. ${String(level).padStart(2, "0")}`;
  levelBadge.setAttribute("aria-label", `Nível ${level}`);
  currentMissionTitle.textContent = state.missions.phase3?.completed
    ? "Jornada atual concluída"
    : titles[currentPhase];

  phaseNodes.forEach((node) => {
    const phaseNumber = Number(node.dataset.phase);
    const mission = state.missions[`phase${phaseNumber}`];
    const isCompleted = Boolean(mission?.completed);
    const isUnlocked = state.unlockedPhase >= phaseNumber;
    const isCurrent = phaseNumber === currentPhase && !isCompleted;
    const icon = node.querySelector(".path-node__icon");
    const status = node.querySelector("[data-phase-status]");

    node.classList.remove("path-node--active", "path-node--available", "path-node--locked", "path-node--done");
    node.onclick = null;

    if (isCompleted) {
      node.classList.add("path-node--done");
      node.href = routes[phaseNumber];
      node.removeAttribute("aria-disabled");
      icon.textContent = "✓";
      status.textContent = `${mission.bestXp} XP`;
    } else if (isUnlocked) {
      node.classList.add(isCurrent ? "path-node--active" : "path-node--available");
      node.href = routes[phaseNumber];
      node.removeAttribute("aria-disabled");
      icon.textContent = isCurrent ? "◆" : "◇";
      status.textContent = isCurrent ? "ATUAL" : "ABERTA";
    } else {
      node.classList.add("path-node--locked");
      node.removeAttribute("href");
      node.setAttribute("aria-disabled", "true");
      icon.textContent = "◇";
      status.textContent = "BLOQ.";
      node.onclick = (event) => {
        event.preventDefault();
        showLockedMessage(phaseNumber);
      };
    }
  });
}

applySavedProgress();

startButtons.forEach((button) => {
  button.addEventListener("click", () => {
    window.location.href = routes[currentPhase];
  });
});
