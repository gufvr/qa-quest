export const REGRESSION_UNIT_PRICE_CENTS = 18990;
export const REGRESSION_CASES = [
  { id: "login", title: "Login e painel", path: "login" },
  { id: "catalog", title: "Busca e filtro", path: "catalog" },
  { id: "cart", title: "Carrinho", path: "cart" },
  { id: "checkout", title: "Checkout corrigido", path: "checkout" },
  { id: "history", title: "Histórico do pedido", path: "orders" },
];
export const REGRESSION_PRODUCTS = [
  {
    name: "Mochila Urbana",
    category: "accessories",
    label: "Acessórios",
    price: REGRESSION_UNIT_PRICE_CENTS,
  },
  {
    name: "Mochila Notebook",
    category: "technology",
    label: "Tecnologia",
    price: 24990,
  },
];
export const REGRESSION_PAYMENT_LABELS = {
  pix: "Pix de teste",
  card: "Cartão de teste · final 4242",
};

const money = (cents) =>
  (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
const has = (state, id) => state.actions.includes(id);
const currentId = (state) => REGRESSION_CASES[state.step]?.id;

export function createInitialRegressionState() {
  return {
    step: 0,
    actions: [],
    records: {},
    mistakes: [],
    reviewMistakes: [],
    reviewPoints: { decision: 0, reason: 0 },
    email: "qa@fikily.test",
    password: "Fvr123!",
    loginFeedback: "",
    loginComplete: false,
    search: "",
    searched: false,
    filter: "all",
    catalogFeedback: "",
    cartAdded: false,
    quantity: 1,
    cart: null,
    cartFeedback: "",
    address: "",
    cep: "",
    payment: "",
    paymentLabel: null,
    fieldValidity: null,
    checkoutFeedback: "",
    order: null,
    decision: "",
    reason: "",
    reviewFeedback: "",
    finished: false,
  };
}

export function getRegressionScore(state) {
  return (
    state.actions.length * 8 +
    Object.values(state.records).reduce(
      (total, record) => total + record.points,
      0,
    ) +
    state.reviewPoints.decision +
    state.reviewPoints.reason
  );
}

export function getRegressionCheck(state, id) {
  const index = REGRESSION_CASES.findIndex((check) => check.id === id);
  const base = {
    title: REGRESSION_CASES[index].title,
    outcome: id === "catalog" ? "fail" : "pass",
    path: REGRESSION_CASES[index].path,
  };
  const cartCopy = state.cart
    ? state.cart.quantity + " × Mochila Urbana · " + money(state.cart.total)
    : "Mochila Urbana com quantidade e total coerentes";

  if (id === "login")
    return {
      ...base,
      instruction:
        "Use a conta fictícia fornecida para entrar e verificar o painel.",
      baseline:
        "A conta de teste entrava e o painel era exibido com acesso autorizado.",
      action: "Entrar com qa@fikily.test e abrir o painel.",
      expected: "Acesso autorizado e painel da Pessoa de teste carregado.",
      observed:
        "Acesso autorizado. O painel da Pessoa de teste carregou com pedidos e endereços.",
      impact: "O acesso à conta continua disponível nesta candidata.",
    };

  if (id === "catalog") {
    const category =
      state.filter === "technology" ? "Tecnologia" : "Acessórios";
    const product =
      state.filter === "technology" ? "Mochila Notebook" : "Mochila Urbana";
    return {
      ...base,
      instruction:
        "Busque Mochila, selecione Acessórios ou Tecnologia e confira se a lista respeita a categoria.",
      baseline:
        "A busca Mochila retornava dois produtos. Acessórios deixava apenas Mochila Urbana; Tecnologia, apenas Mochila Notebook.",
      action: "Buscar Mochila e aplicar a categoria " + category + ".",
      expected:
        state.filter !== "all"
          ? "O filtro " +
            category +
            " deve deixar somente " +
            product +
            " (1 resultado)."
          : "Buscar Mochila retorna dois produtos; selecionar uma categoria deve deixar somente os produtos correspondentes.",
      observed:
        "A busca encontrou as duas mochilas. O filtro mostra " +
        category +
        " selecionado, mas a lista mantém Mochila Urbana (Acessórios) e Mochila Notebook (Tecnologia): 2 resultados.",
      impact:
        "A busca funciona, mas o filtro deixou de restringir os produtos. O cliente recebe itens fora da categoria. A candidata exige investigação ou ajuste.",
    };
  }

  if (id === "cart")
    return {
      ...base,
      instruction:
        "Adicione a Mochila Urbana, altere para 2 ou 3 unidades e confira o total.",
      baseline:
        "Adicionar uma Mochila Urbana e alterar para 2 unidades atualizava o total para R$ 379,80; 3 unidades totalizavam R$ 569,70.",
      action:
        "Adicionar Mochila Urbana e alterar a quantidade para " +
        (state.cart?.quantity || "2 ou 3") +
        ".",
      expected: "Quantidade selecionada × R$ 189,90, sem taxas adicionais.",
      observed:
        cartCopy +
        ". O total corresponde ao preço unitário multiplicado pela quantidade.",
      impact:
        "O cliente continua conseguindo adicionar o produto e atualizar o carrinho com o valor correto.",
    };

  if (id === "checkout")
    return {
      ...base,
      instruction:
        "Use dados fictícios, escolha o pagamento e compare o total com o carrinho de referência.",
      baseline:
        "O Checkout carregava entrega e pagamento e preservava item, quantidade e total do carrinho, com frete grátis.",
      action:
        "Abrir o Checkout preparado, preencher entrega e escolher " +
        (state.paymentLabel || "um pagamento de teste") +
        ".",
      expected:
        "HTTP 200, campos utilizáveis e o mesmo item, quantidade e total do carrinho: " +
        cartCopy +
        ".",
      observed:
        "HTTP 200. Entrega aceita e pagamento selecionado: " +
        (state.paymentLabel || "não informado") +
        ". Checkout: " +
        cartCopy +
        ". Taxas: R$ 0,00. O 503 e os R$ 15,00 indevidos não se reproduziram.",
      impact:
        "Os defeitos anteriores do Checkout estão corrigidos nos dados testados. Isso não elimina a falha de regressão no catálogo.",
    };

  return {
    ...base,
    instruction:
      "Crie um pedido apenas no simulador e compare a confirmação com o histórico.",
    baseline:
      "O pedido de teste aparecia no histórico com o mesmo identificador, itens, quantidade e total da confirmação.",
    action:
      "Criar o pedido local FF-REG-1042 e comparar confirmação e histórico.",
    expected:
      "Mesmo pedido FF-REG-1042, mesmo item e quantidade e mesmo total nas duas telas.",
    observed:
      "Confirmação e histórico mostram FF-REG-1042 · " +
      cartCopy +
      " · " +
      (state.paymentLabel || "Pagamento de teste") +
      ". Dados coincidem; nenhum pedido ou pagamento real foi realizado.",
    impact:
      "O cliente continua conseguindo consultar os dados coerentes de seu pedido. Este caso usa um pedido isolado de teste.",
  };
}

export function getRegressionCaseStatus(state, id) {
  if (state.records[id]) return id === "catalog" ? "Falhou · filtro" : "Passou";
  if (has(state, id)) return "Classifique a evidência";
  return id === currentId(state) ? "Em execução" : "Próximo caso";
}

export function regressionTestReducer(state, action) {
  if (state.finished && action.type !== "restart") return state;

  switch (action.type) {
    case "set-login": {
      if (currentId(state) !== "login" || has(state, "login")) return state;
      if (!["email", "password"].includes(action.field)) return state;
      return { ...state, [action.field]: action.value };
    }

    case "submit-login":
      if (currentId(state) !== "login" || has(state, "login")) return state;
      if (
        state.email.trim().toLowerCase() !== "qa@fikily.test" ||
        state.password !== "Fvr123!"
      )
        return {
          ...state,
          loginFeedback:
            "Use apenas a conta de teste fornecida: qa@fikily.test · Fvr123!.",
        };
      return {
        ...state,
        loginComplete: true,
        loginFeedback: "",
        actions: [...state.actions, "login"],
      };

    case "set-search":
      if (currentId(state) !== "catalog" || has(state, "catalog")) return state;
      return { ...state, search: action.value };

    case "submit-search":
      if (currentId(state) !== "catalog" || has(state, "catalog")) return state;
      if (state.search.trim().toLowerCase() !== "mochila")
        return {
          ...state,
          catalogFeedback:
            "Este caso conhecido usa a busca Mochila. Repita os mesmos dados da referência para comparar.",
        };
      return { ...state, searched: true, catalogFeedback: "" };

    case "set-filter":
      if (
        currentId(state) !== "catalog" ||
        !state.searched ||
        !["all", "accessories", "technology"].includes(action.value)
      )
        return state;
      return { ...state, filter: action.value };

    case "check-filter":
      if (
        currentId(state) !== "catalog" ||
        has(state, "catalog") ||
        !state.searched
      )
        return state;
      if (!["accessories", "technology"].includes(state.filter))
        return {
          ...state,
          catalogFeedback:
            "Escolha Acessórios ou Tecnologia antes de conferir o resultado.",
        };
      return {
        ...state,
        catalogFeedback: "",
        actions: [...state.actions, "catalog"],
      };

    case "add-product":
      if (currentId(state) !== "cart" || has(state, "cart")) return state;
      return { ...state, cartAdded: true };

    case "set-quantity":
      if (
        currentId(state) !== "cart" ||
        !state.cartAdded ||
        has(state, "cart") ||
        ![1, 2, 3].includes(action.value)
      )
        return state;
      return { ...state, quantity: action.value };

    case "check-cart":
      if (currentId(state) !== "cart" || has(state, "cart") || !state.cartAdded)
        return state;
      if (![2, 3].includes(state.quantity))
        return {
          ...state,
          cartFeedback:
            "Altere para 2 ou 3 unidades para verificar também a atualização do total.",
        };
      return {
        ...state,
        cart: {
          quantity: state.quantity,
          total: state.quantity * REGRESSION_UNIT_PRICE_CENTS,
        },
        cartFeedback:
          "Quantidade e total atualizados: " +
          state.quantity +
          " unidade(s) · " +
          money(state.quantity * REGRESSION_UNIT_PRICE_CENTS) +
          ".",
        actions: [...state.actions, "cart"],
      };

    case "set-checkout-field":
      if (
        currentId(state) !== "checkout" ||
        has(state, "checkout") ||
        !["address", "cep", "payment"].includes(action.field)
      )
        return state;
      return { ...state, [action.field]: action.value };

    case "submit-checkout": {
      if (
        currentId(state) !== "checkout" ||
        has(state, "checkout") ||
        !state.cart
      )
        return state;
      const fieldValidity = {
        address: state.address.trim().length >= 5,
        cep: /^\d{5}-?\d{3}$/.test(state.cep.trim()),
        payment: Object.hasOwn(REGRESSION_PAYMENT_LABELS, state.payment),
      };
      if (Object.values(fieldValidity).includes(false))
        return {
          ...state,
          fieldValidity,
          checkoutFeedback:
            "Use endereço fictício com pelo menos 5 caracteres, CEP com 8 dígitos e um pagamento simulado.",
        };
      return {
        ...state,
        fieldValidity,
        paymentLabel: REGRESSION_PAYMENT_LABELS[state.payment],
        checkoutFeedback:
          "Campos aceitos e total preservado. Nenhum pagamento foi processado.",
        actions: [...state.actions, "checkout"],
      };
    }

    case "create-order":
      if (
        currentId(state) !== "history" ||
        has(state, "history") ||
        !state.cart ||
        state.order
      )
        return state;
      return {
        ...state,
        order: {
          id: "FF-REG-1042",
          ...state.cart,
          payment: state.paymentLabel,
        },
      };

    case "check-history":
      if (
        currentId(state) !== "history" ||
        has(state, "history") ||
        !state.order
      )
        return state;
      return { ...state, actions: [...state.actions, "history"] };

    case "classify": {
      const id = currentId(state);
      if (
        !has(state, id) ||
        state.records[id] ||
        !["pass", "fail"].includes(action.value)
      )
        return state;
      const check = getRegressionCheck(state, id);
      if (action.value !== check.outcome)
        return {
          ...state,
          mistakes: state.mistakes.includes(id)
            ? state.mistakes
            : [...state.mistakes, id],
          classificationFeedback:
            "Compare a referência com o resultado. Esperado: " +
            check.expected +
            " Observado: " +
            check.observed +
            " A resposta corrigida vale 4 XP.",
        };
      const points = state.mistakes.includes(id) ? 4 : 8;
      return {
        ...state,
        records: { ...state.records, [id]: { points } },
        classificationFeedback:
          "Evidência registrada. " +
          check.impact +
          " +" +
          points +
          " XP pela classificação.",
      };
    }

    case "next-case":
      if (
        !state.records[currentId(state)] ||
        state.step >= REGRESSION_CASES.length - 1
      )
        return state;
      return { ...state, step: state.step + 1, classificationFeedback: "" };

    case "set-review":
      if (Object.keys(state.records).length !== REGRESSION_CASES.length)
        return state;
      if (!["decision", "reason"].includes(action.field)) return state;
      return { ...state, [action.field]: action.value, reviewFeedback: "" };

    case "submit-review": {
      if (Object.keys(state.records).length !== REGRESSION_CASES.length)
        return state;
      if (!state.decision || !state.reason)
        return {
          ...state,
          reviewFeedback:
            "Escolha o parecer sobre a candidata e sua evidência.",
        };
      const correctDecision = state.decision === "return";
      const correctReason = state.reason === "filter";
      const reviewMistakes = [...state.reviewMistakes];
      if (!correctDecision && !reviewMistakes.includes("decision"))
        reviewMistakes.push("decision");
      if (!correctReason && !reviewMistakes.includes("reason"))
        reviewMistakes.push("reason");
      const reviewPoints = { ...state.reviewPoints };
      if (correctDecision && !reviewPoints.decision)
        reviewPoints.decision = reviewMistakes.includes("decision") ? 5 : 10;
      if (correctReason && !reviewPoints.reason)
        reviewPoints.reason = reviewMistakes.includes("reason") ? 5 : 10;
      return {
        ...state,
        reviewMistakes,
        reviewPoints,
        finished: correctDecision && correctReason,
        reviewFeedback:
          correctDecision && correctReason
            ? ""
            : "Login, Carrinho, Checkout e Histórico passaram; o filtro regrediu. O 503 e os R$ 15,00 estão corrigidos, mas isso não aprova a candidata nesta suíte. Devolva a FF-2026.10.2 para investigar o filtro antes de nova regressão. Concluir a missão exige esse parecer fundamentado, sem aprovação para produção. Cada resposta incorreta corrigida vale 5 XP.",
      };
    }

    case "restart":
      return createInitialRegressionState();

    default:
      return state;
  }
}
