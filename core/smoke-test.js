export const SMOKE_CHECKS = [
  {
    id: "home",
    title: "Home",
    path: "/",
    action: "Abrir loja",
    expected:
      "A página inicial abre com a marca, a navegação e o acesso ao catálogo.",
    previewTitle: "Uma nova versão da sua loja.",
    previewDescription:
      "Abra a loja e confira se o conteúdo essencial está disponível.",
    status: "200 OK",
    outcome: "pass",
    observed:
      "A home abriu com a marca Fikily, navegação e botão de acesso ao catálogo.",
    detail:
      "Fikily\nInício · Catálogo · Carrinho · Minha conta\n[Ver produtos]",
    impact: "O cliente consegue acessar a loja e localizar o catálogo.",
  },
  {
    id: "catalog",
    title: "Catálogo",
    path: "/catalog",
    action: "Carregar produtos",
    expected:
      "O catálogo exibe pelo menos um produto com nome, preço e disponibilidade.",
    previewTitle: "Produtos para o seu dia.",
    previewDescription:
      "Confira apenas se o catálogo está utilizável; filtros e combinações ficam para testes posteriores.",
    status: "200 OK",
    outcome: "pass",
    observed:
      "A Mochila Urbana foi exibida por R$ 189,90, com estoque e opção de adicionar ao carrinho.",
    detail:
      "Mochila Urbana · R$ 189,90\nEstoque: 5 unidades\n[Adicionar ao carrinho]",
    impact: "O cliente consegue encontrar um produto disponível para compra.",
  },
  {
    id: "cart",
    title: "Carrinho",
    path: "/cart",
    action: "Adicionar item de teste",
    expected:
      "Ao adicionar uma Mochila Urbana, o carrinho mostra 1 unidade e total de R$ 189,90.",
    previewTitle: "Seu carrinho de teste.",
    previewDescription:
      "Adicione um produto de teste e confira quantidade e total, sem explorar cupons ou limites.",
    status: "200 OK",
    outcome: "pass",
    observed:
      "Uma Mochila Urbana foi adicionada. Quantidade: 1. Total: R$ 189,90.",
    detail: "Mochila Urbana × 1\nTotal: R$ 189,90\n[Ir para checkout]",
    impact: "A inclusão básica do item no carrinho funciona.",
  },
  {
    id: "checkout",
    title: "Checkout",
    path: "/checkout",
    action: "Abrir checkout",
    expected:
      "Com um item de teste no carrinho, o checkout abre os campos de entrega e pagamento.",
    previewTitle: "Finalização da compra.",
    previewDescription:
      "Um carrinho de teste já está preparado para esta verificação independente.",
    status: "503 Service Unavailable",
    outcome: "fail",
    observed:
      "O checkout exibiu Serviço indisponível. Nenhum campo de entrega ou pagamento foi carregado.",
    detail:
      "Serviço indisponível\nNão foi possível abrir o checkout.\nReferência: FF-CHECKOUT-503",
    impact:
      "O cliente fica impedido de avançar para a finalização da compra. É uma falha crítica.",
  },
  {
    id: "login",
    title: "Login",
    path: "/login",
    action: "Entrar com conta de teste",
    expected:
      "A conta fictícia de teste acessa Minha conta e recebe uma confirmação de sessão.",
    previewTitle: "Acesse sua conta de teste.",
    previewDescription:
      "Use a conta preparada cliente@fikily.test. Nenhuma senha ou informação pessoal é necessária.",
    status: "200 OK",
    outcome: "pass",
    observed:
      "A conta fictícia entrou e a área Minha conta exibiu a sessão autenticada.",
    detail:
      "Bem-vindo, Cliente de teste!\nMinha conta\nSessão de teste: autenticada",
    impact: "O acesso básico à conta está disponível.",
  },
  {
    id: "api",
    title: "API de pedidos",
    path: "/api/orders",
    action: "Consultar pedidos",
    expected:
      "A consulta de pedidos da conta de teste responde com status 200 e uma lista, mesmo que vazia.",
    previewTitle: "Consulta de pedidos.",
    previewDescription:
      "O painel representa uma resposta de API simulada. Verifique o status e o conteúdo.",
    status: "500 Internal Server Error",
    outcome: "fail",
    observed:
      "A consulta retornou status 500 com erro de consulta, em vez de uma lista de pedidos.",
    detail:
      '{\n  "error": "ORDERS_QUERY_FAILED",\n  "message": "Não foi possível consultar os pedidos"\n}',
    impact:
      "O cliente não consegue consultar seus pedidos. Este serviço essencial está indisponível.",
  },
];

export const SMOKE_DECISION_OPTIONS = [
  {
    value: "approve",
    label: "Aprovar o Smoke Test e liberar testes aprofundados",
  },
  { value: "block", label: "Reprovar o Smoke Test e bloquear o avanço" },
];

export const SMOKE_IMPACT_OPTIONS = [
  {
    value: "cosmetic",
    label: "Só há um problema visual; a compra permanece disponível.",
  },
  {
    value: "critical",
    label:
      "O cliente não acessa o checkout e a consulta de pedidos falha. A compra e o acompanhamento estão comprometidos.",
  },
  {
    value: "majority",
    label: "Quatro checks passaram, então a maioria compensa as falhas.",
  },
];

export function createInitialSmokeState() {
  return {
    selected: "home",
    observed: [],
    records: {},
    attempts: {},
    decisionAttempts: 0,
    impactAttempts: 0,
    decisionPoints: 0,
    impactPoints: 0,
    decision: "",
    impact: "",
    classificationFeedback: "",
    reviewFeedback: "",
    finished: false,
  };
}

