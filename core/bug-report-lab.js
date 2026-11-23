export const BUG_REPORT_REPORT = Object.freeze({
  title: "[Catálogo] Filtro Acessórios mantém Mochila Notebook nos resultados",
  environment:
    "Homologação fictícia · FF-2026.10.2 · navegador de laboratório desktop (simulado) · fikily.test/catalog.",
  preconditions:
    "Catálogo disponível, sem login obrigatório; Mochila Urbana em Acessórios e Mochila Notebook em Tecnologia.",
  expected:
    "Após buscar Mochila e selecionar Acessórios, exibir apenas Mochila Urbana: 1 resultado.",
  observed:
    "O seletor mostra Acessórios, mas a lista mantém Mochila Urbana (Acessórios) e Mochila Notebook (Tecnologia): 2 resultados.",
  impact:
    "Clientes recebem produtos fora da categoria. A navegação da campanha fica prejudicada; busca direta e compra continuam disponíveis.",
  severity:
    "S3 · Moderada — função de filtro prejudicada, com busca direta e compra disponíveis.",
  priority:
    "P1 · Tratar antes da campanha em 24 horas, que depende da navegação por categorias.",
  evidence:
    "EV-01 · Registro textual das ações: abrir catálogo → buscar Mochila → selecionar Acessórios → conferir a lista.\nEV-02 · Registro textual do estado: FF-2026.10.2; Acessórios selecionado; 2 resultados, incluindo Mochila Notebook (Tecnologia).",
  status:
    "Pronto para encaminhar à triagem no exercício. Causa raiz não confirmada.",
});

export const BUG_REPORT_STEPS = Object.freeze({
  open: "Abrir o catálogo da candidata FF-2026.10.2 no ambiente fictício.",
  search: "Buscar Mochila e conferir os dois produtos iniciais.",
  filter: "Selecionar a categoria Acessórios.",
  compare: "Comparar a lista com o esperado: somente Mochila Urbana.",
});

export const BUG_REPORT_ORDER = Object.freeze([
  "open",
  "search",
  "filter",
  "compare",
]);

export const BUG_REPORT_QUESTIONS = Object.freeze([
  {
    id: "title",
    title: "Um título que localiza o problema.",
    legend: "Qual título descreve ação e falha observável?",
    help: "Seja específico e evite afirmar uma causa não investigada.",
    answer: "specific",
    options: [
      ["vague", "O site está com problema."],
      ["specific", BUG_REPORT_REPORT.title],
      ["cause", "O banco de dados está quebrado por culpa do backend."],
    ],
    feedback:
      "O título indica Catálogo, filtro Acessórios e produto de outra categoria.",
    fields: [["Título", BUG_REPORT_REPORT.title]],
  },
  {
    id: "context",
    title: "Ambiente e pré-condições.",
    legend: "Qual contexto permite repetir o mesmo caso?",
    help: "Use a versão e os dados fornecidos.",
    answer: "complete",
    options: [
      ["missing", "Aconteceu hoje no meu computador, com alguns produtos."],
      [
        "complete",
        `${BUG_REPORT_REPORT.environment} Pré-condições: ${BUG_REPORT_REPORT.preconditions}`,
      ],
    ],
    feedback:
      "Informe homologação fictícia, candidata FF-2026.10.2 e os dois produtos.",
    fields: [
      ["Ambiente", BUG_REPORT_REPORT.environment],
      ["Pré-condições", BUG_REPORT_REPORT.preconditions],
    ],
  },
  {
    id: "steps",
    type: "order",
    title: "Passos mínimos e em ordem.",
    legend: "Organize as ações para outra pessoa reproduzir.",
    help: "A reprodução começa no catálogo e termina comparando o filtro.",
    feedback:
      "A sequência reproduzível é abrir catálogo, buscar Mochila, selecionar Acessórios e comparar.",
    fields: [
      [
        "Passos para reproduzir",
        BUG_REPORT_ORDER.map(
          (id, index) => `${index + 1}. ${BUG_REPORT_STEPS[id]}`,
        ).join("\n"),
      ],
    ],
  },
  {
    id: "behavior",
    title: "Esperado, observado e impacto.",
    legend: "Qual descrição separa os três pontos?",
    help: "Compare a referência com o resultado obtido.",
    answer: "facts",
    options: [
      ["guess", "Esperado: corrigir tudo. Observado: o banco falhou."],
      [
        "facts",
        "Esperado: somente Mochila Urbana. Observado: duas mochilas, incluindo Tecnologia. Impacto: clientes recebem itens fora da categoria.",
      ],
    ],
    feedback: "A lista deveria ter 1 resultado e continua com 2.",
    fields: [
      ["Resultado esperado", BUG_REPORT_REPORT.expected],
      ["Resultado observado", BUG_REPORT_REPORT.observed],
      ["Impacto", BUG_REPORT_REPORT.impact],
    ],
  },
  {
    id: "severity",
    title: "Severidade: qual é o impacto?",
    legend: "Qual severidade atende à escala desta equipe?",
    help: "Classifique o efeito observado.",
    answer: "s3",
    options: [
      ["s1", "S1 · Crítica: todas as compras estão bloqueadas."],
      ["s3", "S3 · Moderada: o filtro falha, com alternativas disponíveis."],
      ["s4", "S4 · Baixa: apenas diferença de aparência."],
    ],
    feedback: "Pela escala apresentada, o filtro prejudicado é S3.",
    fields: [["Severidade", BUG_REPORT_REPORT.severity]],
  },
  {
    id: "priority",
    title: "Prioridade: quando tratar?",
    legend: "Qual prioridade corresponde ao contexto da campanha?",
    help: "A urgência vem do negócio e do risco.",
    answer: "p1",
    options: [
      ["p2", "P2 · Próxima iteração."],
      ["p0", "P0 · Emergência em produção."],
      ["p1", "P1 · Tratar antes da campanha em 24 horas."],
    ],
    feedback: "A campanha depende de categorias: P1.",
    fields: [["Prioridade", BUG_REPORT_REPORT.priority]],
  },
  {
    id: "evidence",
    type: "multiple",
    title: "Evidências que sustentam o relato.",
    legend: "Selecione os dois registros úteis.",
    help: "Consulte os registros da reprodução.",
    answer: ["trace", "snapshot"],
    options: [
      [
        "trace",
        "EV-01 · Sequência catálogo → buscar Mochila → Acessórios → conferir lista.",
      ],
      ["cart", "EV-03 · Carrinho vazio sem categoria ou versão."],
      [
        "snapshot",
        "EV-02 · Candidata, filtro Acessórios, 2 resultados e referência de 1.",
      ],
      ["guess", "EV-04 · A causa é o banco de dados, sem investigação."],
    ],
    feedback: "EV-01 mostra reprodução e EV-02 registra comparação.",
    fields: [["Evidências selecionadas", BUG_REPORT_REPORT.evidence]],
  },
  {
    id: "decision",
    title: "O relato está pronto?",
    legend: "Qual é o parecer sobre este relato?",
    help: "Revise todos os campos antes de decidir.",
    answer: "ready",
    options: [
      ["fixed", "Defeito corrigido apenas pelo preenchimento."],
      ["ready", "Relato pronto para encaminhar à triagem."],
      ["production", "Aplicação aprovada para produção pelo relato."],
    ],
    feedback: "Completar o relato não corrige código nem aprova produção.",
    fields: [
      [
        "Parecer sobre o relato",
        "Pronto para encaminhar à triagem no exercício.",
      ],
    ],
  },
  {
    id: "reason",
    title: "Fundamente o encaminhamento.",
    legend: "Por que a equipe consegue investigar com este relato?",
    help: "Causa raiz não precisa ser adivinhada.",
    answer: "reproducible",
    options: [
      ["title-only", "Um título é suficiente."],
      ["root-cause", "É preciso afirmar causa no backend sem evidências."],
      [
        "reproducible",
        "Contexto, passos, comparação e impacto permitem reproduzir; severidade e prioridade estão justificadas.",
      ],
    ],
    feedback: "A qualidade da reprodução fundamenta a triagem.",
    fields: [["Encaminhamento e limites", BUG_REPORT_REPORT.status]],
  },
]);

