export const AUTOMATION_MISSION_ID = "automation-fundamentals";

export const AUTOMATION_STEPS = Object.freeze(
  [
    {
      id: "scenario",
      title: "Escolha o comportamento",
      points: 10,
      kind: "choice",
      instruction:
        "O time repete a mesma conferência do filtro a cada entrega. Qual cenário tem um resultado observável e estável para automatizar?",
      options: [
        [
          "filter",
          "Aplicar Acessórios e conferir se todos os resultados pertencem à categoria.",
        ],
        ["taste", "Decidir se a nova identidade visual é bonita."],
        ["everything", "Automatizar tudo, sem considerar risco ou manutenção."],
      ],
      hint: "Escolha uma regra repetível com um resultado verificável. Automação apoia o QA; não substitui exploração e julgamento humano.",
    },
    {
      id: "selector",
      title: "Encontre o elemento certo",
      points: 15,
      kind: "choice",
      instruction:
        "Inspecione o controle de categoria no exemplo. Qual seletor expressa um contrato de teste sem depender da cor ou da posição do campo?",
      options: [
        ["style", ".filter--purple"],
        ["stable", '[data-testid="category-filter"]'],
        ["position", "select:first-of-type"],
      ],
      hint: "O data-testid identifica o controle para o teste. Uma classe visual ou posição pode mudar sem alterar a regra de negócio. Esse atributo também precisa ser mantido pelo time; não é uma garantia automática.",
    },
    {
      id: "actions",
      title: "Organize as ações",
      points: 15,
      kind: "order",
      instruction:
        "Use os botões de mover para ordenar as ações. O filtro precisa existir antes de ser usado; só depois a lista deve estar pronta para a verificação.",
      hint: "Primeiro abra o catálogo, depois selecione Acessórios e então aguarde a atualização. Ordenar ações não substitui a assertion do resultado.",
    },
    {
      id: "assertion",
      title: "Construa a verificação",
      points: 20,
      kind: "assertion",
      instruction:
        "Complete a assertion para validar a regra: todos os produtos exibidos devem pertencer à categoria Acessórios.",
      hint: "Verifique a categoria de todos os resultados e compare com Acessórios. Um clique ou uma página visível, sozinhos, não provam que o filtro funcionou.",
    },
    {
      id: "wait",
      title: "Sincronize pelo estado",
      points: 15,
      kind: "choice",
      instruction:
        "As fixtures de tempo ficam prontas em 120 ms ou 800 ms. Qual estratégia funciona nas duas, sem depender de uma pausa fixa?",
      options: [
        ["fixed", "Sempre pausar 300 ms antes de conferir."],
        [
          "ready",
          "Aguardar a lista sinalizar atualização concluída, com limite de 2 s.",
        ],
        ["instant", "Conferir imediatamente após selecionar a categoria."],
      ],
      hint: "Uma pausa de 300 ms passa na fixture de 120 ms e pode falhar na de 800 ms. Aguarde a condição de lista pronta com um limite. Isso é sincronização: não é esperar indefinidamente nem provar que o sistema é rápido.",
    },
    {
      id: "diagnosis",
      title: "Execute a simulação e interprete",
      points: 15,
      kind: "diagnosis",
      instruction:
        "Simule a referência e a candidata. Compare a mesma regra nas duas fixtures locais antes de classificar a falha.",
      options: [
        [
          "behavior",
          "A assertion encontra um produto de outra categoria: o filtro da candidata falhou neste caso.",
        ],
        [
          "production",
          "Uma execução de referência passou, então a candidata pode ir para produção.",
        ],
        ["remove", "Remover a assertion resolve o defeito do filtro."],
      ],
      hint: "A referência retorna dois acessórios. A candidata mantém um eletrônico na lista após o estado de pronto. A assertion revela uma divergência funcional; remover a verificação não corrige o produto.",
    },
    {
      id: "maintenance",
      title: "Revise antes de manter",
      points: 10,
      kind: "maintenance",
      instruction:
        "Uma revisão mudou a classe visual do filtro de filter--purple para filter--compact, sem mudar sua função. Corrija o trecho frágil do teste.",
      hint: "Mantenha um seletor estável e a assertion da regra. Se apenas o estilo mudou, depender de .filter--purple cria uma falha de manutenção; usar uma pausa maior não conserta um seletor que não encontra o campo.",
    },
  ].map((step) =>
    Object.freeze({
      ...step,
      options: step.options && Object.freeze(step.options.map(Object.freeze)),
    }),
  ),
);

export const ACTIONS = Object.freeze([
  Object.freeze({ id: "open", label: "Abrir o catálogo da FictFvr" }),
  Object.freeze({ id: "filter", label: "Selecionar a categoria Acessórios" }),
  Object.freeze({
    id: "wait",
    label: "Aguardar a lista sinalizar atualização concluída",
  }),
]);

const products = Object.freeze([
  Object.freeze({
    id: "FVR-BAG",
    name: "Mochila Horizonte",
    category: "accessories",
    categoryLabel: "Acessórios",
  }),
  Object.freeze({
    id: "FVR-CASE",
    name: "Estojo Órbita",
    category: "accessories",
    categoryLabel: "Acessórios",
  }),
  Object.freeze({
    id: "FVR-KEY",
    name: "Teclado Cometa",
    category: "electronics",
    categoryLabel: "Eletrônicos",
  }),
]);

