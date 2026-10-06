// Track hub: the base phases remain shared, while each track has its own progress.
const tracks = {
  release: {
    label: "TRILHA 01 · CONFIANÇA NA RELEASE",
    title: "Confiança na release",
    objective: "Aprenda a avaliar se uma entrega está estável, se a correção resolveu o defeito e se funcionalidades antigas continuam funcionando.",
    prerequisite: "Concluir as Fases 1–4.",
    order: "Smoke → Sanidade → Regressão. A sequência ajuda a ir da checagem rápida à proteção mais ampla.",
    modules: [
      { id: "smoke", title: "Smoke Test", detail: "Verificações essenciais para decidir se vale continuar a testar." },
      { id: "sanity", title: "Teste de Sanidade", detail: "Validação focada após uma correção ou mudança específica." },
      { id: "regression", title: "Teste de Regressão", detail: "Confirmação de que fluxos existentes seguem funcionando." }
    ]
  },
  flows: {
    label: "TRILHA 02 · FLUXOS E INVESTIGAÇÃO",
    title: "Fluxos e investigação",
    objective: "Passe da validação de uma funcionalidade à descoberta de comportamentos inesperados e à verificação de jornadas de ponta a ponta.",
    prerequisite: "Concluir as Fases 1–4. A Fase 3 já introduz testes funcionais.",
    order: "Funcional → Exploratório → E2E, aproveitando o simulador da Fase 3 como primeiro contato.",
    modules: [
      { id: "functional", title: "Teste Funcional", detail: "Introduzido no simulador de login da Fase 3.", href: "phase3.html" },
      { id: "exploratory", title: "Teste Exploratório", detail: "Investigação guiada por hipóteses, observação e aprendizado." },
      { id: "e2e", title: "Teste End-to-End (E2E)", detail: "Validação de uma jornada completa entre telas e serviços." }
    ]
  },
  specialized: {
    label: "TRILHA 03 · QUALIDADE ESPECIALIZADA",
    title: "Qualidade especializada",
    objective: "Conheça perguntas iniciais sobre desempenho e segurança, com foco em riscos e observação antes de ferramentas avançadas.",
    prerequisite: "Concluir as Fases 1–4. Nenhuma das duas especialidades depende da outra.",
    order: "Performance e Segurança podem ser exploradas em qualquer ordem.",
    modules: [
      { id: "performance", title: "Teste de Performance", detail: "Tempo de resposta, carga esperada e sinais de lentidão." },
      { id: "security", title: "Teste de Segurança", detail: "Acesso, proteção de dados e riscos comuns de aplicação." }
    ]
  }
};

const progress = window.QAQuestProgress;
const locked = document.querySelector("#tracks-locked");
const content = document.querySelector("#tracks-content");
const trackButtons = [...document.querySelectorAll("[data-track]")];

function renderModule(module, number, completedModules) {
  const item = document.createElement("li");
  item.className = "track-module";

  const position = document.createElement("span");
  position.className = "track-module__number";
  position.textContent = String(number).padStart(2, "0");

  const copy = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = module.title;
  const detail = document.createElement("p");
  detail.textContent = module.detail;
  copy.append(title, detail);

  const actions = document.createElement("div");
  actions.className = "track-module__actions";
  const status = document.createElement("span");
  status.className = "track-module__status";
  const isComplete = completedModules.includes(module.id);
  status.textContent = isComplete ? "Concluído" : module.href ? "Disponível na Fase 3" : "Missão em breve";
  actions.append(status);

  if (module.href) {
    const link = document.createElement("a");
    link.href = module.href;
    link.textContent = "Revisitar Fase 3 →";
    actions.append(link);
  }

  if (isComplete) item.classList.add("track-module--done");
  item.append(position, copy, actions);
  return item;
}

function renderTrack(trackId) {
  const track = tracks[trackId];
  const trackProgress = progress.getTrackProgress(trackId);
  trackButtons.forEach((button) => {
    const selected = button.dataset.track === trackId;
    button.setAttribute("aria-pressed", String(selected));
    button.classList.toggle("track-card--selected", selected);
  });

  document.querySelector("#track-details-label").textContent = track.label;
  document.querySelector("#track-details-title").textContent = track.title;
  document.querySelector("#track-details-objective").textContent = track.objective;
  document.querySelector("#track-details-prerequisite").textContent = track.prerequisite;
  document.querySelector("#track-details-order").textContent = track.order;
  document.querySelector("#track-details-progress").textContent = `${trackProgress.completed} / ${trackProgress.total}`;
  document.querySelector("#track-modules").replaceChildren(
    ...track.modules.map((module, index) => renderModule(module, index + 1, trackProgress.completedModules))
  );
}

function renderHub() {
  const state = progress.getState();
  if (!progress.isTracksUnlocked()) {
    locked.hidden = false;
    content.hidden = true;
    if (progress.isPhaseUnlocked(4)) {
      const link = document.querySelector("#tracks-locked-link");
      link.href = "phase4.html";
      link.textContent = "Continuar Fase 4";
    }
    return;
  }

  locked.hidden = true;
  content.hidden = false;
  document.querySelector("#tracks-total-xp").textContent = `${state.totalXp} XP`;
  trackButtons.forEach((button) => {
    const trackProgress = progress.getTrackProgress(button.dataset.track);
    button.querySelector("[data-track-count]").textContent = `${trackProgress.completed} / ${trackProgress.total} temas`;
    button.querySelector("[data-track-bar]").style.width = `${trackProgress.percentage}%`;
  });
  renderTrack(state.selectedTrack && tracks[state.selectedTrack] ? state.selectedTrack : "release");
}

trackButtons.forEach((button) => {
  button.addEventListener("click", () => {
    progress.selectTrack(button.dataset.track);
    renderTrack(button.dataset.track);
  });
});

renderHub();
