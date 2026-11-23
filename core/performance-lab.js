export const PERFORMANCE_WINDOW_SECONDS = 60;
export const PERFORMANCE_LIMITS = Object.freeze({
  users: 300,
  mean: 2,
  p95: 3,
  errorRate: 1,
});

export const PERFORMANCE_SAMPLES = Object.freeze([
  Object.freeze({
    users: 100,
    requests: 6000,
    errors: 6,
    mean: 0.65,
    p95: 1.2,
  }),
  Object.freeze({
    users: 300,
    requests: 18000,
    errors: 90,
    mean: 1.4,
    p95: 2.6,
  }),
  Object.freeze({
    users: 600,
    requests: 24000,
    errors: 1920,
    mean: 3.8,
    p95: 6.5,
  }),
]);

export function formatPerformanceNumber(value) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

export function getPerformanceErrorRate(sample) {
  return (sample.errors / sample.requests) * 100;
}

export function isPerformanceStress(sample) {
  return sample.users > PERFORMANCE_LIMITS.users;
}

export function isPerformanceWithinLimits(sample) {
  return (
    sample.mean <= PERFORMANCE_LIMITS.mean &&
    sample.p95 <= PERFORMANCE_LIMITS.p95 &&
    getPerformanceErrorRate(sample) < PERFORMANCE_LIMITS.errorRate
  );
}

export function getCorrectPerformanceClassification(sample) {
  if (isPerformanceStress(sample)) return "stress";
  return isPerformanceWithinLimits(sample) ? "meets" : "reject";
}

export function getPerformanceObservation(sample) {
  return (
    formatPerformanceNumber(sample.requests) +
    " requisições em " +
    PERFORMANCE_WINDOW_SECONDS +
    " s (" +
    formatPerformanceNumber(sample.requests / PERFORMANCE_WINDOW_SECONDS) +
    " req/s); média " +
    formatPerformanceNumber(sample.mean) +
    " s; p95 " +
    formatPerformanceNumber(sample.p95) +
    " s; " +
    formatPerformanceNumber(sample.errors) +
    " erros (" +
    formatPerformanceNumber(getPerformanceErrorRate(sample)) +
    "%)."
  );
}

export function getPerformanceExpected(sample) {
  return isPerformanceStress(sample)
    ? "Observar se há degradação acima da carga prevista. Usar média ≤ 2 s, p95 ≤ 3 s e erros < 1% como referência, sem promessa de aprovação para 600 usuários."
    : "Neste patamar até 300 usuários: média ≤ 2 s, p95 ≤ 3 s e erros < 1%, simultaneamente.";
}

export function getPerformanceImpact(sample) {
  if (isPerformanceStress(sample))
    return "Buscas e filtros demoram mais; 1.920 requisições retornam HTTP 503. O cliente pode esperar ou precisar tentar novamente. De 300 para 600 usuários, o volume sobe de 18.000 para 24.000 requisições, sem acompanhar proporcionalmente o aumento de usuários.";
  return (
    "Buscas e filtros respondem dentro dos limites combinados. Há " +
    formatPerformanceNumber(sample.errors) +
    " respostas com erro nesta janela, abaixo de 1%; atender ao limite não significa ausência de falhas."
  );
}

export function getPerformanceInterpretation(sample) {
  return isPerformanceStress(sample)
    ? "Os limites de referência foram ultrapassados em 600 usuários. Investigue a degradação e a capacidade; isso não reprova automaticamente os resultados até 300. Não se determinou a capacidade máxima nem a causa raiz."
    : "Média, p95 e erros atendem juntos aos critérios neste patamar de carga. A quantidade de requisições, sozinha, não determina aprovação.";
}

export function getPerformanceClassificationLabel(sample) {
  return isPerformanceStress(sample)
    ? "Estresse: investigar degradação"
    : "Carga: critérios atendidos";
}

export function createInitialPerformanceState() {
  return {
    step: 0,
    planning: {},
    planningMistakes: [],
    planningFeedback: {},
    profileConfirmed: false,
    executed: [],
    records: {},
    sampleMistakes: [],
    classificationFeedback: "",
    review: { decision: "", reason: "" },
    reviewMistakes: [],
    reviewPoints: { decision: 0, reason: 0 },
    reviewFeedback: "",
    finished: false,
  };
}

export function getPerformanceScore(state) {
  return (
    Object.values(state.planning).reduce((total, points) => total + points, 0) +
    state.executed.length * 10 +
    Object.values(state.records).reduce((total, points) => total + points, 0) +
    state.reviewPoints.decision +
    state.reviewPoints.reason
  );
}

