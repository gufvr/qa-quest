import test from "node:test";
import assert from "node:assert/strict";
import {
  createInitialRegressionState,
  getRegressionCheck,
  getRegressionScore,
  regressionTestReducer,
} from "../core/regression-test.js";

const reduce = (state, ...actions) =>
  actions.reduce(regressionTestReducer, state);

function completeCases(state = createInitialRegressionState()) {
  state = reduce(
    state,
    { type: "submit-login" },
    { type: "classify", value: "pass" },
    { type: "next-case" },
    { type: "set-search", value: "Mochila" },
    { type: "submit-search" },
    { type: "set-filter", value: "accessories" },
    { type: "check-filter" },
    { type: "classify", value: "fail" },
    { type: "next-case" },
    { type: "add-product" },
    { type: "set-quantity", value: 2 },
    { type: "check-cart" },
    { type: "classify", value: "pass" },
    { type: "next-case" },
    { type: "set-checkout-field", field: "address", value: "Rua Fikily" },
    { type: "set-checkout-field", field: "cep", value: "01001-000" },
    { type: "set-checkout-field", field: "payment", value: "pix" },
    { type: "submit-checkout" },
    { type: "classify", value: "pass" },
    { type: "next-case" },
    { type: "create-order" },
    { type: "check-history" },
    { type: "classify", value: "pass" },
  );
  return state;
}

test("Regression preserves the intentionally broken category filter", () => {
  let state = reduce(
    createInitialRegressionState(),
    { type: "submit-login" },
    { type: "classify", value: "pass" },
    { type: "next-case" },
    { type: "set-search", value: "Mochila" },
    { type: "submit-search" },
    { type: "set-filter", value: "technology" },
    { type: "check-filter" },
  );
  const check = getRegressionCheck(state, "catalog");
  assert.equal(check.outcome, "fail");
  assert.match(check.expected, /Mochila Notebook/);
  assert.match(check.observed, /Mochila Urbana.*Mochila Notebook/);
  assert.equal(state.actions.filter((id) => id === "catalog").length, 1);
});

test("Regression requires the provided fictional login before recording evidence", () => {
  let state = regressionTestReducer(createInitialRegressionState(), {
    type: "set-login",
    field: "password",
    value: "invalid",
  });
  state = regressionTestReducer(state, { type: "submit-login" });
  assert.equal(state.actions.includes("login"), false);
  assert.match(state.loginFeedback, /qa@fikily\.test · Fvr123!/);

  state = regressionTestReducer(state, {
    type: "set-login",
    field: "password",
    value: "Fvr123!",
  });
  state = regressionTestReducer(state, { type: "submit-login" });
  assert.equal(state.actions.filter((id) => id === "login").length, 1);
});

test("Regression requires a changed cart quantity and validates checkout data", () => {
  let state = reduce(
    createInitialRegressionState(),
    { type: "submit-login" },
    { type: "classify", value: "pass" },
    { type: "next-case" },
    { type: "set-search", value: "Mochila" },
    { type: "submit-search" },
    { type: "set-filter", value: "accessories" },
    { type: "check-filter" },
    { type: "classify", value: "fail" },
    { type: "next-case" },
    { type: "add-product" },
    { type: "check-cart" },
  );
  assert.equal(state.actions.includes("cart"), false);
  state = reduce(
    state,
    { type: "set-quantity", value: 3 },
    { type: "check-cart" },
    { type: "classify", value: "pass" },
    { type: "next-case" },
    { type: "submit-checkout" },
  );
  assert.equal(state.cart.total, 56970);
  assert.deepEqual(state.fieldValidity, {
    address: false,
    cep: false,
    payment: false,
  });
  state = reduce(
    state,
    { type: "set-checkout-field", field: "address", value: "Rua Fikily" },
    { type: "set-checkout-field", field: "cep", value: "01001000" },
    { type: "set-checkout-field", field: "payment", value: "card" },
    { type: "submit-checkout" },
    { type: "classify", value: "pass" },
    { type: "next-case" },
    { type: "create-order" },
    { type: "check-history" },
  );
  assert.equal(state.order.id, "FF-REG-1042");
  assert.equal(state.order.total, 56970);
  assert.equal(state.order.payment, "Cartão de teste · final 4242");
  assert.equal(state.actions.filter((id) => id === "history").length, 1);
});

test("Regression grants half points after incorrect case classifications", () => {
  let state = reduce(
    createInitialRegressionState(),
    { type: "submit-login" },
    { type: "classify", value: "fail" },
    { type: "classify", value: "pass" },
  );
  assert.equal(state.records.login.points, 4);
  assert.equal(getRegressionScore(state), 12);
});

test("Regression requires the filter finding and caps first-try score at 100", () => {
  let state = completeCases();
  assert.equal(Object.keys(state.records).length, 5);
  state = reduce(
    state,
    { type: "set-review", field: "decision", value: "return" },
    { type: "set-review", field: "reason", value: "filter" },
    { type: "submit-review" },
  );
  assert.equal(state.finished, true);
  assert.equal(getRegressionScore(state), 100);

  const reset = regressionTestReducer(state, { type: "restart" });
  assert.equal(reset.finished, false);
  assert.equal(reset.actions.length, 0);
  assert.equal(reset.records.login, undefined);
  assert.equal(getRegressionScore(reset), 0);
});

test("Regression review accepts corrections at half points only", () => {
  let state = completeCases();
  state = reduce(
    state,
    { type: "set-review", field: "decision", value: "accept" },
    { type: "set-review", field: "reason", value: "checkout" },
    { type: "submit-review" },
  );
  assert.equal(state.finished, false);
  state = reduce(
    state,
    { type: "set-review", field: "decision", value: "return" },
    { type: "set-review", field: "reason", value: "filter" },
    { type: "submit-review" },
  );
  assert.equal(state.finished, true);
  assert.equal(getRegressionScore(state), 90);
});
