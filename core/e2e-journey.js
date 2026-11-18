export const E2E_UNIT_PRICE_CENTS = 18990;
export const E2E_ORDER_ID = "FF-314";
export const E2E_STEP_IDS = [
  "catalog",
  "cart",
  "delivery",
  "payment",
  "order",
  "post",
];
export const E2E_COMPARISON_IDS = ["discount", "payment", "confirmation"];

const comparisonViews = {
  delivery: "discount",
  order: "payment",
  post: "confirmation",
};

const viewPaths = {
  catalog: "catalog",
  cart: "cart",
  delivery: "checkout",
  payment: "payment",
  order: `orders/${E2E_ORDER_ID}`,
  post: `confirmation/${E2E_ORDER_ID}`,
};

export const e2eInstructions = {
  catalog: "Escolha a Mochila Urbana para iniciar um único pedido.",
  cart: "Escolha de 1 a 3 unidades, aplique FVR10 e confira o total.",
  delivery:
    "Compare os totais no checkpoint abaixo e informe uma entrega fictícia.",
  payment: "Confira os dados da entrega e escolha Pix ou cartão de teste.",
  order: "Compare o pagamento aprovado com o status registrado no pedido.",
  post: "Compare o valor do pedido com o e-mail e revise as evidências.",
};

export const createInitialE2EState = () => ({
  currentView: "catalog",
  quantity: 1,
  coupon: "",
  couponApplied: false,
  couponFeedback: "",
  cartSnapshot: null,
  checkoutTotal: null,
  deliveryAddress: "",
  deliveryCep: "",
  deliveryMessage: "",
  addressInvalid: false,
  cepInvalid: false,
  delivery: null,
  paymentMethod: "pix",
  order: null,
  checkpoints: [],
  findings: [],
  comparisonAttempts: {},
  comparisonPoints: {},
  comparisonFeedback: "",
  reviewOpen: false,
  reviewSelection: [],
  reviewAttempts: 0,
  reviewPoints: 0,
  reviewError: "",
  finished: false,
});

export function formatE2EMoney(cents) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function getE2ECartTotals(quantity, couponApplied) {
  const subtotal = E2E_UNIT_PRICE_CENTS * quantity;
  return {
    subtotal,
    total: couponApplied ? Math.round(subtotal * 0.9) : subtotal,
  };
}

export function getE2EViewPath(view) {
  return viewPaths[view];
}

export function getE2EComparisonId(view) {
  return comparisonViews[view] || null;
}

export function getE2EFinding(id, state) {
  if (id === "discount")
    return {
      title: "O desconto se perde no checkout",
      question:
        "Compare o total confirmado no carrinho com o total no checkout. Os valores são consistentes?",
      expected:
        "Manter " +
        formatE2EMoney(state.cartSnapshot.total) +
        " com o cupom FVR10 e frete grátis.",
      observed:
        "O checkout mostra " +
        formatE2EMoney(state.checkoutTotal) +
        ", sem o desconto.",
      impact:
        "O cliente pode pagar mais do que o valor que confirmou no carrinho.",
    };

  if (id === "payment")
    return {
      title: "Pagamento aprovado mantém pedido pendente",
      question:
        "Compare a aprovação do pagamento com o status do pedido. Os estados são consistentes?",
      expected:
        "Pagamento por " +
        state.order.methodLabel +
        " aprovado deve atualizar o pedido para pago.",
      observed:
        "O pagamento foi aprovado, mas o pedido permanece como Aguardando pagamento.",
      impact:
        "A divergência pode atrasar o processamento do pedido e provocar novas tentativas de pagamento.",
    };

  if (id === "confirmation")
    return {
      title: "E-mail mostra total diferente do pedido",
      question:
        "Compare o valor do pedido com a confirmação por e-mail. Os dados são consistentes?",
      expected:
        "Informar " +
        formatE2EMoney(state.order.total) +
        ", o mesmo valor registrado no pedido.",
      observed:
        "O e-mail mostra " +
        formatE2EMoney(state.order.total + 1800) +
        ", com R$ 18,00 indevidos.",
      impact:
        "O cliente recebe uma confirmação financeira incorreta e pode precisar acionar o suporte.",
    };

  return null;
}

