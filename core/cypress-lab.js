export const CYPRESS_MISSION_ID = "cypress";
export const CATALOG_PRODUCTS = Object.freeze([
  Object.freeze({
    id: "FVR-M01",
    name: "Mochila Aurora",
    category: "accessories",
    label: "Acessórios",
  }),
  Object.freeze({
    id: "FVR-E02",
    name: "Estojo Aurora",
    category: "accessories",
    label: "Acessórios",
  }),
  Object.freeze({
    id: "FVR-T03",
    name: "Teclado Aurora",
    category: "electronics",
    label: "Eletrônicos",
  }),
]);
export const CYPRESS_STEPS = Object.freeze(
  [
    {
      id: "goal",
      title: "Defina a regra",
      points: 10,
      kind: "choice",
      instruction:
        "O catálogo deve combinar categoria e busca. Qual caso repete uma regra observável, e não apenas cliques?",
      options: [
        [
          "rule",
          "Filtrar Acessórios, buscar Aurora e verificar resultados não vazios, todos da categoria.",
        ],
        [
          "clicks",
          "Clicar em Aplicar e encerrar: o clique já comprova o filtro.",
        ],
        ["all", "Um teste do catálogo basta para aprovar toda a aplicação."],
      ],
      feedback:
        "O objetivo é validar os resultados do filtro, não só a interação. Um caso cobre apenas sua regra e seus dados.",
    },
    {
      id: "structure",
      title: "Dê estrutura ao teste",
      points: 10,
      kind: "structure",
      instruction:
        "Complete a estrutura de um spec em um projeto Cypress já configurado. /catalog é uma rota de exemplo desse projeto, não uma URL que o QA Quest abrirá.",
      feedback:
        "describe agrupa casos; it descreve um caso; cy.visit abre a página. Cada teste deve preparar seu próprio estado, sem depender de outro it.",
    },
    {
      id: "selector",
      title: "Escolha o contrato do controle",
      points: 10,
      kind: "choice",
      instruction:
        "Inspecione o campo Categoria no laboratório ao lado. O teste quer localizar esse controle mesmo se sua cor mudar. Qual seletor atende a esse contrato?",
      options: [
        ["stable", "cy.get('[data-testid=\"category-filter\"]')"],
        ["style", "cy.get('.filter--violet')"],
        ["position", "cy.get('select').first()"],
      ],
      feedback:
        "O data-testid é um contrato mantido pelo time, não uma garantia automática. Classes de cor e posição são frágeis. Texto, papel e nome acessível também são úteis quando fazem parte da intenção da verificação.",
    },
    {
      id: "actions",
      title: "Monte a sequência de ações",
      points: 20,
      kind: "order",
      instruction:
        "O cy.visit já está dentro do it. Reordene os comandos com as setas: selecione a categoria, preencha a busca e só então aplique os filtros.",
      feedback:
        "select escolhe a opção de um select; type preenche o campo; click aciona Aplicar. Depois de uma ação, faça uma nova consulta quando precisar de um elemento que pode ter sido renderizado novamente.",
    },
    {
      id: "assertions",
      title: "Verifique a regra, não só a tela",
      points: 20,
      kind: "assertions",
      instruction:
        "A lista expõe data-state=ready quando termina a atualização. Complete a sincronização e a assertion para evitar tanto uma lista vazia quanto um eletrônico entre os resultados.",
      feedback:
        "Aguarde data-state=ready com should e consulte os cards novamente. No callback de should, confira quantidade maior que zero e a categoria de todos os cards. Consultas/assertions podem ser repetidas até o limite; não coloque cliques ou outros efeitos nesse callback.",
    },
    {
      id: "diagnosis",
      title: "Compare três evidências",
      points: 20,
      kind: "diagnosis",
      instruction:
        "Simule os três perfis locais e classifique a causa de cada resultado. O terceiro perfil usa uma versão frágil do teste, não o código confiável que você montou.",
      feedback:
        "A referência atende à regra após ficar pronta. A candidata continua exibindo um eletrônico mesmo pronta: defeito do produto. Na referência com pausa fixa de 300 ms, a leitura é prematura e a atualização só termina em 800 ms: falha de sincronização do teste.",
    },
    {
      id: "review",
      title: "Revise e emita seu parecer",
      points: 10,
      kind: "review",
      instruction:
        "Escolha a manutenção adequada e o parecer sustentado pelas evidências. A candidata FF-CY-2026.01 precisa de ajuste no filtro; o teste frágil precisa de sincronização, não de uma assertion removida.",
      feedback:
        "Prepare o estado em cada teste, sincronize por uma condição observável com limite e mantenha a assertion. A candidata falhou neste caso e deve voltar para ajuste. Concluir a missão não aprova uma suíte real nem a aplicação para produção.",
    },
  ].map((step) =>
    Object.freeze({
      ...step,
      options: step.options && Object.freeze(step.options.map(Object.freeze)),
    }),
  ),
);

