import test from "node:test";
import assert from "node:assert/strict";
import {
  API_CASES,
  apiLabReducer,
  apiCheckoutResponse,
  createInitialApiState,
  getApiScore,
} from "../core/api-lab.js";

const act = (state, ...actions) => actions.reduce(apiLabReducer, state);

test("API fixtures preserve methods, routes and divergence profiles", () => {
  assert.deepEqual(
    API_CASES.map((test) => [test.method, test.path]),
    [
      ["GET", "/api/catalog"],
      ["POST", "/api/checkout"],
      ["POST", "/api/checkout"],
      ["GET", "/api/orders/FF-API-1042"],
    ],
  );
  assert.equal(apiCheckoutResponse("FF-API-1042").total, 379.8);
  assert.equal(API_CASES[2].response.status, "200 OK");
  assert.equal(API_CASES[2].response.body.total, 394.8);
  assert.equal("total" in API_CASES[3].response.body, false);
});

test("API concept and correction award half XP", () => {
  let state = act(createInitialApiState(), {
    type: "submit-concept",
    value: "e2e",
  });
  assert.equal(state.conceptPoints, 0);
  state = act(state, { type: "submit-concept", value: "contract" });
  assert.equal(state.conceptPoints, 5);
  assert.equal(getApiScore(state), 5);
});

test("API cases require method, execution and exact classifications", () => {
  let state = act(createInitialApiState(), {
    type: "submit-concept",
    value: "contract",
  });
  state = act(
    state,
    { type: "set-method", value: "POST" },
    { type: "execute" },
  );
  assert.equal(state.executions.catalog, undefined);
  state = act(state, { type: "set-method", value: "GET" });
  state = act(state, { type: "run-reference" });
  state = act(state, { type: "execute" });
  assert.equal(state.executions.catalog, true);
  state = act(state, { type: "classify", values: ["filter"] });
  assert.equal(state.records.catalog, 10);
  state = act(state, { type: "next" });
  assert.equal(state.step, 1);
});

test("API first-attempt completion reaches 100 XP", () => {
  let state = act(createInitialApiState(), {
    type: "submit-concept",
    value: "contract",
  });
  for (let index = 0; index < API_CASES.length; index++) {
    const test = API_CASES[index];
    state = act(state, { type: "set-method", value: test.method });
    if (test.reference) state = act(state, { type: "run-reference" });
    state = act(state, { type: "execute" });
    state = act(state, { type: "classify", values: test.answer });
    if (index < API_CASES.length - 1) state = act(state, { type: "next" });
  }
  state = act(
    state,
    { type: "set-review", field: "decision", value: "return" },
    { type: "set-review", field: "reason", value: "contracts" },
    { type: "submit-review" },
  );
  assert.equal(state.finished, true);
  assert.equal(getApiScore(state), 100);
});

test("API review is incomplete until both correct answers are retained", () => {
  let state = createInitialApiState();
  state = act(state, { type: "submit-concept", value: "contract" });
  for (let index = 0; index < API_CASES.length; index++) {
    const test = API_CASES[index];
    state = act(state, { type: "set-method", value: test.method });
    if (test.reference) state = act(state, { type: "run-reference" });
    state = act(state, { type: "execute" });
    state = act(state, { type: "classify", values: test.answer });
    if (index < API_CASES.length - 1) state = act(state, { type: "next" });
  }
  state = act(
    state,
    { type: "set-review", field: "decision", value: "accept" },
    { type: "set-review", field: "reason", value: "contracts" },
    { type: "submit-review" },
  );
  assert.equal(state.finished, false);
  state = act(
    state,
    { type: "set-review", field: "decision", value: "return" },
    { type: "submit-review" },
  );
  assert.equal(state.finished, true);
  assert.equal(getApiScore(state), 95);
});
