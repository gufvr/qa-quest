export const baseMissions = [
  {
    id: "phase1",
    progressId: "phase1",
    title: "Fundamentos de QA",
    description:
      "Conceitos essenciais, tipos de teste e decisões do dia a dia.",
    route: "phase1.html",
    type: "phase",
    phase: 1,
    order: 1,
  },
  {
    id: "phase2",
    progressId: "phase2",
    title: "Análise de Requisitos",
    description: "Ambiguidades, critérios de aceitação, fluxos e exceções.",
    route: "phase2.html",
    type: "phase",
    phase: 2,
    order: 2,
  },
  {
    id: "phase3",
    progressId: "phase3",
    title: "Simulador de Login",
    description: "Primeiro contato prático com testes funcionais.",
    route: "phase3.html",
    type: "phase",
    phase: 3,
    order: 3,
  },
  {
    id: "phase4",
    progressId: "phase4",
    title: "Plano de Testes",
    description: "Riscos, escopo, cenários e estratégia para uma entrega.",
    route: "phase4.html",
    type: "phase",
    phase: 4,
    order: 4,
  },
];

export const learningTracks = [
  {
    id: "flows",
    index: 1,
    title: "Fluxos e investigação",
    description:
      "Valide funcionalidades, investigue comportamentos e acompanhe jornadas completas.",
    hub: {
      label: "TRILHA 01 · FLUXOS",
      cardDescription:
        "Investigue comportamentos e acompanhe jornadas completas.",
      sequence: "Funcional → Exploratório → E2E",
      objective:
        "Passe da validação de uma funcionalidade à descoberta de comportamentos inesperados e à verificação de jornadas de ponta a ponta.",
      prerequisite:
        "Concluir as Fases 1–4. A Fase 3 já introduz testes funcionais.",
      order:
        "Funcional → Exploratório → E2E, aproveitando o simulador da Fase 3 como primeiro contato.",
      note: "Teste Exploratório e Teste E2E estão disponíveis. Use o E2E para acompanhar os dados de um único pedido do começo ao fim.",
    },
    modules: [
      {
        id: "functional",
        progressId: "phase3",
        title: "Teste Funcional",
        description: "Introduzido no simulador de login da Fase 3.",
        route: "phase3.html",
        type: "track",
        order: 1,
        aliasOf: "phase3",
        hubDetail: "Introduzido no simulador de login da Fase 3.",
        hubAvailableLabel: "Disponível na Fase 3",
        hubLinkLabel: "Revisitar Fase 3 →",
      },
      {
        id: "exploratory",
        progressId: "exploratory",
        title: "Teste Exploratório",
        description:
          "Investigue hipóteses e registre evidências em uma experiência aberta.",
        route: "exploratory.html",
        type: "track",
        order: 2,
        hubDetail: "Investigação guiada por hipóteses, observação e aprendizado.",
        hubAvailableLabel: "Disponível agora",
        hubLinkLabel: "Iniciar missão →",
        hubCompletedLinkLabel: "Repetir missão →",
      },
      {
        id: "e2e",
        progressId: "e2e",
        title: "Teste End-to-End (E2E)",
        description: "Acompanhe uma compra completa da busca à confirmação.",
        route: "e2e.html",
        type: "track",
        order: 3,
        hubDetail:
          "Validação de uma jornada completa entre catálogo, checkout e confirmação.",
        hubAvailableLabel: "Disponível agora",
        hubLinkLabel: "Iniciar missão →",
        hubCompletedLinkLabel: "Repetir missão →",
      },
    ],
  },
  {
    id: "release",
    index: 2,
    title: "Confiança na release",
    description:
      "Avalie disponibilidade, correções pontuais e comportamentos já conhecidos.",
    hub: {
      label: "TRILHA 02 · RELEASE",
      cardDescription:
        "Decida o que verificar antes e depois de uma entrega.",
      sequence: "Smoke → Sanidade → Regressão",
      objective:
        "Aprenda a avaliar se uma entrega está estável, se a correção resolveu o defeito e se funcionalidades antigas continuam funcionando.",
      prerequisite: "Concluir as Fases 1–4.",
      order:
        "Smoke → Sanidade → Regressão. A sequência ajuda a ir da checagem rápida à proteção mais ampla.",
      note: "Smoke Test, Sanidade e Regressão estão disponíveis. Verifique o essencial, valide uma correção e repita casos conhecidos para encontrar comportamentos afetados pelas mudanças.",
    },
    modules: [
      {
        id: "smoke",
        progressId: "smoke",
        title: "Smoke Test",
        description:
          "Cheque rapidamente se os fluxos essenciais estão disponíveis.",
        route: "smoke.html",
        type: "track",
        order: 1,
        hubDetail:
          "Seis verificações essenciais e um parecer sobre a estabilidade da release.",
        hubAvailableLabel: "Disponível agora",
        hubLinkLabel: "Iniciar missão →",
        hubCompletedLinkLabel: "Repetir missão →",
      },
      {
        id: "sanity",
        progressId: "sanity",
        title: "Teste de Sanidade",
        description: "Valide uma correção específica e seus efeitos próximos.",
        route: "sanity.html",
        type: "track",
        order: 2,
        hubDetail:
          "Valide a correção do Checkout e confira os dados próximos antes de aceitar a candidata.",
        hubAvailableLabel: "Disponível agora",
        hubLinkLabel: "Iniciar missão →",
        hubCompletedLinkLabel: "Repetir missão →",
      },
      {
        id: "regression",
        progressId: "regression",
        title: "Teste de Regressão",
        description:
          "Repita casos conhecidos para localizar impactos de mudanças.",
        route: "regression.html",
        type: "track",
        order: 3,
        hubDetail:
          "Repita cinco casos conhecidos e compare a candidata com os comportamentos anteriores.",
        hubAvailableLabel: "Disponível agora",
        hubLinkLabel: "Iniciar missão →",
        hubCompletedLinkLabel: "Repetir missão →",
      },
    ],
  },
  {
    id: "specialized",
    index: 3,
    title: "Qualidade especializada",
    description:
      "Explore desempenho e proteção de dados em cenários introdutórios.",
    hub: {
      label: "TRILHA 03 · ESPECIALIDADES",
      cardDescription: "Conheça riscos de desempenho e proteção de dados.",
      sequence: "Performance ↔ Segurança",
      objective:
        "Conheça perguntas iniciais sobre desempenho e segurança, com foco em riscos e observação antes de ferramentas avançadas.",
      prerequisite:
        "Concluir as Fases 1–4. Nenhuma das duas especialidades depende da outra.",
      order: "Performance e Segurança podem ser exploradas em qualquer ordem.",
      note: "Performance e Segurança estão disponíveis, em qualquer ordem. Simule carga e estresse ou investigue identidade, permissões e proteção de dados entre contas.",
    },
    modules: [
      {
        id: "performance",
        progressId: "performance",
        title: "Teste de Performance",
        description:
          "Interprete carga, tempo de resposta, percentil e taxa de erros.",
        route: "performance.html",
        type: "track",
        order: 1,
        hubDetail:
          "Simule carga e estresse no catálogo e interprete tempos, requisições e erros.",
        hubAvailableLabel: "Disponível agora",
        hubLinkLabel: "Iniciar missão →",
        hubCompletedLinkLabel: "Repetir missão →",
      },
      {
        id: "security",
        progressId: "security",
        title: "Teste de Segurança",
        description: "Avalie autenticação, autorização e exposição de dados.",
        route: "security.html",
        type: "track",
        order: 2,
        hubDetail:
          "Valide autenticação, autorização entre contas e mensagens de erro com dados fictícios.",
        hubAvailableLabel: "Disponível agora",
        hubLinkLabel: "Iniciar missão →",
        hubCompletedLinkLabel: "Repetir missão →",
      },
    ],
  },
  {
    id: "professional",
    index: 4,
    title: "Prática profissional",
    description:
      "Transforme achados em comunicação útil e valide contratos de serviços.",
    hub: {
      label: "TRILHA 04 · PRÁTICA PROFISSIONAL",
      title: "Prática Profissional",
      cardDescription:
        "Comunique defeitos e valide contratos de serviços com evidências.",
      sequence: "Relato de Defeitos e Evidências → Testes de API",
      objective:
        "Comunique defeitos com clareza e valide contratos de serviços usando evidências reproduzíveis.",
      prerequisite:
        "Concluir as Fases 1–4. O defeito de referência está incluído; nenhuma outra trilha é obrigatória.",
      order:
        "Relato de Defeitos e Evidências → Testes de API. É uma recomendação: as duas missões são independentes após a Fase 4.",
      note: "Relato de Defeitos e Testes de API estão disponíveis. Prepare um relato ou compare requisições e respostas com contratos locais da Fikily.",
    },
    modules: [
      {
        id: "bug-report",
        progressId: "bug-report",
        title: "Relato de Defeitos e Evidências",
        description:
          "Construa um relato claro, reproduzível e pronto para triagem.",
        route: "bug-report.html",
        type: "track",
        order: 1,
        hubDetail:
          "Monte um relato reproduzível, diferencie severidade de prioridade e selecione evidências úteis.",
        hubAvailableLabel: "Disponível agora",
        hubLinkLabel: "Iniciar missão →",
        hubCompletedLinkLabel: "Repetir missão →",
      },
      {
        id: "api",
        progressId: "api",
        title: "Testes de API",
        description:
          "Leia requisições, respostas e valide contratos HTTP locais.",
        route: "api.html",
        type: "track",
        order: 2,
        hubDetail:
          "Leia requisições e respostas, valide contratos e registre falhas de filtro, status, total e campos obrigatórios.",
        hubAvailableLabel: "Disponível agora",
        hubLinkLabel: "Iniciar missão →",
        hubCompletedLinkLabel: "Repetir missão →",
      },
    ],
  },
  {
    id: "automation",
    index: 5,
    title: "Automação de Testes Web",
    description:
      "Transforme comportamentos conhecidos em testes claros, verificáveis e confiáveis.",
    hub: {
      label: "TRILHA 05 · AUTOMAÇÃO DE TESTES WEB",
      cardDescription:
        "Construa e revise um teste antes de escolher uma ferramenta.",
      sequence:
        "Fundamentos da Automação → Cypress → Playwright → Selenium",
      objective:
        "Transforme cenários conhecidos em testes automatizados e interprete o que eles verificam.",
      prerequisite:
        "Concluir as Fases 1–4. Nenhuma outra trilha ou ferramenta instalada é necessária.",
      order:
        "Fundamentos da Automação → Cypress → Playwright → Selenium WebDriver. Ordem recomendada, não obrigatória.",
      note: "Quatro módulos disponíveis, com simulações locais. Construa comandos ou locators e interprete evidências. O StepScript é opcional nos módulos Cypress e Playwright, sem efeito no XP.",
    },
    modules: [
      {
        id: "automation-fundamentals",
        progressId: "automation-fundamentals",
        title: "Fundamentos da Automação",
        description:
          "Monte um teste, escolha seletores e assertions e interprete falhas simuladas.",
        route: "automation-fundamentals.html",
        type: "track",
        order: 1,
        hubDetail:
          "Construa ações, seletores e assertions; interprete sincronização, falhas e manutenção.",
        hubAvailableLabel: "Disponível agora",
        hubLinkLabel: "Iniciar missão →",
        hubCompletedLinkLabel: "Repetir missão →",
      },
      {
        id: "cypress",
        progressId: "cypress",
        title: "Cypress",
        description:
          "Construa um teste de catálogo e diferencie defeitos do produto de falhas do teste.",
        route: "cypress.html",
        type: "track",
        order: 2,
        hubDetail:
          "Monte um teste de catálogo, compare evidências e revise sincronização e isolamento.",
        hubAvailableLabel: "Disponível agora",
        hubLinkLabel: "Iniciar missão →",
        hubCompletedLinkLabel: "Repetir missão →",
      },
      {
        id: "playwright",
        progressId: "playwright",
        title: "Playwright",
        description:
          "Monte locators e assertions web-first e investigue uma linha do tempo didática.",
        route: "playwright.html",
        type: "track",
        order: 3,
        hubDetail:
          "Monte locators, ações e assertions web-first; compare três perfis e revise o parecer.",
        hubAvailableLabel: "Disponível agora",
        hubLinkLabel: "Iniciar missão →",
        hubCompletedLinkLabel: "Repetir missão →",
      },
      {
        id: "selenium",
        progressId: "selenium",
        title: "Selenium WebDriver",
        description:
          "Localize controles, sincronize o checkout e interprete valores de um cupom.",
        route: "selenium.html",
        type: "track",
        order: 4,
        hubDetail:
          "Aplique um cupom fictício, sincronize o resultado e compare três evidências.",
        hubAvailableLabel: "Disponível agora",
        hubLinkLabel: "Iniciar missão →",
        hubCompletedLinkLabel: "Repetir missão →",
      },
    ],
  },
];

