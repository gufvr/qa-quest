export const API_PRODUCTS = Object.freeze([
  {
    id: "P-URB-01",
    name: "Mochila Urbana",
    category: "accessories",
    price: 189.9,
  },
  {
    id: "P-NOT-02",
    name: "Mochila Notebook",
    category: "technology",
    price: 249.9,
  },
]);

export const API_CHECKOUT_BODY = Object.freeze({
  items: [{ productId: "P-URB-01", quantity: 2 }],
  deliveryAddress: {
    zipCode: "00000-000",
    street: "Rua de Teste, 100 — Cidade Exemplo",
  },
  paymentMethod: "pix",
});

export const API_ORDER_BODY = Object.freeze({
  orderId: "FF-API-1042",
  status: "pending_payment",
  items: [{ productId: "P-URB-01", quantity: 2, unitPrice: 189.9 }],
  total: 379.8,
});

export function apiCheckoutResponse(orderId) {
  return {
    orderId,
    status: "pending_payment",
    itemsTotal: 379.8,
    deliveryFee: 0,
    total: 379.8,
  };
}

export const API_CASES = Object.freeze([
  {
    id: "catalog",
    title: "Catálogo: controle e candidata",
    method: "GET",
    path: "/api/catalog",
    query: "category=accessories",
    body: null,
    points: 10,
    profile: "Referência fixa do contrato versus fixture da candidata.",
    instruction:
      "Simule a referência e depois a candidata, com a categoria Acessórios.",
    contract:
      "GET /api/catalog?category=accessories → 200 OK. items deve conter somente acessórios; total deve ser inteiro igual ao número de itens.",
    expectedStatus: "200 OK",
    expectedBody: { items: [API_PRODUCTS[0]], total: 1 },
    reference: {
      label: "Referência aderente · exemplo fixo",
      status: "200 OK",
      body: { items: [API_PRODUCTS[0]], total: 1 },
    },
    response: {
      label: "Candidata · API-01 · filtro ignorado",
      status: "200 OK",
      body: { items: API_PRODUCTS, total: 2 },
    },
    observed:
      "A referência retornou uma Mochila Urbana. A candidata retornou duas mochilas, incluindo Tecnologia.",
    impact: "Consumidores exibem produtos fora da categoria solicitada.",
    answer: ["filter"],
    classification: "Filtro ignorado; referência aderente.",
    options: [
      ["pass", "Contrato atendido pela candidata, pois as respostas são 200."],
      [
        "filter",
        "Filtro ignorado pela candidata; a referência respeitou a categoria.",
      ],
      [
        "status",
        "Status HTTP divergente: o GET deveria criar um pedido com 201.",
      ],
      ["missing", "Campo obrigatório ausente: a resposta não contém items."],
    ],
  },
  {
    id: "created",
    title: "Checkout: criação aderente",
    method: "POST",
    path: "/api/checkout",
    query: null,
    body: API_CHECKOUT_BODY,
    points: 5,
    profile: "Fixture API-02 · criação aderente.",
    instruction: "Envie itens, endereço e pagamento simulados.",
    contract:
      "POST /api/checkout exige 201 Created. Campos obrigatórios incluem orderId, status pending_payment, itemsTotal, deliveryFee e total.",
    expectedStatus: "201 Created",
    expectedBody: apiCheckoutResponse("FF-API-1042"),
    response: {
      label: "Candidata · API-02 · criação aderente",
      status: "201 Created",
      body: apiCheckoutResponse("FF-API-1042"),
    },
    observed: "201 Created; itens R$ 379,80; entrega grátis; total R$ 379,80.",
    impact: "A criação aderiu ao contrato neste perfil.",
    answer: ["pass"],
    classification: "Contrato atendido neste caso.",
    options: [
      ["status", "Status HTTP divergente: qualquer POST deve responder 200."],
      [
        "pass",
        "Contrato atendido: 201 indica criação e os campos e totais são coerentes.",
      ],
      ["paid", "Pagamento aprovado: pending_payment significa pago."],
      ["total", "Total divergente: 2 × 189,90 deveria ser 394,80."],
    ],
  },
  {
    id: "divergent",
    title: "Checkout: status e total divergentes",
    method: "POST",
    path: "/api/checkout",
    query: null,
    body: API_CHECKOUT_BODY,
    points: 5,
    profile: "Fixture API-03 · status e cálculo divergentes.",
    instruction: "Envie o mesmo body e confira status e soma.",
    contract: "Exige 201 Created e total 379.80 com entrega grátis.",
    expectedStatus: "201 Created",
    expectedBody: apiCheckoutResponse("FF-API-1043"),
    response: {
      label: "Candidata · API-03 · divergências",
      status: "200 OK",
      body: { ...apiCheckoutResponse("FF-API-1043"), total: 394.8 },
    },
    observed: "200 OK em vez de 201. Total R$ 394,80 em vez de R$ 379,80.",
    impact: "Status e total violam o contrato independentemente.",
    answer: ["status", "total"],
    classification: "Status HTTP e total divergentes.",
    options: [
      ["status", "Status HTTP divergente: veio 200 e o contrato exige 201."],
      ["pass", "Contrato atendido, porque 200 é sucesso e existe JSON."],
      ["total", "Total divergente: 394,80 difere de 379,80 + 0."],
      ["missing", "Campo obrigatório ausente: a resposta não tem orderId."],
    ],
  },
  {
    id: "order",
    title: "Pedido: campo obrigatório ausente",
    method: "GET",
    path: "/api/orders/FF-API-1042",
    query: null,
    body: null,
    points: 10,
    profile: "Fixture API-04 · total ausente.",
    instruction: "Consulte o pedido e compare todos os campos obrigatórios.",
    contract:
      "GET /api/orders/FF-API-1042 → 200 OK. orderId, status, items e total são obrigatórios.",
    expectedStatus: "200 OK",
    expectedBody: API_ORDER_BODY,
    response: {
      label: "Candidata · API-04 · total ausente",
      status: "200 OK",
      body: {
        orderId: API_ORDER_BODY.orderId,
        status: API_ORDER_BODY.status,
        items: API_ORDER_BODY.items,
      },
    },
    observed: "200 OK sem o campo obrigatório total.",
    impact: "O consumidor não recebe o total previsto pelo contrato.",
    answer: ["missing"],
    classification: "Campo obrigatório total ausente.",
    options: [
      ["pass", "Contrato atendido: status 200 garante todos os campos."],
      ["total", "Total divergente: a resposta enviou total 394,80."],
      ["missing", "Campo obrigatório ausente: total não foi enviado no body."],
      ["status", "Status HTTP divergente: consulta GET deveria responder 201."],
    ],
  },
]);