export function getSmokeCheck(id) {
  return SMOKE_CHECKS.find((check) => check.id === id) || null;
}

export function getSmokeScore(state) {
  return (
    Object.values(state.records).reduce(
      (total, record) => total + record.points,
      0,
    ) +
    state.decisionPoints +
    state.impactPoints
  );
}

export function getSmokeReleaseStatus(state) {
  const count = Object.keys(state.records).length;
  const failures = SMOKE_CHECKS.filter(
    (check) => check.outcome === "fail" && state.records[check.id],
  ).length;

  if (failures)
    return {
      blocked: true,
      text:
        "Smoke reprovado · FF-2026.10 · " +
        failures +
        " falha(s) crítica(s). Esta release está bloqueada; testes aprofundados não liberados.",
    };
  if (count === SMOKE_CHECKS.length)
    return {
      blocked: false,
      text: "Smoke aprovado tecnicamente · checks essenciais aprovados. Testes aprofundados liberados; produção ainda não avaliada.",
    };
  if (count)
    return {
      blocked: false,
      text: "Em avaliação · há verificações essenciais restantes.",
    };
  return {
    blocked: false,
    text: "Em avaliação · nenhum resultado registrado.",
  };
}

export function getSmokeCheckStatus(state, id) {
  const check = getSmokeCheck(id);
  const record = state.records[id];

  if (record) return check.outcome === "pass" ? "Passou" : "Falhou — crítico";
  if (state.observed.includes(id)) return "Classificação pendente";
  return "Não executado";
}

export function getSmokeClassificationFeedback(state, id = state.selected) {
  const record = state.records[id];
  if (!record) return "";
  const check = getSmokeCheck(id);
  return (
    "Evidência registrada. " +
    check.impact +
    " +" +
    record.points +
    " XP nesta tentativa."
  );
}

function getReviewFeedback(decision, impact) {
  const messages = [];
  if (decision !== "block")
    messages.push(
      "Reprove o Smoke Test e bloqueie apenas esta release, FF-2026.10: o checkout retorna 503 e a API de pedidos retorna 500. As falhas críticas impedem liberar testes aprofundados; isso não reprova a Fikily como produto.",
    );
  if (impact !== "critical")
    messages.push(
      "O cliente não consegue concluir a compra nem consultar pedidos. Quatro checks aprovados não compensam esses impedimentos. Um Smoke Test aprovado liberaria apenas testes aprofundados; não aprovaria a aplicação para produção.",
    );
  messages.push(
    "Revise o parecer. Respostas incorretas passam a valer 10 XP quando corrigidas.",
  );
  return messages.join(" ");
}

export function smokeTestReducer(state, action) {
  switch (action.type) {
    case "select-check":
      if (state.finished || !getSmokeCheck(action.id)) return state;
      return {
        ...state,
        selected: action.id,
        classificationFeedback: getSmokeClassificationFeedback(
          state,
          action.id,
        ),
      };

    case "run-check":
      if (
        state.finished ||
        !getSmokeCheck(state.selected) ||
        state.observed.includes(state.selected)
      )
        return state;
      return {
        ...state,
        observed: [...state.observed, state.selected],
        classificationFeedback: "",
      };

    case "classify-check": {
      const check = getSmokeCheck(state.selected);
      if (
        state.finished ||
        !check ||
        !state.observed.includes(check.id) ||
        state.records[check.id] ||
        !["pass", "fail"].includes(action.value)
      )
        return state;

      const attempt = (state.attempts[check.id] || 0) + 1;
      const attempts = { ...state.attempts, [check.id]: attempt };

      if (action.value !== check.outcome)
        return {
          ...state,
          attempts,
          classificationFeedback:
            "Compare novamente. Esperado: " +
            check.expected +
            " Observado: " +
            check.observed +
            " " +
            (check.outcome === "fail"
              ? "O fluxo essencial está indisponível."
              : "A ação essencial foi concluída conforme esperado.") +
            " Corrigir esta resposta valerá 5 XP.",
        };

      const points = attempt === 1 ? 10 : 5;
      return {
        ...state,
        attempts,
        records: { ...state.records, [check.id]: { points } },
        classificationFeedback:
          "Evidência registrada. " +
          check.impact +
          " +" +
          points +
          " XP nesta tentativa.",
      };
    }

    case "set-decision":
      if (state.finished) return state;
      return { ...state, decision: action.value };

    case "set-impact":
      if (state.finished) return state;
      return { ...state, impact: action.value };

    case "submit-review": {
      if (
        state.finished ||
        Object.keys(state.records).length !== SMOKE_CHECKS.length
      )
        return state;
      if (!state.decision || !state.impact)
        return {
          ...state,
          reviewFeedback:
            "Informe a decisão e o impacto para emitir o parecer.",
        };

      const decisionAttempts = state.decisionAttempts + 1;
      const impactAttempts = state.impactAttempts + 1;
      const correctDecision = state.decision === "block";
      const correctImpact = state.impact === "critical";
      const decisionPoints =
        correctDecision && !state.decisionPoints
          ? decisionAttempts === 1
            ? 20
            : 10
          : state.decisionPoints;
      const impactPoints =
        correctImpact && !state.impactPoints
          ? impactAttempts === 1
            ? 20
            : 10
          : state.impactPoints;

      return {
        ...state,
        decisionAttempts,
        impactAttempts,
        decisionPoints,
        impactPoints,
        reviewFeedback:
          correctDecision && correctImpact
            ? ""
            : getReviewFeedback(state.decision, state.impact),
        finished: correctDecision && correctImpact,
      };
    }

    case "restart":
      return createInitialSmokeState();

    default:
      return state;
  }
}
