import test from "node:test";
import assert from "node:assert/strict";
import {
  BUG_REPORT_ORDER,
  BUG_REPORT_QUESTIONS,
  bugReportReducer,
  createInitialBugReportState,
  getBugReportScore,
} from "../core/bug-report-lab.js";

const act = (state, ...actions) => actions.reduce(bugReportReducer, state);

test("bug report has ten scored steps and fixed reproduction order", () => {
  assert.equal(BUG_REPORT_QUESTIONS.length, 9);
  assert.deepEqual(BUG_REPORT_ORDER, ["open", "search", "filter", "compare"]);
});

test("bug report capture and questions score 100 XP on first attempt", () => {
  let state = act(createInitialBugReportState(), { type: "capture" });
  assert.equal(getBugReportScore(state), 10);
  for (let index = 0; index < BUG_REPORT_QUESTIONS.length; index++) {
    const question = BUG_REPORT_QUESTIONS[index];
    if (question.type === "order") {
      state = { ...state, order: [...BUG_REPORT_ORDER] };
      state = act(state, { type: "submit-answer", values: [] });
    } else {
      const values =
        question.type === "multiple" ? question.answer : [question.answer];
      state = act(state, { type: "submit-answer", values });
    }
    state = act(state, { type: "next" });
  }
  assert.equal(state.finished, true);
  assert.equal(getBugReportScore(state), 100);
});

test("bug report corrections award half XP and restart clears draft", () => {
  let state = act(createInitialBugReportState(), { type: "capture" });
  const question = BUG_REPORT_QUESTIONS[0];
  state = act(state, {
    type: "submit-answer",
    values: ["vague"],
  });
  assert.equal(state.points.title, undefined);
  state = act(state, {
    type: "submit-answer",
    values: [question.answer],
  });
  assert.equal(state.points.title, 5);
  state = act(state, { type: "restart" });
  assert.deepEqual(state, createInitialBugReportState());
});
