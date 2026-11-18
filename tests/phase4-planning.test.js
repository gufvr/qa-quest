import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateStepPercentage,
  calculateStepXp,
  getMetricScore,
  getRecommendedOptions,
  getResultMessage,
  isSelectionValid,
  metricNames,
  planningSteps,
} from "../core/phase4-planning.js";

test("the seven planning steps total 100 XP and expose all metrics", () => {
  assert.equal(planningSteps.length, 7);
  assert.equal(
    planningSteps.reduce((total, step) => total + step.points, 0),
    100,
  );
  assert.deepEqual(metricNames, ["coverage", "risk", "feasibility"]);
  assert.equal(planningSteps[5].title.includes("dois dias"), true);
});

test("single and multiple selections enforce the original bounds", () => {
  const objective = planningSteps[0];
  const scope = planningSteps[1];

  assert.equal(isSelectionValid(objective, []), false);
  assert.equal(isSelectionValid(objective, ["objective-core"]), true);
  assert.equal(isSelectionValid(objective, ["a", "b"]), false);
  assert.equal(isSelectionValid(scope, ["scope-marketplace"]), false);
  assert.equal(
    isSelectionValid(scope, ["scope-marketplace", "scope-saved-card"]),
    true,
  );
  assert.equal(
    isSelectionValid(scope, [
      "scope-marketplace",
      "scope-saved-card",
      "scope-pix",
    ]),
    false,
  );
});

test("single and multiple selections preserve full, partial and penalized scores", () => {
  const objective = planningSteps[0];
  const selectedObjective = objective.options.filter(
    ({ id }) => id === "objective-all",
  );
  assert.equal(calculateStepPercentage(objective, selectedObjective), 0.35);
  assert.equal(calculateStepXp(objective, selectedObjective), 5);

  const scope = planningSteps[1];
  const allRecommended = getRecommendedOptions(scope);
  assert.equal(calculateStepPercentage(scope, allRecommended), 1);
  assert.equal(calculateStepXp(scope, allRecommended), 14);

  const partial = scope.options.filter(({ id }) =>
    ["scope-marketplace", "scope-pix"].includes(id),
  );
  assert.equal(calculateStepPercentage(scope, partial), 0.25);
  assert.equal(calculateStepXp(scope, partial), 4);

  const incorrect = scope.options.filter(({ id }) =>
    ["scope-coupon", "scope-pix"].includes(id),
  );
  assert.equal(calculateStepPercentage(scope, incorrect), 0);
  assert.equal(calculateStepXp(scope, incorrect), 0);
});

test("metric scores average only relevant decisions and round once", () => {
  const records = [
    { metrics: ["coverage", "risk"], percentage: 0.75 },
    { metrics: ["coverage"], percentage: 0.5 },
    { metrics: ["feasibility"], percentage: 1 },
  ];

  assert.equal(getMetricScore(records, "coverage"), 63);
  assert.equal(getMetricScore(records, "risk"), 75);
  assert.equal(getMetricScore(records, "feasibility"), 100);
  assert.equal(getMetricScore(records, "unknown"), 0);
});

test("result messages preserve the original score thresholds", () => {
  assert.match(getResultMessage(85), /plano objetivo/);
  assert.match(getResultMessage(65), /pontos centrais/);
  assert.match(getResultMessage(64), /primeira versão/);
});
