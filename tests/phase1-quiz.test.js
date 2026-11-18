import test from "node:test";
import assert from "node:assert/strict";
import {
  createMissionQuestions,
  QUESTIONS_PER_ATTEMPT,
  randomizeOptions,
} from "../core/phase1-quiz.js";

test("mission attempts contain distinct questions with valid options", () => {
  const questions = createMissionQuestions(() => 0);

  assert.equal(questions.length, QUESTIONS_PER_ATTEMPT);
  assert.equal(
    new Set(questions.map((question) => question.question)).size,
    QUESTIONS_PER_ATTEMPT,
  );
  for (const question of questions) {
    assert.equal(question.options.length, 4);
    assert(question.correct >= 0 && question.correct < question.options.length);
  }
});

test(
  "option randomization preserves the correct answer without mutating input",
  () => {
    const question = {
      question: "Qual alternativa está correta?",
      options: ["A", "B", "C", "D"],
      correct: 2,
    };
    const originalOptions = [...question.options];
    const randomized = randomizeOptions(question, () => 0);

    assert.equal(randomized.options[randomized.correct], "C");
    assert.deepEqual(question.options, originalOptions);
    assert.equal(question.correct, 2);
  },
);