export function createInitialBugReportState() {
  return {
    step: 0,
    captured: false,
    finished: false,
    points: {},
    mistakes: [],
    order: ["filter", "open", "compare", "search"],
    fields: {},
    feedback: "",
  };
}

export function getBugReportScore(state) {
  return Object.values(state.points).reduce(
    (total, points) => total + points,
    0,
  );
}

export function bugReportReducer(state, action) {
  if (state.finished && action.type !== "restart") return state;

  switch (action.type) {
    case "capture":
      if (state.captured) return state;
      return {
        ...state,
        captured: true,
        points: { ...state.points, reproduction: 10 },
        fields: {
          ...state.fields,
          Evidências:
            "EV-01 · ações registradas\nEV-02 · estado e comparação registrados",
        },
        feedback: "Reproduzido: Acessórios selecionado, mas 2 resultados.",
      };

    case "move-order":
      if (state.points.steps) return state;
      const current = state.order.indexOf(action.id);
      const target = current + action.offset;
      if (target < 0 || target >= state.order.length) return state;
      const order = [...state.order];
      [order[current], order[target]] = [order[target], order[current]];
      return { ...state, order };

    case "submit-answer": {
      const question = BUG_REPORT_QUESTIONS[state.step];
      if (!state.captured || state.points[question.id]) return state;
      let valid = false;
      if (question.type === "order")
        valid = state.order.every(
          (id, index) => id === BUG_REPORT_ORDER[index],
        );
      else if (question.type === "multiple")
        valid =
          action.values.length === question.answer.length &&
          question.answer.every((value) => action.values.includes(value));
      else
        valid =
          action.values.length === 1 && action.values[0] === question.answer;
      if (!valid) {
        return {
          ...state,
          mistakes: state.mistakes.includes(question.id)
            ? state.mistakes
            : [...state.mistakes, question.id],
          feedback: question.feedback + " Ao corrigir, este item vale 5 XP.",
        };
      }
      const points = state.mistakes.includes(question.id) ? 5 : 10;
      const fields = { ...state.fields };
      question.fields.forEach(([label, value]) => {
        fields[label] = value;
      });
      return {
        ...state,
        points: { ...state.points, [question.id]: points },
        fields,
        feedback: `Confirmado. ${question.feedback} +${points} XP.`,
      };
    }

    case "next":
      if (!state.points[BUG_REPORT_QUESTIONS[state.step].id]) return state;
      if (state.step === BUG_REPORT_QUESTIONS.length - 1) {
        return { ...state, finished: true };
      }
      return { ...state, step: state.step + 1, feedback: "" };

    case "restart":
      return createInitialBugReportState();

    default:
      return state;
  }
}
