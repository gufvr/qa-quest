import test from "node:test";
import assert from "node:assert/strict";
import {
  E2E_COMPARISON_IDS,
  E2E_ORDER_ID,
  E2E_STEP_IDS,
  createInitialE2EState,
  e2eJourneyReducer,
  formatE2EMoney,
  getE2ECartTotals,
  getE2EFinding,
  getE2EScore,
  getE2EViewPath,
  isE2EReviewComplete,
  validateE2EDelivery,
} from "../core/e2e-journey.js";

function dispatch(state, type, value) {
  return e2eJourneyReducer(state, { type, value });
}

function createCompleteJourney() {
  let state = createInitialE2EState();
  state = dispatch(state, "add-product");
  state = dispatch(state, "set-quantity", "2");
  state = dispatch(state, "set-coupon", "fvr10");
  state = dispatch(state, "apply-coupon");
  state = dispatch(state, "continue-to-delivery");
  state = dispatch(state, "set-delivery-address", "Rua Fikily, 101");
  state = dispatch(state, "set-delivery-cep", "01001-000");
  state = dispatch(state, "submit-comparison", "divergent");
  state = dispatch(state, "continue-to-payment");
  state = dispatch(state, "set-payment-method", "card");
  state = dispatch(state, "approve-payment");
  state = dispatch(state, "submit-comparison", "divergent");
  state = dispatch(state, "continue-to-post");
  state = dispatch(state, "submit-comparison", "divergent");
  state = dispatch(state, "open-review");
  return state;
}

test("the journey has six ordered views and keeps the fixed order identifier", () => {
  assert.deepEqual(E2E_STEP_IDS, [
    "catalog",
    "cart",
    "delivery",
    "payment",
    "order",
    "post",
  ]);
  assert.equal(getE2EViewPath("order"), `orders/${E2E_ORDER_ID}`);
  assert.equal(getE2EViewPath("post"), `confirmation/${E2E_ORDER_ID}`);
  assert.equal(createInitialE2EState().quantity, 1);
});

test("cart quantity, coupon totals, and delivery validation retain their bounds", () => {
  let state = createInitialE2EState();
  state = dispatch(state, "add-product");
  state = dispatch(state, "set-quantity", "99");
  assert.equal(state.quantity, 3);

  state = dispatch(state, "set-coupon", "invalid");
  state = dispatch(state, "apply-coupon");
  assert.equal(state.couponApplied, false);
  assert.equal(state.couponFeedback, "Use o cupom do roteiro: FVR10.");

  state = dispatch(state, "set-coupon", " fvr10 ");
  state = dispatch(state, "apply-coupon");
  assert.equal(state.couponApplied, true);
  assert.deepEqual(getE2ECartTotals(3, true), {
    subtotal: 56970,
    total: 51273,
  });
  assert.equal(formatE2EMoney(18990), "R$ 189,90");
  assert.deepEqual(validateE2EDelivery("Rua 1", "01001000"), {
    addressValid: true,
    cepValid: true,
  });
  assert.deepEqual(validateE2EDelivery("Rua", "1000"), {
    addressValid: false,
    cepValid: false,
  });
});

test("the checkout and order preserve the three intended inconsistencies", () => {
  let state = createInitialE2EState();
  state = dispatch(state, "add-product");
  state = dispatch(state, "set-coupon", "FVR10");
  state = dispatch(state, "apply-coupon");
  state = dispatch(state, "continue-to-delivery");
  assert.equal(state.cartSnapshot.total, 17091);
  assert.equal(state.checkoutTotal, 18990);

  state = dispatch(state, "set-delivery-address", "Rua Fikily, 101");
  state = dispatch(state, "set-delivery-cep", "01001-000");
  state = dispatch(state, "continue-to-payment");
  assert.equal(
    state.comparisonFeedback,
    "Registre a comparação do desconto antes de continuar.",
  );
  state = dispatch(state, "submit-comparison", "divergent");
  assert.match(getE2EFinding("discount", state).observed, /sem o desconto/);
  state = dispatch(state, "continue-to-payment");
  state = dispatch(state, "approve-payment");
  assert.equal(state.order.paymentStatus, "Aprovado");
  assert.equal(state.order.status, "Aguardando pagamento");
  assert.equal(state.order.methodLabel, "Pix simulado");

  state = dispatch(state, "submit-comparison", "divergent");
  state = dispatch(state, "continue-to-post");
  state = dispatch(state, "submit-comparison", "divergent");
  assert.match(
    getE2EFinding("confirmation", state).observed,
    /com R\$ 18,00 indevidos/,
  );
  assert.deepEqual(state.findings, E2E_COMPARISON_IDS);
});

test("wrong comparison and review attempts award half credit after correction", () => {
  let state = createInitialE2EState();
  state = dispatch(state, "add-product");
  state = dispatch(state, "set-coupon", "FVR10");
  state = dispatch(state, "apply-coupon");
  state = dispatch(state, "continue-to-delivery");
  state = dispatch(state, "submit-comparison", "consistent");
  state = dispatch(state, "submit-comparison", "divergent");
  assert.equal(state.comparisonPoints.discount, 5);

  state = createCompleteJourney();
  state = dispatch(state, "toggle-review-selection", "discount");
  state = dispatch(state, "toggle-review-selection", "payment");
  state = dispatch(state, "toggle-review-selection", "consistent-data");
  state = dispatch(state, "submit-review");
  assert.equal(state.reviewAttempts, 1);
  assert.equal(state.finished, false);
  assert.ok(state.reviewError);

  state = dispatch(state, "toggle-review-selection", "consistent-data");
  state = dispatch(state, "toggle-review-selection", "confirmation");
  assert.equal(isE2EReviewComplete(state.reviewSelection), true);
  state = dispatch(state, "submit-review");
  assert.equal(state.finished, true);
  assert.equal(state.reviewPoints, 5);
  assert.equal(getE2EScore(state), 95);
});

test("first-attempt completion awards 100 XP and restart clears mission state", () => {
  let state = createCompleteJourney();
  for (const id of E2E_COMPARISON_IDS)
    state = dispatch(state, "toggle-review-selection", id);
  state = dispatch(state, "submit-review");
  assert.equal(state.checkpoints.length, E2E_STEP_IDS.length);
  assert.equal(getE2EScore(state), 100);

  state = dispatch(state, "restart");
  assert.deepEqual(state, createInitialE2EState());
});