export const CYPRESS_ACTIONS = Object.freeze([
  Object.freeze({
    id: "filter",
    code: 'cy.get(\'[data-testid="category-filter"]\').select("accessories")',
  }),
  Object.freeze({
    id: "search",
    code: 'cy.get(\'[data-testid="catalog-search"]\').type("Aurora")',
  }),
  Object.freeze({
    id: "apply",
    code: "cy.get('[data-testid=\"apply-filter\"]').click()",
  }),
]);
export const CYPRESS_PROFILES = Object.freeze([
  Object.freeze({ id: "reference", label: "Referência · teste confiável" }),
  Object.freeze({ id: "candidate", label: "Candidata · teste confiável" }),
  Object.freeze({ id: "fragile", label: "Referência · teste com pausa fixa" }),
]);

export function createCypressSession() {
  return { step: 0, awards: {}, mistakes: [], runs: {} };
}

export function filterCatalog(category = "all", query = "") {
  return CATALOG_PRODUCTS.filter(
    (item) =>
      (category === "all" || item.category === category) &&
      item.name
        .toLocaleLowerCase("pt-BR")
        .includes(query.trim().toLocaleLowerCase("pt-BR")),
  );
}

export function simulateCypress(profile) {
  if (!CYPRESS_PROFILES.some((item) => item.id === profile))
    throw Error("Perfil local desconhecido.");
  const reference = filterCatalog("accessories", "Aurora");
  const products = profile === "reference" ? reference : [...CATALOG_PRODUCTS];
  const premature = profile === "fragile";
  return {
    profile,
    readyAt: 800,
    observedAt: premature ? 300 : 800,
    ready: !premature,
    passed: profile === "reference",
    products,
    eventualProducts:
      profile === "candidate" ? [...CATALOG_PRODUCTS] : reference,
    classification:
      profile === "reference" ? "pass" : premature ? "test" : "product",
    expected:
      "Após a atualização, uma lista não vazia com apenas acessórios que correspondem à busca Aurora.",
    observed:
      profile === "reference"
        ? "Em 800 ms, lista pronta com 2 acessórios; as assertions passam."
        : premature
          ? "A pausa fixa termina em 300 ms: um snapshot conferido sem retry ainda contém 3 produtos da lista anterior. Em 800 ms, a referência mostra corretamente 2 acessórios."
          : "Em 800 ms, lista pronta com 3 produtos, incluindo Teclado Aurora (electronics). A assertion de categoria falha.",
    impact:
      profile === "reference"
        ? "O caso da referência atende à regra, somente neste escopo didático."
        : premature
          ? "Falso alarme: o teste lê o estado anterior e pode variar conforme o tempo da atualização. Corrigir a sincronização."
          : "A pessoa recebe um eletrônico apesar de selecionar Acessórios. Investigar e corrigir o filtro da candidata.",
    trace: [
      "0 ms · visita, seleção de Acessórios, busca Aurora e clique em Aplicar",
      premature
        ? "300 ms · cy.wait(300); leitura com then, cujo callback não tem retry"
        : "800 ms · condição data-state=ready atendida dentro do limite de 2 s",
      profile === "reference"
        ? "ASSERT · 2 cards; todos accessories · passou"
        : "ASSERT · 3 cards; um electronics · falhou",
      ...(premature
        ? [
            "800 ms · atualização concluída; 2 acessórios (a regra do produto estava correta)",
          ]
        : []),
    ],
  };
}