export function getE2EReviewOptions(state) {
  return [
    ...E2E_COMPARISON_IDS.map((id) => ({
      id,
      title: getE2EFinding(id, state).title,
    })),
    {
      id: "consistent-data",
      title:
        "Quantidade, endereço e meio de pagamento foram mantidos corretamente.",
    },
  ];
}

export function isE2EReviewComplete(selected) {
  return (
    selected.length === E2E_COMPARISON_IDS.length &&
    E2E_COMPARISON_IDS.every((id) => selected.includes(id))
  );
}

export function validateE2EDelivery(address, cep) {
  return {
    addressValid: address.trim().length >= 5,
    cepValid: /^\d{5}-?\d{3}$/.test(cep.trim()),
  };
}

export function getE2EScore(state) {
  return (
    state.checkpoints.length * 10 +
    Object.values(state.comparisonPoints).reduce(
      (total, points) => total + points,
      0,
    ) +
    state.reviewPoints
  );
}

function completeCheckpoint(state, id) {
  return state.checkpoints.includes(id)
    ? state.checkpoints
    : [...state.checkpoints, id];
}

function setView(state, view) {
  const comparisonId = getE2EComparisonId(view);
  return {
    ...state,
    currentView: view,
    comparisonFeedback:
      comparisonId && state.findings.includes(comparisonId)
        ? "Comparação registrada. Continue a jornada na loja."
        : "",
  };
}

function requireCurrentComparison(state, message) {
  const id = getE2EComparisonId(state.currentView);
  if (!id || state.findings.includes(id)) return state;
  return { ...state, comparisonFeedback: message };
}