export const journeyGroups = [
  {
    id: "base",
    index: 0,
    title: "Base comum",
    description:
      "Quatro fases sequenciais para construir o raciocínio essencial de QA.",
    items: baseMissions,
  },
  ...learningTracks.map((track) => ({ ...track, items: track.modules })),
];

export const catalogItems = journeyGroups.flatMap((group) =>
  group.items.map((item) => ({
    ...item,
    groupId: group.id,
    groupTitle: group.title,
  })),
);

export const uniqueMissions = catalogItems.filter(
  (item, index, items) =>
    items.findIndex((candidate) => candidate.progressId === item.progressId) ===
    index,
);

export const supportMaterials = [
  {
    id: "test-design-guide",
    missionId: "phase2",
    title: "Técnicas de Projeto de Testes",
    description:
      "Prática complementar de partição de equivalência, valores-limite e tabelas de decisão.",
    path: "materiais/qa-quest-tecnicas-projeto-testes.pdf",
    filename: "qa-quest-tecnicas-projeto-testes.pdf",
    format: "PDF",
    version: "1.0",
  },
  {
    id: "functional-testing",
    missionId: "phase3",
    title: "Teste Funcional",
    description: "Aula introdutória para consultar antes ou depois da prática.",
    path: "materiais/teste-funcional.pdf",
    filename: "teste-funcional.pdf",
    format: "PDF",
  },
  {
    id: "exploratory-testing",
    missionId: "exploratory",
    title: "Teste Exploratório",
    description: "Aula introdutória para consultar antes ou depois da prática.",
    path: "materiais/teste-exploratorio.pdf",
    filename: "teste-exploratorio.pdf",
    format: "PDF",
  },
  {
    id: "e2e-testing",
    missionId: "e2e",
    title: "Teste End-to-End (E2E)",
    description: "Aula introdutória para consultar antes ou depois da prática.",
    path: "materiais/teste-end-to-end-e2e.pdf",
    filename: "teste-end-to-end-e2e.pdf",
    format: "PDF",
    version: "1.0",
  },
  {
    id: "smoke-testing",
    missionId: "smoke",
    title: "Smoke Test",
    description: "Aula introdutória para consultar antes ou depois da prática.",
    path: "materiais/qa-quest-smoke-test.pdf",
    filename: "qa-quest-smoke-test.pdf",
    format: "PDF",
    version: "1.0",
  },
  {
    id: "sanity-testing",
    missionId: "sanity",
    title: "Teste de Sanidade",
    description: "Aula introdutória para consultar antes ou depois da prática.",
    path: "materiais/qa-quest-teste-sanidade.pdf",
    filename: "qa-quest-teste-sanidade.pdf",
    format: "PDF",
    version: "1.0",
  },
  {
    id: "regression-testing",
    missionId: "regression",
    title: "Teste de Regressão",
    description: "Aula introdutória para consultar antes ou depois da prática.",
    path: "materiais/qa-quest-teste-regressao.pdf",
    filename: "qa-quest-teste-regressao.pdf",
    format: "PDF",
    version: "1.0",
  },
  {
    id: "performance-testing",
    missionId: "performance",
    title: "Teste de Performance",
    description: "Aula introdutória para consultar antes ou depois da prática.",
    path: "materiais/qa-quest-teste-performance.pdf",
    filename: "qa-quest-teste-performance.pdf",
    format: "PDF",
    version: "1.0",
  },
  {
    id: "security-testing",
    missionId: "security",
    title: "Teste de Segurança",
    description: "Aula introdutória para consultar antes ou depois da prática.",
    path: "materiais/qa-quest-teste-seguranca.pdf",
    filename: "qa-quest-teste-seguranca.pdf",
    format: "PDF",
    version: "1.0",
  },
  {
    id: "bug-reporting",
    missionId: "bug-report",
    title: "Relato de Defeitos e Evidências",
    description: "Aula introdutória para consultar antes ou depois da prática.",
    path: "materiais/qa-quest-relato-defeitos-evidencias.pdf",
    filename: "qa-quest-relato-defeitos-evidencias.pdf",
    format: "PDF",
    version: "1.0",
  },
  {
    id: "api-testing",
    missionId: "api",
    title: "Testes de API",
    description: "Aula introdutória para consultar antes ou depois da prática.",
    path: "materiais/qa-quest-testes-api.pdf",
    filename: "qa-quest-testes-api.pdf",
    format: "PDF",
    version: "1.0",
  },
  {
    id: "automation-fundamentals-guide",
    missionId: "automation-fundamentals",
    title: "Fundamentos da Automação",
    description:
      "Aula introdutória sobre automação de testes, seletores, assertions e boas práticas.",
    path: "materiais/qa-quest-fundamentos-automacao.pdf",
    filename: "qa-quest-fundamentos-automacao.pdf",
    format: "PDF",
    version: "1.0",
  },
  {
    id: "cypress-guide",
    missionId: "cypress",
    title: "Cypress",
    description:
      "Aula prática sobre comandos, assertions, sincronização e revisão de testes.",
    path: "materiais/qa-quest-cypress.pdf",
    filename: "qa-quest-cypress.pdf",
    format: "PDF",
    version: "1.0",
  },
  {
    id: "playwright-guide",
    missionId: "playwright",
    title: "Playwright",
    description:
      "Aula prática sobre locators, auto-waiting, assertions e diagnóstico de testes.",
    path: "materiais/qa-quest-playwright.pdf",
    filename: "qa-quest-playwright.pdf",
    format: "PDF",
    version: "1.0",
  },
  {
    id: "selenium-guide",
    missionId: "selenium",
    title: "Selenium WebDriver",
    description:
      "Aula prática sobre sessões, localizadores, esperas explícitas e evidências.",
    path: "materiais/qa-quest-selenium.pdf",
    filename: "qa-quest-selenium.pdf",
    format: "PDF",
    version: "1.0",
  },
];

