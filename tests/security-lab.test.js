import test from "node:test";
import assert from "node:assert/strict";
import {
  ANA,
  BRUNO,
  createInitialSecurityState,
  getSecurityScore,
  getSecuritySnapshot,
  SECURITY_CASES,
  securityLabReducer,
} from "../core/security-lab.js";

const act = (state, ...actions) => actions.reduce(securityLabReducer, state);

test("security fixtures preserve accounts and intended findings", () => {
  assert.equal(ANA.email, "cliente.ana@fikily.test");
  assert.equal(BRUNO.email, "cliente.bruno@fikily.test");
  assert.equal(BRUNO.order, "FF-BRU-2088");
  assert.deepEqual(
    SECURITY_CASES.map((item) => [item.id, item.answer]),
    [
      ["own", "allowed"],
      ["read", "unauthorized-read"],
      ["write", "unauthorized-write"],
      ["message", "revealing-message"],
    ],
  );
});

test("security concept and correction award half points", () => {
  let state = act(createInitialSecurityState(), {
    type: "submit-concept",
    value: "performance",
  });
  assert.equal(state.conceptPoints, 0);
  state = act(state, { type: "submit-concept", value: "identity" });
  assert.equal(state.conceptPoints, 5);
  assert.equal(getSecurityScore(state), 5);
});

test("security own data, read, write and message executions remain local", () => {
  let state = act(createInitialSecurityState(), {
    type: "submit-concept",
    value: "identity",
  });
  state = act(state, { type: "deny-guest" }, { type: "login-ana" });
  assert.equal(state.session, "ana");
  state = act(state, { type: "execute", id: "own" });
  state = act(state, { type: "classify", value: "allowed" });
  state = act(state, { type: "next" });

  state = act(state, { type: "execute", id: "read" });
  assert.match(getSecuritySnapshot(state, "read").observed, /Bruno Costa/);
  state = act(state, { type: "classify", value: "unauthorized-read" });

  state = act(state, { type: "next" }, { type: "set-address", value: "lab" });
  state = act(state, { type: "execute", id: "write" });
  assert.match(
    getSecuritySnapshot(state, "write").observed,
    /Alameda do Laboratório/,
  );
  state = act(state, { type: "classify", value: "unauthorized-write" });

  state = act(state, { type: "next" }, { type: "test-known" });
  state = act(state, { type: "test-unknown" });
  state = act(state, { type: "execute", id: "message" });
  assert.equal(state.unknownDenied, true);
  assert.equal(Object.keys(state.executions).length, 4);
});

test("security correct classifications and review reach 100 XP", () => {
  let state = act(createInitialSecurityState(), {
    type: "submit-concept",
    value: "identity",
  });
  state = act(state, { type: "deny-guest" }, { type: "login-ana" });
  state = act(state, { type: "execute", id: "own" });
  state = act(state, { type: "classify", value: "allowed" }, { type: "next" });
  state = act(
    state,
    { type: "execute", id: "read" },
    { type: "classify", value: "unauthorized-read" },
    { type: "next" },
  );
  state = act(state, { type: "set-address", value: "simulation" });
  state = act(
    state,
    { type: "execute", id: "write" },
    { type: "classify", value: "unauthorized-write" },
    { type: "next" },
  );
  state = act(
    state,
    { type: "test-known" },
    { type: "test-unknown" },
    { type: "execute", id: "message" },
    { type: "classify", value: "revealing-message" },
  );
  state = act(
    state,
    { type: "set-review", field: "decision", value: "return" },
    { type: "set-review", field: "reason", value: "controls" },
    { type: "submit-review" },
  );
  assert.equal(state.finished, true);
  assert.equal(getSecurityScore(state), 100);
  assert.deepEqual(
    act(state, { type: "restart" }),
    createInitialSecurityState(),
  );
});

test("security review and incomplete state are protected", () => {
  let state = act(
    createInitialSecurityState(),
    { type: "set-review", field: "decision", value: "accept" },
    { type: "submit-review" },
  );
  assert.equal(state.finished, false);
  assert.equal(state.reviewPoints.decision, 0);
});
