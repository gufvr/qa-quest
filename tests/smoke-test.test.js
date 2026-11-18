import test from "node:test";
import assert from "node:assert/strict";
import {
  createInitialSmokeState,
  getSmokeCheckStatus,
  getSmokeClassificationFeedback,
  getSmokeReleaseStatus,
  getSmokeScore,
  SMOKE_CHECKS,
  smokeTestReducer,
} from "../core/smoke-test.js";

function act(state, ...actions) {
  return actions.reduce(smokeTestReducer, state);
}

function completeChecks(state) {
  return SMOKE_CHECKS.reduce(
    (current, check) =>
      act(
        current,
        { type: "select-check", id: check.id },
        {
          type: "run-check",
        },
        {
          type: "classify-check",
          value: check.outcome,
        },
      ),
    state,
  );
}

test("six smoke fixtures preserve essential paths and fixed outcomes", () => {
  assert.deepEqual(
    SMOKE_CHECKS.map(({ id, outcome }) => [id, outcome]),
    [
      ["home", "pass"],
      ["catalog", "pass"],
      ["cart", "pass"],
      ["checkout", "fail"],
      ["login", "pass"],
      ["api", "fail"],
    ],
  );
  assert.equal(SMOKE_CHECKS[3].status, "503 Service Unavailable");
  assert.equal(SMOKE_CHECKS[5].status, "500 Internal Server Error");
  assert.equal(SMOKE_CHECKS[3].path, "/checkout");
  assert.equal(SMOKE_CHECKS[5].path, "/api/orders");
});

test("a check must be executed and corrected classifications award half XP", () => {
  let state = createInitialSmokeState();
  state = act(state, { type: "select-check", id: "home" });
  const beforeRun = state;
  state = act(state, { type: "classify-check", value: "pass" });
  assert.strictEqual(state, beforeRun);

  state = act(state, { type: "run-check" });
  state = act(state, { type: "classify-check", value: "fail" });
  assert.equal(state.attempts.home, 1);
  assert.equal(state.records.home, undefined);
  assert.match(state.classificationFeedback, /valerá 5 XP/);

  state = act(state, { type: "classify-check", value: "pass" });
  assert.equal(state.attempts.home, 2);
  assert.equal(state.records.home.points, 5);
  assert.equal(getSmokeScore(state), 5);
  assert.equal(
    getSmokeClassificationFeedback(state),
    state.classificationFeedback,
  );
});

test("reopening a recorded check neither duplicates evidence nor XP", () => {
  let state = createInitialSmokeState();
  state = act(
    state,
    { type: "select-check", id: "checkout" },
    { type: "run-check" },
    { type: "classify-check", value: "fail" },
  );

  const recordedState = state;
  state = act(
    state,
    { type: "select-check", id: "checkout" },
    { type: "run-check" },
    { type: "classify-check", value: "fail" },
  );

  assert.deepEqual(state.observed, ["checkout"]);
  assert.equal(Object.keys(state.records).length, 1);
  assert.equal(state.attempts.checkout, 1);
  assert.equal(getSmokeScore(state), 10);
  assert.notStrictEqual(state, recordedState);
  assert.match(getSmokeClassificationFeedback(state), /10 XP/);
  assert.equal(getSmokeCheckStatus(state, "checkout"), "Falhou — crítico");
});

test("release status identifies each recorded critical failure", () => {
  let state = createInitialSmokeState();
  state = act(
    state,
    { type: "select-check", id: "checkout" },
    { type: "run-check" },
    { type: "classify-check", value: "fail" },
  );
  assert.equal(getSmokeReleaseStatus(state).blocked, true);
  assert.match(getSmokeReleaseStatus(state).text, /1 falha\(s\) crítica\(s\)/);

  state = act(
    state,
    { type: "select-check", id: "api" },
    { type: "run-check" },
    { type: "classify-check", value: "fail" },
  );
  assert.match(getSmokeReleaseStatus(state).text, /2 falha\(s\) crítica\(s\)/);
});

test("first-attempt checks and final correct review total 100 XP", () => {
  let state = completeChecks(createInitialSmokeState());
  assert.equal(Object.keys(state.records).length, 6);
  assert.equal(getSmokeScore(state), 60);
  assert.equal(getSmokeReleaseStatus(state).blocked, true);

  state = act(state, { type: "set-decision", value: "block" });
  state = act(state, { type: "set-impact", value: "critical" });
  state = act(state, { type: "submit-review" });

  assert.equal(state.finished, true);
  assert.equal(state.decisionPoints, 20);
  assert.equal(state.impactPoints, 20);
  assert.equal(getSmokeScore(state), 100);
  assert.strictEqual(act(state, { type: "submit-review" }), state);
});

test("review requires all checks and retains each correct choice after an error", () => {
  let state = createInitialSmokeState();
  state = act(
    state,
    { type: "set-decision", value: "block" },
    { type: "set-impact", value: "critical" },
    { type: "submit-review" },
  );
  assert.equal(state.finished, false);
  assert.equal(state.decisionAttempts, 0);

  state = completeChecks(state);
  state = act(
    state,
    { type: "set-decision", value: "approve" },
    { type: "set-impact", value: "critical" },
    { type: "submit-review" },
  );
  assert.equal(state.finished, false);
  assert.equal(state.decisionPoints, 0);
  assert.equal(state.impactPoints, 20);

  state = act(
    state,
    { type: "set-decision", value: "block" },
    { type: "submit-review" },
  );
  assert.equal(state.finished, true);
  assert.equal(state.decisionPoints, 10);
  assert.equal(state.impactPoints, 20);
  assert.equal(getSmokeScore(state), 90);
});

test("correct decision points remain while an incorrect impact is corrected", () => {
  let state = completeChecks(createInitialSmokeState());
  state = act(
    state,
    { type: "set-decision", value: "block" },
    { type: "set-impact", value: "majority" },
    { type: "submit-review" },
  );
  assert.equal(state.finished, false);
  assert.equal(state.decisionPoints, 20);
  assert.equal(state.impactPoints, 0);

  state = act(
    state,
    { type: "set-impact", value: "critical" },
    { type: "submit-review" },
  );
  assert.equal(state.finished, true);
  assert.equal(state.decisionPoints, 20);
  assert.equal(state.impactPoints, 10);
  assert.equal(getSmokeScore(state), 90);
});

test("restart clears checks, attempts, scores, and review state", () => {
  let state = completeChecks(createInitialSmokeState());
  state = act(
    state,
    { type: "set-decision", value: "block" },
    { type: "set-impact", value: "critical" },
    { type: "submit-review" },
    { type: "restart" },
  );

  assert.deepEqual(state, createInitialSmokeState());
  assert.equal(getSmokeScore(state), 0);
  assert.equal(getSmokeReleaseStatus(state).blocked, false);
});
