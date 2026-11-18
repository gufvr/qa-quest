export const SANITY_UNIT_PRICE_CENTS = 18990;
export const SANITY_EXTRA_FEE_CENTS = 1500;
export const SANITY_STEP_IDS = ["open", "fields", "consistency", "empty"];
export const SANITY_STEP_LABELS = [
  "Abrir Checkout",
  "Validar campos",
  "Conferir dados",
  "Carrinho vazio",
];
export const SANITY_STEP_INSTRUCTIONS = [
  "Com um item no carrinho, o Checkout deve abrir entrega e pagamento sem retornar 503.",
  "Preencha dados fictícios e selecione um pagamento para verificar se os campos estão utilizáveis.",
  "Compare o mesmo item, a quantidade e o total. O frete é grátis e nenhuma taxa adicional foi contratada.",
  "Neste caso separado, um carrinho vazio deve impedir a abertura do Checkout e pedir que um item seja adicionado.",
];
export const SANITY_PAYMENT_LABELS = {
  pix: "Pix de teste",
  card: "Cartão de teste · final 4242",
};

const money = (cents) =>
  (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export function createInitialSanityState() {
  return {
    step: 0,
    quantity: 1,
    cart: null,
    checkoutTotal: null,
    paymentLabel: null,
    address: "",
    cep: "",
    payment: "",
    fieldValidity: null,
    fieldsFeedback: "",
    actions: [],
    records: {},
    classificationAttempts: {},
    classificationFeedback: "",
    decision: "",
    reason: "",
    decisionAttempts: 0,
    reasonAttempts: 0,
    decisionPoints: 0,
    reasonPoints: 0,
    reviewFeedback: "",
    emptyGuard: false,
    finished: false,
  };
}

export function getSanityStepId(state) {
  return SANITY_STEP_IDS[state.step];
}

export function getSanityScore(state) {
  return (
    state.actions.length * 10 +
    Object.values(state.records).reduce(
      (total, record) => total + record.points,
      0,
    ) +
    state.decisionPoints +
    state.reasonPoints
  );
}

export function getSanityCheck(state, id) {
  const index = SANITY_STEP_IDS.indexOf(id);
  const common = {
    title: SANITY_STEP_LABELS[index],
    outcome: "pass",
  };

  if (id === "open")
    return {
      ...common,
      action:
        "Abrir /checkout com " +
        state.cart.quantity +
        " unidade(s) da Mochila Urbana.",
      expected:
        "O Checkout deve responder sem 503 e exibir entrega e pagamento.",
      observed:
        "HTTP 200 OK. A tela exibiu entrega e pagamento; o 503 da FF-2026.10 não foi reproduzido.",
      impact:
        "O impedimento original de abertura foi corrigido. A coerência dos dados ainda precisa ser verificada.",
    };

  if (id === "fields")
    return {
      ...common,
      action:
        "Preencher endereço e CEP fictícios e selecionar uma forma de pagamento de teste.",
      expected:
        "Os campos de entrega devem aceitar dados válidos e permitir escolher o pagamento.",
      observed:
        "Endereço e CEP foram aceitos. Opção selecionada: " +
        state.paymentLabel +
        ". Nenhum pedido ou pagamento foi enviado.",
      impact:
        "O cliente consegue informar os dados essenciais na área que voltou a carregar.",
    };

  if (id === "consistency")
    return {
      ...common,
      outcome: "fail",
      action: "Comparar item, quantidade e total do carrinho com o Checkout.",
      expected:
        "Manter " +
        state.cart.quantity +
        " unidade(s) da Mochila Urbana e total " +
        money(state.cart.total) +
        ", com frete grátis.",
      observed:
        "Item e quantidade foram mantidos, mas o Checkout mostra " +
        money(state.checkoutTotal) +
        ": R$ 15,00 a mais, sem taxa contratada.",
      impact:
        "O cliente pode pagar mais do que o total confirmado. A candidata precisa de ajuste, embora o 503 tenha sido corrigido.",
    };

  return {
    ...common,
    action: "Tentar abrir o Checkout com um carrinho vazio separado.",
    expected:
      "Permanecer no carrinho e pedir um item antes de abrir o Checkout.",
    observed:
      "A loja manteve o cliente no carrinho e exibiu Adicione um item antes de continuar.",
    impact:
      "O fluxo evita uma finalização sem produtos. Essa condição próxima está funcionando.",
  };
}

export function sanityTestReducer(state, action) {
  if (state.finished && action.type !== "restart") return state;

  switch (action.type) {
    case "set-quantity":
      if (getSanityStepId(state) !== "open" || state.actions.includes("open"))
        return state;
      if (![1, 2, 3].includes(action.value)) return state;
      return { ...state, quantity: action.value };

    case "open-checkout":
      if (getSanityStepId(state) !== "open" || state.actions.includes("open"))
        return state;
      return {
        ...state,
        cart: {
          quantity: state.quantity,
          total: state.quantity * SANITY_UNIT_PRICE_CENTS,
        },
        checkoutTotal:
          state.quantity * SANITY_UNIT_PRICE_CENTS + SANITY_EXTRA_FEE_CENTS,
        actions: [...state.actions, "open"],
      };

    case "set-field":
      if (
        getSanityStepId(state) !== "fields" ||
        state.actions.includes("fields") ||
        !["address", "cep", "payment"].includes(action.field)
      )
        return state;
      return { ...state, [action.field]: action.value };

    case "submit-fields": {
      if (
        getSanityStepId(state) !== "fields" ||
        state.actions.includes("fields")
      )
        return state;
      const fieldValidity = {
        address: state.address.trim().length >= 5,
        cep: /^\d{5}-?\d{3}$/.test(state.cep.trim()),
        payment: Object.hasOwn(SANITY_PAYMENT_LABELS, state.payment),
      };
      if (Object.values(fieldValidity).includes(false))
        return {
          ...state,
          fieldValidity,
          fieldsFeedback:
            "Use um endereço fictício com pelo menos 5 caracteres, CEP com 8 dígitos e escolha um pagamento de teste.",
        };
      return {
        ...state,
        fieldValidity,
        paymentLabel: SANITY_PAYMENT_LABELS[state.payment],
        fieldsFeedback:
          "Dados de teste aceitos. Nenhum pedido ou pagamento foi realizado. O formulário fica somente para consulta após esta verificação.",
        actions: [...state.actions, "fields"],
      };
    }

    case "compare-data":
      if (
        getSanityStepId(state) !== "consistency" ||
        state.actions.includes("consistency") ||
        !state.cart
      )
        return state;
      return { ...state, actions: [...state.actions, "consistency"] };

    case "open-empty-checkout":
      if (getSanityStepId(state) !== "empty" || state.actions.includes("empty"))
        return state;
      return {
        ...state,
        emptyGuard: true,
        actions: [...state.actions, "empty"],
      };

    case "classify": {
      const id = getSanityStepId(state);
      if (
        !state.actions.includes(id) ||
        state.records[id] ||
        !["pass", "fail"].includes(action.value)
      )
        return state;
      const attempt = (state.classificationAttempts[id] || 0) + 1;
      const classificationAttempts = {
        ...state.classificationAttempts,
        [id]: attempt,
      };
      const check = getSanityCheck(state, id);
      if (action.value !== check.outcome)
        return {
          ...state,
          classificationAttempts,
          classificationFeedback:
            "Compare novamente. Esperado: " +
            check.expected +
            " Observado: " +
            check.observed +
            " Corrigir esta resposta valerá 5 XP.",
        };
      const record = { points: attempt === 1 ? 10 : 5 };
      return {
        ...state,
        classificationAttempts,
        records: { ...state.records, [id]: record },
        classificationFeedback:
          "Evidência registrada. " +
          check.impact +
          " +" +
          record.points +
          " XP pela classificação.",
      };
    }

    case "next-step":
      if (
        !state.records[getSanityStepId(state)] ||
        state.step >= SANITY_STEP_IDS.length - 1
      )
        return state;
      return {
        ...state,
        step: state.step + 1,
        classificationFeedback: "",
      };

    case "set-review":
      if (Object.keys(state.records).length !== SANITY_STEP_IDS.length)
        return state;
      if (!["decision", "reason"].includes(action.field)) return state;
      return {
        ...state,
        [action.field]: action.value,
        reviewFeedback: "",
      };

    case "submit-review": {
      if (Object.keys(state.records).length !== SANITY_STEP_IDS.length)
        return state;
      if (!state.decision || !state.reason)
        return {
          ...state,
          reviewFeedback: "Selecione o parecer e a evidência que o fundamenta.",
        };
      const decisionAttempts = state.decisionAttempts + 1;
      const reasonAttempts = state.reasonAttempts + 1;
      const correctDecision = state.decision === "return";
      const correctReason = state.reason === "total";
      const decisionPoints =
        correctDecision && !state.decisionPoints
          ? decisionAttempts === 1
            ? 10
            : 5
          : state.decisionPoints;
      const reasonPoints =
        correctReason && !state.reasonPoints
          ? reasonAttempts === 1
            ? 10
            : 5
          : state.reasonPoints;
      if (correctDecision && correctReason)
        return {
          ...state,
          decisionAttempts,
          reasonAttempts,
          decisionPoints,
          reasonPoints,
          finished: true,
          reviewFeedback: "",
        };
      const messages = [];
      if (!correctDecision)
        messages.push(
          "A verificação do defeito 503 passou, mas isso não aprova a candidata inteira. Devolva a FF-2026.10.1: o Checkout cobra R$ 15,00 a mais que o carrinho sem taxa contratada.",
        );
      if (!correctReason)
        messages.push(
          "O Checkout respondeu 200 e o 503 não se reproduziu. Para decidir sobre a candidata inteira, considere a evidência que ainda falha: o total diverge do carrinho. Sanidade cobre a correção e seu entorno; não exige executar toda a regressão nesta missão.",
        );
      messages.push(
        "Revise o parecer. Cada resposta incorreta valerá 5 XP quando corrigida.",
      );
      return {
        ...state,
        decisionAttempts,
        reasonAttempts,
        decisionPoints,
        reasonPoints,
        reviewFeedback: messages.join(" "),
      };
    }

    case "restart":
      return createInitialSanityState();

    default:
      return state;
  }
}