export function createLabSession() {
  return { step: 0, awards: {}, mistakes: [], runs: {} };
}

export function simulateCatalog(profile) {
  if (!["reference", "candidate"].includes(profile))
    throw new Error("Fixture desconhecida.");
  const observed =
    profile === "reference"
      ? products.filter((item) => item.category === "accessories")
      : [...products];
  const passed =
    observed.length > 0 &&
    observed.every((item) => item.category === "accessories");
  return {
    profile,
    selectedCategory: "accessories",
    ready: true,
    passed,
    products: observed,
    expected:
      "Após selecionar Acessórios e concluir a atualização, todos os resultados pertencem à categoria. A fixture contém dois acessórios.",
    observed: passed
      ? "Lista pronta com 2 acessórios; nenhum produto de outra categoria."
      : "Lista pronta com 3 produtos: 2 acessórios e 1 eletrônico. O filtro foi ignorado.",
    impact: passed
      ? "O caso da referência atende à regra preparada para comparação."
      : "A pessoa recebe produtos fora do filtro escolhido. Investigar o filtro antes de validar novamente este caso.",
    trace: [
      "Catálogo aberto",
      "Acessórios selecionado",
      "Lista pronta dentro do limite",
      passed
        ? "ASSERT: passou (2 de 2 são acessórios)"
        : "ASSERT: falhou (1 de 3 não é acessório)",
    ],
  };
}

export function runLabFixture(session, profile) {
  if (session.step !== 5 || session.awards.diagnosis !== undefined)
    return session;
  return {
    ...session,
    runs: { ...session.runs, [profile]: simulateCatalog(profile) },
  };
}

function isCorrect(step, answer, session) {
  switch (step.id) {
    case "scenario":
      return answer === "filter";
    case "selector":
      return answer === "stable";
    case "actions":
      return Array.isArray(answer) && answer.join(",") === "open,filter,wait";
    case "assertion":
      return (
        answer?.subject === "categories" &&
        answer?.operator === "every" &&
        answer?.value === "accessories"
      );
    case "wait":
      return answer === "ready";
    case "diagnosis":
      return (
        Boolean(session.runs.reference && session.runs.candidate) &&
        answer === "behavior"
      );
    case "maintenance":
      return answer?.selector === "stable" && answer?.assertion === "keep";
    default:
      return false;
  }
}

export function answerCheckpoint(session, answer) {
  const step = AUTOMATION_STEPS[session.step];
  if (!step || session.awards[step.id] !== undefined)
    return {
      session,
      correct: false,
      feedback: "Esta etapa já foi registrada.",
    };
  if (
    step.id === "diagnosis" &&
    !(session.runs.reference && session.runs.candidate)
  ) {
    return {
      session,
      correct: false,
      feedback:
        "Simule as duas fixtures antes de classificar. Não há penalização enquanto as evidências não estiverem completas.",
    };
  }
  const correct = isCorrect(step, answer, session);
  if (!correct)
    return {
      session: {
        ...session,
        mistakes: [...new Set([...session.mistakes, step.id])],
      },
      correct,
      feedback:
        step.hint +
        ` Tente novamente: a correção vale ${(step.points / 2).toLocaleString("pt-BR")} XP.`,
    };
  const points = session.mistakes.includes(step.id)
    ? step.points / 2
    : step.points;
  return {
    session: { ...session, awards: { ...session.awards, [step.id]: points } },
    correct,
    points,
    feedback: step.hint,
  };
}

export function advanceCheckpoint(session) {
  const current = AUTOMATION_STEPS[session.step];
  return current &&
    session.awards[current.id] !== undefined &&
    session.step < AUTOMATION_STEPS.length - 1
    ? { ...session, step: session.step + 1 }
    : session;
}

export function isLabComplete(session) {
  return AUTOMATION_STEPS.every(
    (step) => session.awards[step.id] !== undefined,
  );
}

export function labScore(session) {
  return Math.round(
    Object.values(session.awards).reduce((sum, points) => sum + points, 0),
  );
}

export function buildLabCode(session) {
  const done = (id) => session.awards[id] !== undefined;
  return [
    "// PSEUDOCÓDIGO DIDÁTICO · não executável",
    done("scenario")
      ? 'TEST "filtrar acessórios"'
      : "// TODO: definir comportamento",
    done("actions") ? "  OPEN catalog" : "  // TODO: ordenar ações",
    done("selector")
      ? '  TARGET [data-testid="category-filter"]'
      : "  // TODO: escolher seletor",
    done("actions") ? '  SELECT "accessories"' : "  // TODO: aplicar categoria",
    done("wait")
      ? "  WAIT results.ready WITH LIMIT 2s"
      : "  // TODO: sincronizar pela condição",
    done("assertion")
      ? '  ASSERT results.count > 0\n  ASSERT EVERY results.category EQUALS "accessories"'
      : "  // TODO: verificar o resultado",
  ].join("\n");
}
