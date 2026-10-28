// Catálogo único usado pela home para apresentar a jornada disponível.
// Uma nova missão precisa ser registrada apenas aqui para aparecer nos
// contadores, no mapa e na recomendação da página inicial.
export const baseMissions = [
  {
    id: "phase1",
    progressId: "phase1",
    title: "Fundamentos de QA",
    description: "Conceitos essenciais, tipos de teste e decisões do dia a dia.",
    route: "phase1.html",
    type: "phase",
    phase: 1,
    order: 1
  },
  {
    id: "phase2",
    progressId: "phase2",
    title: "Análise de Requisitos",
    description: "Ambiguidades, critérios de aceitação, fluxos e exceções.",
    route: "phase2.html",
    type: "phase",
    phase: 2,
    order: 2
  },
  {
    id: "phase3",
    progressId: "phase3",
    title: "Simulador de Login",
    description: "Primeiro contato prático com testes funcionais.",
    route: "phase3.html",
    type: "phase",
    phase: 3,
    order: 3
  },
  {
    id: "phase4",
    progressId: "phase4",
    title: "Plano de Testes",
    description: "Riscos, escopo, cenários e estratégia para uma entrega.",
    route: "phase4.html",
    type: "phase",
    phase: 4,
    order: 4
  }
];

export const learningTracks = [
  {
    id: "flows",
    index: 1,
    title: "Fluxos e investigação",
    description: "Valide funcionalidades, investigue comportamentos e acompanhe jornadas completas.",
    modules: [
      {
        id: "functional",
        progressId: "phase3",
        title: "Teste Funcional",
        description: "Introduzido no simulador de login da Fase 3.",
        route: "phase3.html",
        type: "track",
        order: 1,
        aliasOf: "phase3"
      },
      {
        id: "exploratory",
        progressId: "exploratory",
        title: "Teste Exploratório",
        description: "Investigue hipóteses e registre evidências em uma experiência aberta.",
        route: "exploratory.html",
        type: "track",
        order: 2
      },
      {
        id: "e2e",
        progressId: "e2e",
        title: "Teste End-to-End (E2E)",
        description: "Acompanhe uma compra completa da busca à confirmação.",
        route: "e2e.html",
        type: "track",
        order: 3
      }
    ]
  },
  {
    id: "release",
    index: 2,
    title: "Confiança na release",
    description: "Avalie disponibilidade, correções pontuais e comportamentos já conhecidos.",
    modules: [
      {
        id: "smoke",
        progressId: "smoke",
        title: "Smoke Test",
        description: "Cheque rapidamente se os fluxos essenciais estão disponíveis.",
        route: "smoke.html",
        type: "track",
        order: 1
      },
      {
        id: "sanity",
        progressId: "sanity",
        title: "Teste de Sanidade",
        description: "Valide uma correção específica e seus efeitos próximos.",
        route: "sanity.html",
        type: "track",
        order: 2
      },
      {
        id: "regression",
        progressId: "regression",
        title: "Teste de Regressão",
        description: "Repita casos conhecidos para localizar impactos de mudanças.",
        route: "regression.html",
        type: "track",
        order: 3
      }
    ]
  },
  {
    id: "specialized",
    index: 3,
    title: "Qualidade especializada",
    description: "Explore desempenho e proteção de dados em cenários introdutórios.",
    modules: [
      {
        id: "performance",
        progressId: "performance",
        title: "Teste de Performance",
        description: "Interprete carga, tempo de resposta, percentil e taxa de erros.",
        route: "performance.html",
        type: "track",
        order: 1
      },
      {
        id: "security",
        progressId: "security",
        title: "Teste de Segurança",
        description: "Avalie autenticação, autorização e exposição de dados.",
        route: "security.html",
        type: "track",
        order: 2
      }
    ]
  },
  {
    id: "professional",
    index: 4,
    title: "Prática profissional",
    description: "Transforme achados em comunicação útil e valide contratos de serviços.",
    modules: [
      {
        id: "bug-report",
        progressId: "bug-report",
        title: "Relato de Defeitos e Evidências",
        description: "Construa um relato claro, reproduzível e pronto para triagem.",
        route: "bug-report.html",
        type: "track",
        order: 1
      },
      {
        id: "api",
        progressId: "api",
        title: "Testes de API",
        description: "Leia requisições, respostas e valide contratos HTTP locais.",
        route: "api.html",
        type: "track",
        order: 2
      }
    ]
  }
];

export const journeyGroups = [
  {
    id: "base",
    index: 0,
    title: "Base comum",
    description: "Quatro fases sequenciais para construir o raciocínio essencial de QA.",
    items: baseMissions
  },
  ...learningTracks.map((track) => ({ ...track, items: track.modules }))
];

export const catalogItems = journeyGroups.flatMap((group) =>
  group.items.map((item) => ({ ...item, groupId: group.id, groupTitle: group.title }))
);

export const uniqueMissions = catalogItems.filter((item, index, items) =>
  items.findIndex((candidate) => candidate.progressId === item.progressId) === index
);

// Materiais são associados ao progressId canônico para que aliases da mesma
// missão (como functional → phase3) compartilhem uma única definição.
export const supportMaterials = [
  {
    id: "functional-testing",
    missionId: "phase3",
    title: "Teste Funcional",
    description: "Aula introdutória para consultar antes ou depois da prática.",
    path: "materiais/teste-funcional.pdf",
    filename: "teste-funcional.pdf",
    format: "PDF"
  },
  {
    id: "exploratory-testing",
    missionId: "exploratory",
    title: "Teste Exploratório",
    description: "Aula introdutória para consultar antes ou depois da prática.",
    path: "materiais/teste-exploratorio.pdf",
    filename: "teste-exploratorio.pdf",
    format: "PDF"
  },
  {
    id: "e2e-testing",
    missionId: "e2e",
    title: "Teste End-to-End (E2E)",
    description: "Aula introdutória para consultar antes ou depois da prática.",
    path: "materiais/teste-end-to-end-e2e.pdf",
    filename: "teste-end-to-end-e2e.pdf",
    format: "PDF",
    version: "1.0"
  }
];

export function getSupportMaterials(missionId) {
  const item = catalogItems.find((candidate) => candidate.id === missionId || candidate.progressId === missionId);
  const canonicalMissionId = item?.progressId || missionId;
  return supportMaterials.filter((material) => material.missionId === canonicalMissionId);
}

export function isCompleted(item, state) {
  return Boolean(state.missions[item.progressId]?.completed);
}

export function isAvailable(item, state) {
  if (item.type === "phase") return state.unlockedPhase >= item.phase;
  return Boolean(state.missions.phase4?.completed);
}

export function getRecommendedMission(state) {
  const pendingBase = baseMissions.find((item) => isAvailable(item, state) && !isCompleted(item, state));
  if (pendingBase) return { ...pendingBase, groupId: "base", groupTitle: "Base comum" };
  if (!state.missions.phase4?.completed) return null;

  const selectedTrack = learningTracks.find((track) => track.id === state.selectedTrack);
  const orderedTracks = [
    ...(selectedTrack ? [selectedTrack] : []),
    ...learningTracks.filter((track) => track.id !== selectedTrack?.id)
  ];

  for (const track of orderedTracks) {
    const pendingModule = track.modules.find((item) => !isCompleted(item, state));
    if (pendingModule) {
      return { ...pendingModule, groupId: track.id, groupTitle: track.title };
    }
  }

  return null;
}

export function getCompletedUniqueMissions(state) {
  return uniqueMissions.filter((item) => isCompleted(item, state));
}
