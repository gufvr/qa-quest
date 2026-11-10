export const PLAYWRIGHT_MISSION_ID = "playwright";
export const PLAYWRIGHT_PRODUCTS = Object.freeze([
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
export const PLAYWRIGHT_ACTIONS = Object.freeze([
  Object.freeze({
    id: "filter",
    code: 'await category.selectOption("accessories");',
  }),
  Object.freeze({ id: "search", code: 'await search.fill("Aurora");' }),
  Object.freeze({ id: "apply", code: "await apply.click();" }),
]);
export const PLAYWRIGHT_PROFILES = Object.freeze([
  Object.freeze({ id: "reference", label: "Referência · teste confiável" }),
  Object.freeze({ id: "candidate", label: "Candidata · teste confiável" }),
  Object.freeze({ id: "fragile", label: "Referência · snapshot prematuro" }),
]);
export const PLAYWRIGHT_STEPS = Object.freeze(
  [
    {
      id: "structure",
      title: "Estrutura com async/await",
      points: 10,
      kind: "structure",
      instruction:
        "Complete um teste Playwright Test. Arrange prepara a página; Act aplica os filtros; Assert confere os resultados. /catalog é uma rota de exemplo em um projeto configurado, não um destino deste site.",
      feedback:
        "Importe test e expect de @playwright/test. Use test.describe para agrupar, test.beforeEach para preparar cada caso e funções async com await nas operações assíncronas. beforeEach não substitui o isolamento dos contextos.",
    },
    {
      id: "locators",
      title: "Locators pelo contrato",
      points: 15,
      kind: "locators",
      instruction:
        "Observe os rótulos e elementos do catálogo. Associe categoria, busca e Aplicar a locators compatíveis. Um locator é uma descrição reutilizável: consulta um elemento atual quando utilizado, não guarda para sempre um elemento antigo.",
      feedback:
        "Categoria tem label associado; Buscar produto identifica o searchbox; Aplicar nomeia o botão. getByTestId usa um contrato explícito; getByPlaceholder também pode fazer sentido se o placeholder for o contrato desejado. CSS/XPath não são sempre errados: evite depender de posição ou estilo sem intenção.",
    },
    {
      id: "actions",
      title: "Ações e auto-waiting",
      points: 15,
      kind: "order",
      instruction:
        "Reordene selectOption, fill e click usando as setas. Os locators já foram definidos. Cada ação aguarda suas condições aplicáveis, dentro do timeout; isso não comprova que a regra do filtro funcionou.",
      feedback:
        "Selecione Acessórios, preencha Aurora e aplique. As verificações de actionability variam por ação: não trate selectOption, fill e click como operações com verificações idênticas. Espere o resultado de negócio com assertions.",
    },
    {
      id: "assertions",
      title: "Assertions que encontram o erro",
      points: 20,
      kind: "assertions",
      instruction:
        "A massa conhecida possui exatamente dois acessórios. Monte as assertions e simule a contraprova de dois cards, um deles eletrônico: contar dois itens não basta para validar a categoria.",
      feedback:
        "toHaveCount(2) corresponde a esta massa, não a uma regra universal de catálogo. Confira os nomes esperados com toContainText e a categoria dos dois cards com toHaveAttribute. await expect(locator) reconsulta; expect(valorCapturado) não atualiza o snapshot sozinho.",
    },
    {
      id: "sync",
      title: "Sincronize pelo estado",
      points: 15,
      kind: "choice",
      instruction:
        "O clique pode terminar antes da atualização da lista. Qual condição representa a prontidão deste catálogo local?",
      options: [
        [
          "ready",
          'await expect(results).toHaveAttribute("data-state", "ready");',
        ],
        ["sleep", "await page.waitForTimeout(300); sem observar a lista"],
        [
          "network",
          'await page.waitForLoadState("networkidle"); como prova geral do filtro',
        ],
      ],
      feedback:
        "Priorize o estado pronto com uma assertion web-first e limite. networkidle não é a recomendação geral para provar prontidão. waitForResponse cabe quando existe uma resposta relevante; aqui não há rede. expect.poll reavalia uma função até um critério passar. Retry da assertion não é executar o teste inteiro de novo.",
    },
    {
      id: "diagnosis",
      title: "Leia a linha do tempo",
      points: 15,
      kind: "diagnosis",
      instruction:
        "Simule os três perfis e classifique cada resultado. A linha do tempo é uma evidência didática local: não é o Trace Viewer real e não produz trace.zip.",
      feedback:
        "A referência pronta passa. A candidata pronta ainda contém um eletrônico: defeito do produto. Na referência frágil, waitForTimeout(300) precede uma leitura imediata, sem retry; a atualização correta só aparece em 800 ms. O problema está na sincronização desse teste.",
    },
    {
      id: "review",
      title: "Revise e emita o parecer",
      points: 10,
      kind: "review",
      instruction:
        "Defina isolamento, leitura de trace e parecer. A candidata FF-PW-2026.01 falhou no filtro. Concluir a missão depende do seu diagnóstico, não de deixar a candidata verde.",
      feedback:
        "Playwright Test oferece contextos isolados por teste; fixtures e beforeEach ajudam a preparar estado conhecido. Projects e storageState não garantem independência por si sós. trace: on-first-retry precisa de retries habilitados. Devolva a candidata para ajuste, corrija o teste frágil e reavalie. Nada disso aprova produção.",
    },
  ].map((step) =>
    Object.freeze({
      ...step,
      options: step.options && Object.freeze(step.options.map(Object.freeze)),
    }),
  ),
);

export function createPlaywrightSession() {
  return { step: 0, awards: {}, mistakes: [], runs: {}, counterexample: null };
}

export function filterPlaywrightCatalog(category = "all", query = "") {
  return PLAYWRIGHT_PRODUCTS.filter(
    (product) =>
      (category === "all" || product.category === category) &&
      product.name
        .toLocaleLowerCase("pt-BR")
        .includes(query.trim().toLocaleLowerCase("pt-BR")),
  );
}

export function inspectPlaywrightResults(products) {
  return {
    countPass: products.length === 2,
    categoryPass:
      products.length > 0 &&
      products.every((item) => item.category === "accessories"),
    namesPass:
      products.length === 2 &&
      products[0].name.includes("Mochila Aurora") &&
      products[1].name.includes("Estojo Aurora"),
  };
}

export function runPlaywrightCounterexample(session) {
  if (session.step !== 3 || session.awards.assertions !== undefined)
    return session;
  const products = [PLAYWRIGHT_PRODUCTS[0], PLAYWRIGHT_PRODUCTS[2]];
  return {
    ...session,
    counterexample: { products, ...inspectPlaywrightResults(products) },
  };
}

export function simulatePlaywright(profile) {
  if (!PLAYWRIGHT_PROFILES.some((item) => item.id === profile))
    throw Error("Perfil didático desconhecido.");
  const fragile = profile === "fragile",
    pass = profile === "reference";
  const products = pass
    ? filterPlaywrightCatalog("accessories", "Aurora")
    : [...PLAYWRIGHT_PRODUCTS];
  return {
    profile,
    products,
    ready: !fragile,
    readyAt: 800,
    observedAt: fragile ? 300 : 800,
    eventualProducts:
      profile === "candidate"
        ? [...PLAYWRIGHT_PRODUCTS]
        : filterPlaywrightCatalog("accessories", "Aurora"),
    checks: inspectPlaywrightResults(products),
    passed: pass,
    classification: pass ? "pass" : fragile ? "test" : "product",
    expected:
      "Lista pronta, com os dois acessórios Aurora desta massa; nenhum eletrônico.",
    observed: pass
      ? "Em 800 ms, estado ready, Mochila Aurora e Estojo Aurora. Assertions atendidas."
      : fragile
        ? "Em 300 ms, o snapshot ainda mostra três produtos, incluindo um eletrônico. Em 800 ms a referência termina corretamente com dois acessórios."
        : "Em 800 ms, estado ready, três produtos, incluindo Teclado Aurora (electronics). A candidata ignorou o filtro.",
    impact: pass
      ? "Somente este caso da referência atende ao contrato preparado."
      : fragile
        ? "Falso alarme por leitura prematura; revisar a sincronização antes de atribuir a falha ao produto."
        : "A pessoa recebe um eletrônico apesar da categoria selecionada; devolver o filtro para investigação e correção.",
    trace: [
      {
        at: 0,
        state: "loading",
        detail:
          "Visita, categoria Acessórios, busca Aurora e clique em Aplicar.",
      },
      {
        at: fragile ? 300 : 800,
        state: fragile ? "loading" : "ready",
        detail: fragile
          ? "waitForTimeout(300); count captura um snapshot; expect(snapshot).toBe falha sem retry."
          : "expect(results).toHaveAttribute aguarda ready; assertions da lista são conferidas.",
      },
      {
        at: fragile ? 800 : 801,
        state: "ready",
        detail: fragile
          ? "Referência atualizada: os dois acessórios. O snapshot anterior não muda sozinho."
          : pass
            ? "Caso aderente: quantidade, nomes e categorias corretos."
            : "Defeito do produto: eletrônico permanece após a atualização.",
      },
    ],
  };
}

export function recordPlaywrightRun(session, profile) {
  if (session.step !== 5 || session.awards.diagnosis !== undefined)
    return session;
  return {
    ...session,
    runs: { ...session.runs, [profile]: simulatePlaywright(profile) },
  };
}

function isCorrect(step, answer) {
  switch (step.id) {
    case "structure":
      return (
        answer?.imports === "native" &&
        answer?.setup === "beforeEach" &&
        answer?.async === "await"
      );
    case "locators":
      return (
        answer?.category === "label" &&
        answer?.search === "role" &&
        answer?.apply === "button"
      );
    case "actions":
      return (
        Array.isArray(answer) && answer.join(",") === "filter,search,apply"
      );
    case "assertions":
      return (
        answer?.count === "two" &&
        answer?.text === "names" &&
        answer?.category === "every"
      );
    case "sync":
      return answer === "ready";
    case "diagnosis":
      return (
        answer?.reference === "pass" &&
        answer?.candidate === "product" &&
        answer?.fragile === "test"
      );
    case "review":
      return (
        answer?.isolation === "context" &&
        answer?.trace === "retry" &&
        answer?.verdict === "return"
      );
    default:
      return false;
  }
}

export function answerPlaywrightStep(session, answer) {
  const step = PLAYWRIGHT_STEPS[session.step];
  if (!step || session.awards[step.id] !== undefined)
    return {
      session,
      correct: false,
      feedback: "Etapa já registrada; não soma pontos novamente.",
    };
  if (
    (step.id === "assertions" && !session.counterexample) ||
    (step.id === "diagnosis" &&
      !PLAYWRIGHT_PROFILES.every((profile) => session.runs[profile.id]))
  ) {
    return {
      session,
      correct: false,
      feedback:
        "Execute a contraprova ou os perfis solicitados antes de classificar. Evidência incompleta não reduz sua pontuação.",
    };
  }
  if (!isCorrect(step, answer))
    return {
      session: {
        ...session,
        mistakes: [...new Set([...session.mistakes, step.id])],
      },
      correct: false,
      feedback: `${step.feedback} Corrija para receber ${(step.points / 2).toLocaleString("pt-BR")} XP nesta etapa.`,
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

export function advancePlaywrightStep(session) {
  const current = PLAYWRIGHT_STEPS[session.step];
  return current &&
    session.awards[current.id] !== undefined &&
    session.step < PLAYWRIGHT_STEPS.length - 1
    ? { ...session, step: session.step + 1 }
    : session;
}
export function playwrightScore(session) {
  return Object.values(session.awards).reduce((sum, points) => sum + points, 0);
}
export function isPlaywrightComplete(session) {
  return PLAYWRIGHT_STEPS.every(
    (step) => session.awards[step.id] !== undefined,
  );
}

export function buildPlaywrightCode(session) {
  const done = (id) => session.awards[id] !== undefined;
  return [
    'import { test, expect } from "@playwright/test";',
    'test.describe("Catálogo FictFvr", () => {',
    ...(done("structure")
      ? [
          "  test.beforeEach(async ({ page }) => {",
          '    await page.goto("/catalog");',
          "  });",
          '  test("filtra acessórios Aurora", async ({ page }) => {',
        ]
      : []),
    ...(done("locators")
      ? [
          '    const category = page.getByLabel("Categoria", { exact: true });',
          '    const search = page.getByRole("searchbox", { name: "Buscar produto", exact: true });',
          '    const apply = page.getByRole("button", { name: "Aplicar", exact: true });',
          '    const results = page.getByTestId("catalog-results");',
        ]
      : []),
    ...(done("actions")
      ? PLAYWRIGHT_ACTIONS.map((action) => "    " + action.code)
      : []),
    ...(done("sync")
      ? ['    await expect(results).toHaveAttribute("data-state", "ready");']
      : []),
    ...(done("assertions")
      ? [
          '    const cards = results.getByTestId("product-card");',
          "    await expect(cards).toHaveCount(2);",
          '    await expect(cards).toContainText(["Mochila Aurora", "Estojo Aurora"]);',
          "    for (let index = 0; index < 2; index++) {",
          "      await expect(cards.nth(index))",
          '        .toHaveAttribute("data-category", "accessories");',
          "    }",
        ]
      : []),
    ...(done("structure") ? ["  });"] : []),
    "});",
  ].join("\n");
}

export function buildFragilePlaywrightCode() {
  return [
    "await page.waitForTimeout(300);",
    'const snapshot = await page.getByTestId("product-card").count();',
    "expect(snapshot).toBe(2);",
  ].join("\n");
}
