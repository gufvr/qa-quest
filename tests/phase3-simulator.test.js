import test from "node:test";
import assert from "node:assert/strict";
import {
  isBugReportComplete,
  isValidEmail,
  simulatorCredentials,
  simulatorTasks,
} from "../core/phase3-simulator.js";

test("simulator uses the fictional credentials and seven task awards totaling 100 XP", () => {
  assert.deepEqual(simulatorCredentials, {
    email: "qa@fikily.test",
    password: "QA@2026",
  });
  assert.deepEqual(
    simulatorTasks.map((task) => task.points),
    [10, 10, 10, 10, 10, 20, 30],
  );
  assert.equal(
    simulatorTasks.reduce((total, task) => total + task.points, 0),
    100,
  );
  assert(simulatorTasks.every((task) => task.expectedEvents.length > 0));
});

test("simulator email validation preserves accepted and rejected examples", () => {
  for (const email of ["qa@fikily.test", "qa+lab@example.org"])
    assert.equal(isValidEmail(email), true, email);
  for (const email of ["qa@", "@fikily.test", "qa fikily.test", ""])
    assert.equal(isValidEmail(email), false, email);
});

test("bug report validation enforces each existing minimum length", () => {
  const report = {
    title: "12345678",
    severity: "baixa",
    steps: "123456789012345",
    expected: "1234567890",
    actual: "1234567890",
  };
  assert.equal(isBugReportComplete(report), true);

  for (const invalidReport of [
    { ...report, title: "1234567" },
    { ...report, severity: "" },
    { ...report, steps: "12345678901234" },
    { ...report, expected: "123456789" },
    { ...report, actual: "123456789" },
  ])
    assert.equal(isBugReportComplete(invalidReport), false);
});
