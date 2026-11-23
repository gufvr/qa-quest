export const ANA = Object.freeze({
  name: "Ana Lima",
  email: "cliente.ana@fikily.test",
  order: "FF-ANA-1042",
});

export const BRUNO = Object.freeze({
  name: "Bruno Costa",
  email: "cliente.bruno@fikily.test",
  order: "FF-BRU-2088",
  address: "Rua da Simulação, 20 — Cidade Exemplo",
  item: "1 × Mochila Notebook",
  total: "R$ 249,90",
});

export const SECURITY_ADDRESSES = Object.freeze({
  lab: "Alameda do Laboratório, 77 — Cidade Exemplo",
  simulation: "Praça da Simulação, 88 — Cidade Exemplo",
});

export const SECURITY_CASES = Object.freeze([
  {
    id: "own",
    title: "Acesso aos próprios dados",
    path: "account",
    points: 10,
    answer: "allowed",
    instruction:
      "Primeiro tente abrir Minha Conta sem sessão. Depois entre como Ana e confira Minha Conta e Histórico.",
    expected:
      "Sem sessão: acesso negado, sem dados exibidos. Com Ana autenticada: somente Minha Conta de Ana e pedido FF-ANA-1042.",
    control: "Autenticação e autorização do acesso próprio.",
  },
  {
    id: "read",
    title: "Leitura de pedido de terceiros",
    path: "orders/FF-BRU-2088",
    points: 5,
    answer: "unauthorized-read",
    instruction:
      "Mantenha a sessão de Ana e tente abrir o pedido de Bruno fornecido pelo time. Observe titular, dados e resposta.",
    expected:
      "Negar o acesso com mensagem segura, sem nome, endereço, itens ou valores de Bruno.",
    control: "Autorização de leitura e confidencialidade entre contas.",
  },
  {
    id: "write",
    title: "Alteração de pedido de terceiros",
    path: "orders/FF-BRU-2088/address",
    points: 5,
    answer: "unauthorized-write",
    instruction:
      "Ainda como Ana, selecione um endereço fictício e tente salvar a alteração no pedido de Bruno. Compare antes e depois.",
    expected:
      "Negar a alteração, preservar o endereço de Bruno e não expor seus dados na tela de Ana.",
    control: "Autorização de alteração, integridade e confidencialidade.",
  },
  {
    id: "message",
    title: "Mensagens de login",
    path: "login",
    points: 10,
    answer: "revealing-message",
    instruction:
      "Sem sessão, compare o erro de uma senha incorreta para Ana com o erro de uma conta inexistente.",
    expected:
      "Negar ambas as tentativas, sem criar sessão, e usar uma mensagem segura para as duas.",
    control:
      "Autenticação das tentativas inválidas e exposição de informação na mensagem.",
  },
]);

export function createInitialSecurityState() {
  return {
    step: 0,
    conceptPoints: 0,
    conceptMistake: false,
    concept: "",
    conceptFeedback: "",
    session: null,
    guestDenied: false,
    knownDenied: false,
    unknownDenied: false,
    address: BRUNO.address,
    previousAddress: null,
    selectedAddress: "",
    addressFeedback: "",
    executions: {},
    records: {},
    mistakes: [],
    review: { decision: "", reason: "" },
    reviewMistakes: [],
    reviewPoints: { decision: 0, reason: 0 },
    reviewFeedback: "",
    finished: false,
  };
}

export function getSecurityScore(state) {
  return (
    state.conceptPoints +
    Object.entries(state.executions).reduce((total, [id]) => {
      const test = SECURITY_CASES.find((item) => item.id === id);
      return total + (test?.points || 0);
    }, 0) +
    Object.values(state.records).reduce((total, points) => total + points, 0) +
    state.reviewPoints.decision +
    state.reviewPoints.reason
  );
}