export function performanceLabReducer(state, action) {
  if (state.finished && action.type !== "restart") return state;

  switch (action.type) {
    case "submit-question":
      if (state.planning.question) return state;
      if (action.value !== "capacity")
        return {
          ...state,
          planningMistakes: state.planningMistakes.includes("question")
            ? state.planningMistakes
            : [...state.planningMistakes, "question"],
          planningFeedback: {
            ...state.planningFeedback,
            question:
              "A campanha pergunta sobre resposta e erros sob uso simultâneo. A correção isolada é Sanidade; a compra de ponta a ponta é E2E.",
          },
        };
      return {
        ...state,
        planning: {
          ...state.planning,
          question: state.planningMistakes.includes("question") ? 5 : 10,
        },
        planningFeedback: {
          ...state.planningFeedback,
          question:
            "Pergunta definida: desempenho da busca e do filtro sob a carga prevista.",
        },
      };

    case "submit-criteria":
      if (!state.planning.question || state.planning.criteria) return state;
      if (action.value !== "all")
        return {
          ...state,
          planningMistakes: state.planningMistakes.includes("criteria")
            ? state.planningMistakes
            : [...state.planningMistakes, "criteria"],
          planningFeedback: {
            ...state.planningFeedback,
            criteria:
              "A média pode esconder respostas lentas, e alto volume pode incluir muitos erros. Use média, p95 e taxa de erros juntos nos patamares até 300 usuários.",
          },
        };
      return {
        ...state,
        planning: {
          ...state.planning,
          criteria: state.planningMistakes.includes("criteria") ? 5 : 10,
        },
        planningFeedback: {
          ...state.planningFeedback,
          criteria:
            "Critérios definidos em conjunto: média ≤ 2 s, p95 ≤ 3 s e erros < 1%.",
        },
      };

    case "set-profile":
      return { ...state, profileConfirmed: action.value };

    case "run":
      if (
        !state.planning.question ||
        !state.planning.criteria ||
        !state.profileConfirmed ||
        state.executed.includes(state.step)
      )
        return state;
      return { ...state, executed: [...state.executed, state.step] };

    case "classify": {
      if (!state.executed.includes(state.step) || state.records[state.step])
        return state;
      const sample = PERFORMANCE_SAMPLES[state.step];
      const correct = getCorrectPerformanceClassification(sample);
      if (action.value !== correct) {
        const mistake = "sample-" + state.step;
        return {
          ...state,
          sampleMistakes: state.sampleMistakes.includes(mistake)
            ? state.sampleMistakes
            : [...state.sampleMistakes, mistake],
          classificationFeedback:
            getPerformanceInterpretation(sample) +
            " Corrija sua interpretação para ganhar 5 XP.",
        };
      }
      const mistake = "sample-" + state.step;
      const points = state.sampleMistakes.includes(mistake) ? 5 : 10;
      return {
        ...state,
        records: { ...state.records, [state.step]: points },
        classificationFeedback:
          getPerformanceInterpretation(sample) + " +" + points + " XP.",
      };
    }

    case "next":
      if (!state.records[state.step]) return state;
      if (state.step >= PERFORMANCE_SAMPLES.length - 1) return state;
      return {
        ...state,
        step: state.step + 1,
        classificationFeedback: "",
      };

    case "set-review":
      if (!["decision", "reason"].includes(action.field)) return state;
      return {
        ...state,
        review: { ...state.review, [action.field]: action.value },
        reviewFeedback: "",
      };

    case "submit-review":
      if (
        Object.keys(state.records).length !== PERFORMANCE_SAMPLES.length ||
        !state.review.decision ||
        !state.review.reason
      )
        return state;
      const correctDecision = state.review.decision === "scoped";
      const correctReason = state.review.reason === "metrics";
      let reviewMistakes = [...state.reviewMistakes];
      if (!correctDecision) reviewMistakes = [...reviewMistakes, "decision"];
      if (!correctReason) reviewMistakes = [...reviewMistakes, "reason"];
      const reviewPoints = { ...state.reviewPoints };
      if (correctDecision && !reviewPoints.decision)
        reviewPoints.decision =
          state.reviewMistakes.includes("decision") ||
          reviewMistakes.includes("decision")
            ? 5
            : 10;
      if (correctReason && !reviewPoints.reason)
        reviewPoints.reason =
          state.reviewMistakes.includes("reason") ||
          reviewMistakes.includes("reason")
            ? 5
            : 10;
      if (correctDecision && correctReason)
        return {
          ...state,
          reviewMistakes,
          reviewPoints,
          finished: true,
          reviewFeedback: "",
        };
      return {
        ...state,
        reviewMistakes,
        reviewPoints,
        reviewFeedback:
          "Em 100 e 300 usuários, média, p95 e erros atendem aos critérios. Em 600, há degradação de estresse para investigar, sem reprovar a carga prevista. Nenhuma missão isolada comprova capacidade sob esta carga. Cada item corrigido vale 5 XP.",
      };

    case "restart":
      return createInitialPerformanceState();

    default:
      return state;
  }
}