export function recordCypressRun(session, profile) {
  if (session.step !== 5 || session.awards.diagnosis !== undefined)
    return session;
  return {
    ...session,
    runs: { ...session.runs, [profile]: simulateCypress(profile) },
  };
}

function matches(step, answer) {
  switch (step.id) {
    case "goal":
      return answer === "rule";
    case "structure":
      return (
        answer?.suite === "describe" &&
        answer?.test === "it" &&
        answer?.visit === "visit"
      );
    case "selector":
      return answer === "stable";
    case "actions":
      return (
        Array.isArray(answer) && answer.join(",") === "filter,search,apply"
      );
    case "assertions":
      return (
        answer?.sync === "ready" &&
        answer?.count === "nonempty" &&
        answer?.category === "every"
      );
    case "diagnosis":
      return (
        answer?.reference === "pass" &&
        answer?.candidate === "product" &&
        answer?.fragile === "test"
      );
    case "review":
      return (
        answer?.sync === "condition" &&
        answer?.isolation === "own" &&
        answer?.verdict === "return"
      );
    default:
      return false;
  }
}

export function answerCypressStep(session, answer) {
  const step = CYPRESS_STEPS[session.step];
  if (!step || session.awards[step.id] !== undefined)
    return {
      session,
      correct: false,
      feedback: "Etapa já registrada; não soma pontos novamente.",
    };
  if (
    step.id === "diagnosis" &&
    !CYPRESS_PROFILES.every((profile) => session.runs[profile.id])
  ) {
    return {
      session,
      correct: false,
      feedback:
        "Simule os três perfis antes de classificar. A ausência de evidências não reduz sua pontuação.",
    };
  }
  if (!matches(step, answer))
    return {
      session: {
        ...session,
        mistakes: [...new Set([...session.mistakes, step.id])],
      },
      correct: false,
      feedback: `${step.feedback} Revise e tente novamente: a correção vale ${step.points / 2} XP.`,
    };
  const points = session.mistakes.includes(step.id)
    ? step.points / 2
    : step.points;
  return {
    session: { ...session, awards: { ...session.awards, [step.id]: points } },
    correct: true,
    points,
    feedback: step.feedback,
  };
}

export function advanceCypressStep(session) {
  const step = CYPRESS_STEPS[session.step];
  return step &&
    session.awards[step.id] !== undefined &&
    session.step < CYPRESS_STEPS.length - 1
    ? { ...session, step: session.step + 1 }
    : session;
}
export function cypressScore(session) {
  return Object.values(session.awards).reduce((sum, points) => sum + points, 0);
}
export function isCypressComplete(session) {
  return CYPRESS_STEPS.every((step) => session.awards[step.id] !== undefined);
}

export function buildCypressCode(session) {
  const done = (id) => session.awards[id] !== undefined;
  return [
    "// Exemplo Cypress · não executado pelo QA Quest",
    "// Requer projeto/servidor local com baseUrl e /catalog.",
    done("structure")
      ? 'describe("Catálogo Fikily", () => {\n  it("filtra acessórios por busca", () => {\n    cy.visit("/catalog")'
      : "// TODO: escolher describe, it e cy.visit",
    done("selector")
      ? '    // Contrato: [data-testid="category-filter"]'
      : "    // TODO: escolher seletor",
    ...(done("actions")
      ? CYPRESS_ACTIONS.map((action) => "    " + action.code)
      : ["    // TODO: ordenar as ações"]),
    done("assertions")
      ? '    cy.get(\'[data-testid="catalog-results"]\', { timeout: 2000 })\n      .should("have.attr", "data-state", "ready")\n    cy.get(\'[data-testid="product-card"]\').should(($cards) => {\n      expect($cards.length).to.be.greaterThan(0)\n      Array.from($cards).forEach((card) => {\n        expect(card.getAttribute("data-category"))\n          .to.equal("accessories")\n      })\n    })'
      : "    // TODO: sincronizar e verificar quantidade e categorias",
    done("structure") ? "  })\n})" : "// Estrutura em construção",
  ].join("\n");
}