export function getSupportMaterials(missionId) {
  const item = catalogItems.find(
    (candidate) =>
      candidate.id === missionId || candidate.progressId === missionId,
  );
  const canonicalMissionId = item?.progressId || missionId;
  return supportMaterials.filter(
    (material) => material.missionId === canonicalMissionId,
  );
}

export function isCompleted(item, state) {
  return Boolean(state.missions[item.progressId]?.completed);
}

export function isAvailable(item, state) {
  if (item.type === "phase") return state.unlockedPhase >= item.phase;
  return Boolean(state.missions.phase4?.completed);
}

export function getRecommendedMission(state) {
  const pendingBase = baseMissions.find(
    (item) => isAvailable(item, state) && !isCompleted(item, state),
  );
  if (pendingBase)
    return { ...pendingBase, groupId: "base", groupTitle: "Base comum" };
  if (!state.missions.phase4?.completed) return null;

  const selectedTrack = learningTracks.find(
    (track) => track.id === state.selectedTrack,
  );
  const orderedTracks = [
    ...(selectedTrack ? [selectedTrack] : []),
    ...learningTracks.filter((track) => track.id !== selectedTrack?.id),
  ];

  for (const track of orderedTracks) {
    const pendingModule = track.modules.find(
      (item) => !isCompleted(item, state),
    );
    if (pendingModule) {
      return { ...pendingModule, groupId: track.id, groupTitle: track.title };
    }
  }

  return null;
}

export function getCompletedUniqueMissions(state) {
  return uniqueMissions.filter((item) => isCompleted(item, state));
}
