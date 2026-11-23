import test from "node:test";
import assert from "node:assert/strict";
import {
  createInitialPerformanceState,
  getCorrectPerformanceClassification,
  getPerformanceErrorRate,
  getPerformanceObservation,
  getPerformanceScore,
  PERFORMANCE_SAMPLES,
  performanceLabReducer,
} from "../core/performance-lab.js";

const act = (state, ...actions) => actions.reduce(performanceLabReducer, state);

test("performance samples preserve limits and fixed observations", () => {
  assert.equal(getPerformanceErrorRate(PERFORMANCE_SAMPLES[0]), 0.1);
  assert.equal(getPerformanceErrorRate(PERFORMANCE_SAMPLES[1]), 0.5);
  assert.equal(getPerformanceErrorRate(PERFORMANCE_SAMPLES[2]), 8);
  assert.equal(
    getCorrectPerformanceClassification(PERFORMANCE_SAMPLES[0]),
    "meets",
  );
  assert.equal(
    getCorrectPerformanceClassification(PERFORMANCE_SAMPLES[1]),
    "meets",
  );
  assert.equal(
    getCorrectPerformanceClassification(PERFORMANCE_SAMPLES[2]),
    "stress",
  );
  assert.match(getPerformanceObservation(PERFORMANCE_SAMPLES[2]), /24\.000/);
  assert.match(getPerformanceObservation(PERFORMANCE_SAMPLES[2]), /6,5 s/);
});

test("performance planning and correction award half points", () => {
  let state = act(
    createInitialPerformanceState(),
    { type: "submit-question", value: "sanity" },
    { type: "submit-question", value: "capacity" },
  );
  assert.equal(state.planning.question, 5);
  state = act(
    state,
    { type: "submit-criteria", value: "average" },
    { type: "submit-criteria", value: "all" },
  );
  assert.equal(state.planning.criteria, 5);
  assert.equal(getPerformanceScore(state), 10);
});

test("performance execution and classification total 100 XP", () => {
  let state = act(
    createInitialPerformanceState(),
    { type: "submit-question", value: "capacity" },
    { type: "submit-criteria", value: "all" },
  );
  for (let index = 0; index < PERFORMANCE_SAMPLES.length; index++) {
    state = act(
      state,
      { type: "set-profile", value: true },
      { type: "run" },
      {
        type: "classify",
        value: getCorrectPerformanceClassification(PERFORMANCE_SAMPLES[index]),
      },
      ...(index < PERFORMANCE_SAMPLES.length - 1 ? [{ type: "next" }] : []),
    );
  }
  state = act(
    state,
    { type: "set-review", field: "decision", value: "scoped" },
    { type: "set-review", field: "reason", value: "metrics" },
    { type: "submit-review" },
  );
  assert.equal(state.finished, true);
  assert.equal(getPerformanceScore(state), 100);
});

test("performance review requires all samples and restart clears state", () => {
  let state = createInitialPerformanceState();
  state = act(
    state,
    { type: "set-review", field: "decision", value: "reject" },
    { type: "set-review", field: "reason", value: "smoke" },
    { type: "submit-review" },
  );
  assert.equal(state.finished, false);

  state = act(
    state,
    { type: "submit-question", value: "capacity" },
    { type: "submit-criteria", value: "all" },
  );
  for (let index = 0; index < PERFORMANCE_SAMPLES.length; index++) {
    state = act(
      state,
      { type: "set-profile", value: true },
      { type: "run" },
      {
        type: "classify",
        value: getCorrectPerformanceClassification(PERFORMANCE_SAMPLES[index]),
      },
      ...(index < PERFORMANCE_SAMPLES.length - 1 ? [{ type: "next" }] : []),
    );
  }
  state = act(
    state,
    { type: "set-review", field: "decision", value: "scoped" },
    { type: "set-review", field: "reason", value: "metrics" },
    { type: "submit-review" },
  );
  assert.equal(state.finished, true);
  assert.deepEqual(
    act(state, { type: "restart" }),
    createInitialPerformanceState(),
  );
});
