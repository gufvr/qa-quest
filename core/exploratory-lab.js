export const discoveries = Object.freeze({
  stock: Object.freeze({
    title: "Quantidade supera o estoque informado",
    detail:
      "O carrinho aceita mais de 5 unidades mesmo com o estoque exibido limitado a 5.",
    points: 15,
  }),
  coupon: Object.freeze({
    title: "Desconto permanece após remover o cupom",
    detail:
      "O cupom é removido visualmente, mas o total continua com desconto.",
    points: 15,
  }),
  address: Object.freeze({
    title: "Endereço com caracteres especiais é rejeitado",
    detail:
      "Um complemento válido com # é tratado como erro, bloqueando a entrega.",
    points: 15,
  }),
  checkout: Object.freeze({
    title: "Pedido é criado sem dados obrigatórios",
    detail: "A loja confirma a compra sem endereço ou CEP preenchidos.",
    points: 15,
  }),
});

export const discoveryIds = Object.freeze(Object.keys(discoveries));
export const productPrice = 189.9;
export const stockLimit = 5;
export const completionXp = 100;

export function createInitialLabState() {
  return {
    view: "catalog",
    quantity: 0,
    couponInput: "",
    couponApplied: false,
    removeCouponVisible: false,
    discountStuck: false,
    couponMessage: "",
    address: "",
    cep: "",
    checkoutMessage: "",
    discovered: [],
    selectedEvidence: [],
    reviewError: "",
  };
}

function recordDiscovery(state, id) {
  if (!Object.hasOwn(discoveries, id) || state.discovered.includes(id))
    return state;

  return { ...state, discovered: [...state.discovered, id] };
}

export function exploratoryReducer(state, action) {
  switch (action.type) {
    case "set-view":
      return { ...state, view: action.view };
    case "add-product":
      return {
        ...state,
        quantity: state.quantity + 1,
        view: "cart",
      };
    case "increase-quantity": {
      const nextState = { ...state, quantity: state.quantity + 1 };
      return nextState.quantity > stockLimit
        ? recordDiscovery(nextState, "stock")
        : nextState;
    }
    case "decrease-quantity":
      return { ...state, quantity: Math.max(0, state.quantity - 1) };
    case "set-coupon-input":
      return { ...state, couponInput: action.value };
    case "apply-coupon":
      if (state.couponInput.trim().toUpperCase() === "FVR10")
        return {
          ...state,
          couponApplied: true,
          removeCouponVisible: true,
          couponMessage: "Cupom FVR10 aplicado: 10% de desconto.",
        };
      return { ...state, couponMessage: "Cupom não encontrado." };
    case "remove-coupon":
      return recordDiscovery(
        {
          ...state,
          couponApplied: false,
          removeCouponVisible: false,
          discountStuck: true,
          couponMessage: "Cupom removido.",
        },
        "coupon",
      );
    case "set-address":
      return { ...state, address: action.value };
    case "inspect-address": {
      if (!state.address.includes("#")) return state;
      return recordDiscovery(
        {
          ...state,
          checkoutMessage: "Endereço inválido. Remova caracteres especiais.",
        },
        "address",
      );
    }
    case "set-cep":
      return { ...state, cep: action.value };
    case "finish-order":
      if (!state.address.trim() || !state.cep.trim())
        return recordDiscovery(
          {
            ...state,
            checkoutMessage:
              "Pedido #FF-2048 confirmado. Enviaremos novidades por e-mail.",
          },
          "checkout",
        );
      return { ...state, checkoutMessage: "Pedido enviado para análise." };
    case "simulated-refresh":
      return {
        ...state,
        quantity: 0,
        couponApplied: false,
        discountStuck: false,
        couponMessage: "Carrinho restaurado vazio após a atualização simulada.",
        view: "cart",
      };
    case "toggle-evidence": {
      const selectedEvidence = state.selectedEvidence.includes(action.id)
        ? state.selectedEvidence.filter((id) => id !== action.id)
        : [...state.selectedEvidence, action.id];
      return { ...state, selectedEvidence, reviewError: "" };
    }
    case "review-incomplete":
      return {
        ...state,
        reviewError:
          "Revise todas as quatro evidências encontradas antes de concluir.",
      };
    case "restart":
      return createInitialLabState();
    default:
      return state;
  }
}

export function getCartTotal(state) {
  const fullTotal = state.quantity * productPrice;
  return state.couponApplied || state.discountStuck
    ? fullTotal * 0.9
    : fullTotal;
}

export function getStockMessage(quantity) {
  if (quantity === 0) return "Adicione um item para começar.";
  if (quantity > stockLimit) return "Estoque disponível: 5 unidades.";
  return `Estoque disponível: ${stockLimit - quantity} unidades.`;
}

export function getDiscoveryXp(state) {
  return state.discovered.reduce(
    (total, id) => total + discoveries[id].points,
    0,
  );
}

export function isReviewComplete(selectedEvidence) {
  return (
    selectedEvidence.length === discoveryIds.length &&
    discoveryIds.every((id) => selectedEvidence.includes(id))
  );
}