export function e2eJourneyReducer(state, action) {
  switch (action.type) {
    case "add-product":
      if (state.currentView !== "catalog") return state;
      return setView(
        {
          ...state,
          checkpoints: completeCheckpoint(state, "catalog"),
        },
        "cart",
      );

    case "set-quantity":
      if (state.currentView !== "cart") return state;
      return {
        ...state,
        quantity: Math.min(3, Math.max(1, Number(action.value) || 1)),
      };

    case "set-coupon":
      if (state.currentView !== "cart") return state;
      return { ...state, coupon: action.value };

    case "apply-coupon":
      if (state.currentView !== "cart") return state;
      if (state.coupon.trim().toUpperCase() !== "FVR10")
        return {
          ...state,
          couponFeedback: state.couponApplied
            ? "Cupom não encontrado. FVR10 continua aplicado."
            : "Use o cupom do roteiro: FVR10.",
        };
      return {
        ...state,
        couponApplied: true,
        couponFeedback:
          "FVR10 aplicado. Frete grátis e 10% de desconto confirmados.",
      };

    case "continue-to-delivery": {
      if (state.currentView !== "cart") return state;
      if (!state.couponApplied)
        return {
          ...state,
          couponFeedback:
            "Aplique FVR10 para comparar o desconto entre as etapas.",
        };

      const { subtotal, total } = getE2ECartTotals(
        state.quantity,
        state.couponApplied,
      );
      return setView(
        {
          ...state,
          cartSnapshot: { quantity: state.quantity, total },
          checkoutTotal: subtotal,
          checkpoints: completeCheckpoint(state, "cart"),
        },
        "delivery",
      );
    }

    case "submit-comparison": {
      const id = getE2EComparisonId(state.currentView);
      if (!id || state.findings.includes(id) || state.finished) return state;

      const attempt = (state.comparisonAttempts[id] || 0) + 1;
      const comparisonAttempts = {
        ...state.comparisonAttempts,
        [id]: attempt,
      };
      const finding = getE2EFinding(id, state);

      if (action.value !== "divergent")
        return {
          ...state,
          comparisonAttempts,
          comparisonFeedback:
            "Compare novamente: " + finding.expected + " " + finding.observed,
        };

      const points = attempt === 1 ? 10 : 5;
      let checkpoints = state.checkpoints;
      if (id === "payment") checkpoints = completeCheckpoint(state, "order");
      if (id === "confirmation")
        checkpoints = completeCheckpoint(state, "post");

      return {
        ...state,
        comparisonAttempts,
        comparisonPoints: { ...state.comparisonPoints, [id]: points },
        findings: [...state.findings, id],
        checkpoints,
        comparisonFeedback: `Evidência registrada. +${points} XP pela comparação.`,
      };
    }

    case "set-delivery-address":
      if (state.currentView !== "delivery") return state;
      return { ...state, deliveryAddress: action.value };

    case "set-delivery-cep":
      if (state.currentView !== "delivery") return state;
      return { ...state, deliveryCep: action.value };

    case "continue-to-payment": {
      if (state.currentView !== "delivery") return state;
      const { addressValid, cepValid } = validateE2EDelivery(
        state.deliveryAddress,
        state.deliveryCep,
      );
      if (!addressValid || !cepValid)
        return {
          ...state,
          addressInvalid: !addressValid,
          cepInvalid: !cepValid,
          deliveryMessage:
            "Informe um endereço fictício e um CEP com oito dígitos, como 01001-000.",
        };
      if (!state.findings.includes("discount"))
        return requireCurrentComparison(
          state,
          "Registre a comparação do desconto antes de continuar.",
        );

      return setView(
        {
          ...state,
          delivery: {
            address: state.deliveryAddress.trim(),
            cep: state.deliveryCep.trim(),
          },
          addressInvalid: false,
          cepInvalid: false,
          deliveryMessage: "",
          checkpoints: completeCheckpoint(state, "delivery"),
        },
        "payment",
      );
    }

    case "set-payment-method":
      if (state.currentView !== "payment") return state;
      return { ...state, paymentMethod: action.value };

    case "approve-payment": {
      if (state.currentView !== "payment" || !state.delivery || state.order)
        return state;

      const methodLabel =
        state.paymentMethod === "pix"
          ? "Pix simulado"
          : "Cartão de teste · final 4242";
      const order = {
        id: E2E_ORDER_ID,
        quantity: state.cartSnapshot.quantity,
        delivery: state.delivery,
        total: state.checkoutTotal,
        method: state.paymentMethod,
        methodLabel,
        paymentStatus: "Aprovado",
        status: "Aguardando pagamento",
      };
      return setView(
        {
          ...state,
          order,
          checkpoints: completeCheckpoint(state, "payment"),
        },
        "order",
      );
    }

    case "continue-to-post":
      if (state.currentView !== "order" || !state.order) return state;
      if (!state.findings.includes("payment"))
        return requireCurrentComparison(
          state,
          "Compare a aprovação do pagamento com o status do pedido.",
        );
      return setView(state, "post");

    case "open-review":
      if (
        state.currentView !== "post" ||
        state.finished ||
        state.checkpoints.length !== E2E_STEP_IDS.length ||
        state.findings.length !== E2E_COMPARISON_IDS.length
      )
        return requireCurrentComparison(
          state,
          "Registre a comparação do e-mail antes da revisão final.",
        );
      if (state.reviewOpen) return state;
      return {
        ...state,
        reviewOpen: true,
        reviewSelection: [],
        reviewError: "",
      };

    case "toggle-review-selection": {
      if (!state.reviewOpen || state.finished) return state;
      const selected = state.reviewSelection.includes(action.value);
      return {
        ...state,
        reviewSelection: selected
          ? state.reviewSelection.filter((id) => id !== action.value)
          : [...state.reviewSelection, action.value],
        reviewError: "",
      };
    }

    case "submit-review":
      if (
        state.finished ||
        !state.reviewOpen ||
        state.checkpoints.length !== E2E_STEP_IDS.length ||
        state.findings.length !== E2E_COMPARISON_IDS.length
      )
        return state;
      if (!isE2EReviewComplete(state.reviewSelection))
        return {
          ...state,
          reviewAttempts: state.reviewAttempts + 1,
          reviewError:
            "Reporte as três divergências. Quantidade, endereço e forma de pagamento foram preservados e não são defeitos.",
        };
      return {
        ...state,
        reviewPoints: state.reviewAttempts === 0 ? 10 : 5,
        reviewError: "",
        finished: true,
      };

    case "restart":
      return createInitialE2EState();

    default:
      return state;
  }
}