export function prettyApiJson(value) {
  return JSON.stringify(value, null, 2);
}

export function createInitialApiState() {
  return {
    step: 0,
    conceptPoints: 0,
    conceptMistake: false,
    concept: "",
    conceptFeedback: "",
    referenceDone: false,
    method: "",
    executions: {},
    records: {},
    mistakes: [],
    review: { decision: "", reason: "" },
    reviewAnswers: {},
    reviewMistakes: [],
    reviewPoints: {},
    reviewFeedback: "",
    finished: false,
  };
}

export function getApiScore(state) {
  return (
    state.conceptPoints +
    Object.entries(state.executions).reduce((total, [id]) => {
      const test = API_CASES.find((item) => item.id === id);
      return total + (test?.points || 0);
    }, 0) +
    Object.values(state.records).reduce((total, points) => total + points, 0) +
    Object.values(state.reviewPoints).reduce(
      (total, points) => total + points,
      0,
    )
  );
}

export function apiLabReducer(state, action) {
  if (state.finished && action.type !== "restart") return state;

  switch (action.type) {
    case "submit-concept":
      if (state.conceptPoints) return state;
      if (action.value !== "contract")
        return {
          ...state,
          conceptMistake: true,
          conceptFeedback:
            "Compare método, rota, dados enviados e resposta segundo o contrato.",
        };
      return {
        ...state,
        conceptPoints: state.conceptMistake ? 5 : 10,
        concept: "contract",
      };

    case "set-method":
      return { ...state, method: action.value };

    case "run-reference":
      if (
        state.method !== API_CASES[state.step].method ||
        state.referenceDone ||
        !API_CASES[state.step].reference
      )
        return state;
      return { ...state, referenceDone: true };

    case "execute": {
      const test = API_CASES[state.step];
      if (
        state.executions[test.id] ||
        state.method !== test.method ||
        (test.reference && !state.referenceDone)
      )
        return state;
      return {
        ...state,
        executions: { ...state.executions, [test.id]: true },
      };
    }

    case "classify": {
      const test = API_CASES[state.step];
      if (!state.executions[test.id] || state.records[test.id]) return state;
      const correct =
        action.values.length === test.answer.length &&
        test.answer.every((value) => action.values.includes(value));
      if (!correct)
        return {
          ...state,
          mistakes: state.mistakes.includes(test.id)
            ? state.mistakes
            : [...state.mistakes, test.id],
        };
      return {
        ...state,
        records: {
          ...state.records,
          [test.id]: state.mistakes.includes(test.id) ? 5 : 10,
        },
      };
    }

    case "next":
      if (!state.records[API_CASES[state.step].id]) return state;
      if (state.step >= API_CASES.length - 1) return state;
      return {
        ...state,
        step: state.step + 1,
        referenceDone: false,
        method: "",
      };

    case "set-review":
      return {
        ...state,
        review: { ...state.review, [action.field]: action.value },
      };

    case "submit-review":
      if (
        Object.keys(state.records).length !== API_CASES.length ||
        !state.review.decision ||
        !state.review.reason
      )
        return state;
      let reviewAnswers = { ...state.reviewAnswers };
      const reviewPoints = { ...state.reviewPoints };
      if (state.review.decision === "return" && !reviewAnswers.decision) {
        reviewAnswers.decision = "return";
        reviewPoints.decision = state.reviewMistakes.includes("decision")
          ? 5
          : 10;
      } else if (
        state.review.decision !== "return" &&
        !state.reviewMistakes.includes("decision")
      )
        return {
          ...state,
          reviewMistakes: [...state.reviewMistakes, "decision"],
          reviewFeedback:
            "A criação passou, mas filtro, status, total e campo ausente falharam.",
        };
      if (state.review.reason === "contracts" && !reviewAnswers.reason) {
        reviewAnswers.reason = "contracts";
        reviewPoints.reason = state.reviewMistakes.includes("reason") ? 5 : 10;
      } else if (
        state.review.reason !== "contracts" &&
        !state.reviewMistakes.includes("reason")
      )
        return {
          ...state,
          reviewMistakes: [...state.reviewMistakes, "reason"],
          reviewAnswers,
          reviewPoints,
          reviewFeedback:
            "A referência aderente não aprova a candidata; use os quatro achados.",
        };
      if (reviewAnswers.decision && reviewAnswers.reason)
        return {
          ...state,
          reviewAnswers,
          reviewPoints,
          finished: true,
          reviewFeedback: "",
        };
      return { ...state, reviewAnswers, reviewPoints };

    case "restart":
      return createInitialApiState();

    default:
      return state;
  }
}