export function getSecuritySnapshot(state, id) {
  if (id === "own")
    return {
      identity: "Sem sessão no primeiro controle; depois Ana Lima autenticada.",
      action:
        "Abrir Minha Conta sem sessão; entrar com a conta fornecida de Ana; conferir Minha Conta e Histórico.",
      observed:
        "Sem sessão, a tela negou o acesso (401 simulado), sem dados privados. Após o login válido, exibiu Ana Lima, cliente.ana@fikily.test e somente FF-ANA-1042 · 1 × Mochila Urbana · R$ 189,90.",
      impact:
        "O controle inicial protege a área privada; Ana consegue consultar os próprios dados. Este resultado não comprova o isolamento dos pedidos de outras contas.",
      learning:
        "O acesso próprio funcionou, mas ainda é necessário verificar as permissões entre contas.",
    };
  if (id === "read")
    return {
      identity:
        "Ana Lima autenticada; titular do pedido solicitado: Bruno Costa.",
      action: "Tentar abrir o pedido FF-BRU-2088 com a sessão de Ana.",
      observed:
        "O acesso foi permitido e exibiu Bruno Costa, " +
        BRUNO.email +
        ", " +
        BRUNO.item +
        ", " +
        BRUNO.total +
        " e entrega em " +
        state.address +
        ".",
      impact:
        "Dados de outro cliente ficaram expostos. A candidata apresenta uma falha crítica de autorização de leitura neste cenário.",
      learning:
        "Ana foi autenticada corretamente. A falha está na permissão de ler um pedido que não lhe pertence.",
    };
  if (id === "write")
    return {
      identity: "Ana Lima autenticada; pedido alterado pertence a Bruno Costa.",
      action:
        "Salvar um endereço fictício no pedido FF-BRU-2088 usando a sessão de Ana.",
      observed:
        "A alteração foi aceita. Antes: " +
        state.previousAddress +
        ". Depois: " +
        state.address +
        ". O pedido e o endereço foram atualizados na simulação.",
      impact:
        "A alteração indevida viola a integridade do pedido e poderia desviar uma entrega. A tela também expõe os dados de Bruno.",
      learning:
        "Autenticação válida não concede permissão de alterar pedidos de outras pessoas.",
    };
  return {
    identity:
      "Sem sessão; tentativa com Ana e senha incorreta, seguida de conta inexistente.",
    action:
      "Comparar os erros de cliente.ana@fikily.test e cliente.inexistente@fikily.test.",
    observed:
      "Conta cadastrada + senha incorreta: “Senha incorreta”. Conta inexistente: “Esta conta não existe”. As duas entradas foram negadas e nenhuma sessão foi criada.",
    impact:
      "As respostas permitem distinguir uma conta cadastrada de uma inexistente.",
    learning:
      "Negar o login funcionou. O defeito desta evidência é a diferença informativa entre mensagens.",
  };
}

export function securityLabReducer(state, action) {
  if (state.finished && action.type !== "restart") return state;

  switch (action.type) {
    case "submit-concept":
      if (state.conceptPoints) return state;
      if (action.value !== "identity") {
        return {
          ...state,
          conceptMistake: true,
          conceptFeedback:
            "Autenticação confirma a identidade; autorização limita os dados e as ações dessa identidade.",
        };
      }
      return {
        ...state,
        conceptPoints: state.conceptMistake ? 5 : 10,
        concept: "identity",
        conceptFeedback:
          "Diferença correta registrada." +
          (state.conceptMistake ? " 5 XP." : " 10 XP."),
      };

    case "deny-guest":
      if (state.step !== 0 || state.session || state.guestDenied) return state;
      return { ...state, guestDenied: true };

    case "login-ana":
      if (state.step !== 0 || !state.guestDenied || state.session) return state;
      return { ...state, session: "ana" };

    case "execute":
      if (SECURITY_CASES[state.step]?.id !== action.id) return state;
      if (state.executions[action.id]) return state;
      let next = state;
      if (action.id === "write") {
        if (!SECURITY_ADDRESSES[state.selectedAddress]) return state;
        next = {
          ...state,
          previousAddress: state.address,
          address: SECURITY_ADDRESSES[state.selectedAddress],
          addressFeedback:
            "Alteração aceita na simulação. Endereço atualizado para " +
            SECURITY_ADDRESSES[state.selectedAddress] +
            ".",
        };
      }
      return {
        ...next,
        executions: {
          ...next.executions,
          [action.id]: getSecuritySnapshot(next, action.id),
        },
      };

    case "set-address":
      return { ...state, selectedAddress: action.value };

    case "test-known":
      if (state.session || state.knownDenied) return state;
      return { ...state, knownDenied: true };

    case "test-unknown":
      if (state.session || !state.knownDenied || state.unknownDenied)
        return state;
      return { ...state, unknownDenied: true };

    case "classify": {
      const test = SECURITY_CASES[state.step];
      if (!test || state.records[test.id] || !state.executions[test.id])
        return state;
      if (action.value !== test.answer)
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
      if (
        !SECURITY_CASES[state.step] ||
        !state.records[SECURITY_CASES[state.step].id]
      )
        return state;
      if (state.step >= SECURITY_CASES.length - 1) return state;
      const step = state.step + 1;
      return {
        ...state,
        step,
        session: SECURITY_CASES[step].id === "message" ? null : state.session,
      };

    case "set-review":
      if (!["decision", "reason"].includes(action.field)) return state;
      return {
        ...state,
        review: { ...state.review, [action.field]: action.value },
        reviewFeedback: "",
      };

    case "submit-review": {
      if (
        Object.keys(state.records).length !== SECURITY_CASES.length ||
        !state.review.decision ||
        !state.review.reason
      )
        return state;
      const correctDecision = state.review.decision === "return";
      const correctReason = state.review.reason === "controls";
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
          "O acesso próprio funcionou e as tentativas inválidas foram negadas. Mesmo assim, Ana leu e alterou o pedido de Bruno, e os erros distinguem contas. Devolva a candidata para correção e nova avaliação.",
      };
    }

    case "restart":
      return createInitialSecurityState();

    default:
      return state;
  }
}
