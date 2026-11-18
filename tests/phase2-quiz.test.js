import test from "node:test";
import assert from "node:assert/strict";
import {
  createMissionQuestions,
  summarizeCompetencies,
} from "../core/phase2-quiz.js";

test("mission questions retain their counts, categories, and correct options when shuffled", () => {
  const questions = createMissionQuestions(() => 0);

  assert.equal(questions.length, 10);
  assert.equal(
    questions[0].options[questions[0].correct],
    "Identificar ator, objetivo, pré-condições, dados, ações e resultados esperados.",
  );
  assert.deepEqual(
    questions.reduce((counts, question) => {
      counts[question.category] = (counts[question.category] || 0) + 1;
      return counts;
    }, {}),
    {
      Fluxos: 4,
      Critérios: 3,
      "Revisão e riscos": 3,
    },
  );
  for (const question of questions) {
    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options).size, 4);
    assert(Number.isInteger(question.correct));
    assert(question.correct >= 0 && question.correct < question.options.length);
  }
  assert.deepEqual(questions, createMissionQuestions(() => 0));
});

test("competency summary reports the correct results and percentage per category", () => {
  const questions = createMissionQuestions(() => 0);
  const answers = questions.map((question, index) =>
    question.category === "Fluxos"
      ? index < 2
      : question.category === "Critérios"
        ? index === 4
        : index === 9,
  );

  assert.deepEqual(summarizeCompetencies(questions, answers), [
    {
      category: "Fluxos",
      correct: 2,
      total: 4,
      percentage: 50,
    },
    {
      category: "Critérios",
      correct: 1,
      total: 3,
      percentage: (1 / 3) * 100,
    },
    {
      category: "Revisão e riscos",
      correct: 1,
      total: 3,
      percentage: (1 / 3) * 100,
    },
  ]);
});

test("competency summary rejects questions outside the supported categories", () => {
  assert.throws(
    () => summarizeCompetencies([{ category: "Outra" }], [true]),
    /Competência desconhecida: Outra/,
  );
});
