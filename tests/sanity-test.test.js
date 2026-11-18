import test from "node:test";
import assert from "node:assert/strict";
import {
  createInitialSanityState,
  getSanityCheck,
  getSanityScore,
  getSanityStepId,
  sanityTestReducer,
} from "../core/sanity-test.js";

const reduce = (state, ...actions) => actions.reduce(sanityTestReducer, state);

function completeChecks(state = createInitialSanityState()) {
  state = reduce(
    state,
    { type: "open-checkout" },
    { type: "classify", value: "pass" },
    { type: "next-step" },
    { type: "set-field", field: "address", value: "Rua Fikily, 101" },
    { type: "set-field", field: "cep", value: "01001-000" },
    { type: "set-field", field: "payment", value: "pix" },
    { type: "submit-fields" },
    { type: "classify", value: "pass" },
    { type: "next-step" },
    { type: "compare-data" },
    { type: "classify", value: "fail" },
    { type: "next-step" },
    { type: "open-empty-checkout" },
    { type: "classify", value: "pass" },
  );
  return state;
}

test("Sanity retains the fixed $15 checkout divergence for all quantities", () => {
  let state = createInitialSanityState();
  state = sanityTestReducer(state, { type: "set-quantity", value: 3 });
  state = sanityTestReducer(state, { type: "open-checkout" });
  assert.equal(state.cart.total, 56970);
  assert.equal(state.checkoutTotal, 58470);

  state = sanityTestReducer(state, { type: "next-step" });
  state = reduce(
    state,
    { type: "set-field", field: "address", value: "Rua Fikily" },
    { type: "set-field", field: "cep", value: "01001000" },
    { type: "set-field", field: "payment", value: "card" },
    { type: "submit-fields" },
    { type: "next-step" },
  );
  const check = getSanityCheck(state, "consistency");
  assert.equal(check.outcome, "fail");
  assert.match(check.expected, /R\$\s?569,70/);
  assert.match(check.observed, /R\$\s?584,70/);
});

test("Sanity validates delivery fields and records each action once", () => {
  let state = reduce(
    createInitialSanityState(),
    { type: "open-checkout" },
    { type: "classify", value: "pass" },
    { type: "next-step" },
    { type: "set-field", field: "address", value: "Rua" },
    { type: "set-field", field: "cep", value: "123" },
    { type: "set-field", field: "payment", value: "cash" },
    { type: "submit-fields" },
  );
  assert.equal(state.actions.includes("fields"), false);
  assert.deepEqual(state.fieldValidity, {
    address: false,
    cep: false,
    payment: false,
  });

  state = reduce(
    state,
    { type: "set-field", field: "address", value: "Rua Fikily" },
    { type: "set-field", field: "cep", value: "01001-000" },
    { type: "set-field", field: "payment", value: "pix" },
    { type: "submit-fields" },
    { type: "submit-fields" },
  );
  assert.equal(state.actions.filter((id) => id === "fields").length, 1);
  assert.equal(state.paymentLabel, "Pix de teste");
});

test("Sanity awards half XP after a wrong classification and requires all checks", () => {
  let state = reduce(
    createInitialSanityState(),
    { type: "open-checkout" },
    { type: "classify", value: "fail" },
    { type: "classify", value: "pass" },
  );
  assert.equal(state.records.open.points, 5);
  assert.equal(getSanityScore(state), 15);
  assert.equal(sanityTestReducer(state, { type: "submit-review" }), state);

  state = completeChecks(state);
  assert.equal(Object.keys(state.records).length, 4);
  assert.equal(getSanityStepId(state), "empty");
});

test("Sanity review requires returning the candidate for the total divergence", () => {
  let state = completeChecks();
  state = reduce(
    state,
    { type: "set-review", field: "decision", value: "accept" },
    { type: "set-review", field: "reason", value: "total" },
    { type: "submit-review" },
  );
  assert.equal(state.finished, false);
  assert.equal(state.reasonPoints, 10);
  assert.match(state.reviewFeedback, /Devolv/);

  state = sanityTestReducer(state, {
    type: "set-review",
    field: "decision",
    value: "return",
  });
  state = sanityTestReducer(state, { type: "submit-review" });
  assert.equal(state.finished, true);
  assert.equal(getSanityScore(state), 95);
});

test("Sanity first-try completion reaches 100 XP and restart clears mission state", () => {
  let state = completeChecks();
  state = reduce(
    state,
    { type: "set-review", field: "decision", value: "return" },
    { type: "set-review", field: "reason", value: "total" },
    { type: "submit-review" },
  );
  assert.equal(getSanityScore(state), 100);
  assert.equal(state.finished, true);

  const reset = sanityTestReducer(state, { type: "restart" });
  assert.equal(reset.finished, false);
  assert.equal(reset.actions.length, 0);
  assert.equal(reset.records.open, undefined);
  assert.equal(getSanityScore(reset), 0);
});
