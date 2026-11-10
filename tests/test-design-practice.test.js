import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import {
  QUANTITY_RULE,
  DELIVERY_RULES,
  checkEquivalenceRepresentatives,
  checkBoundarySelection,
  checkDeliveryTable,
  checkTechniqueReview,
} from "../core/test-design-practice.js";
import {
  baseMissions,
  getSupportMaterials,
  learningTracks,
} from "../core/content-catalog.js";
import { getLibraryGroups } from "../core/library-catalog.js";

const root = new URL("../", import.meta.url);
const read = (file) => readFileSync(new URL(file, root), "utf8");

test("equivalence accepts different representatives and keeps the integer domain explicit", () => {
  assert(Object.isFrozen(QUANTITY_RULE));
  assert.deepEqual(QUANTITY_RULE, { minimum: 1, maximum: 5 });
  for (const values of [
    { below: "0", inside: "3", above: "6" },
    { below: -2, inside: 4, above: 9 },
    { below: -100, inside: 1, above: 100 },
    { below: 0, inside: 5, above: 6 },
  ]) {
    const before = structuredClone(values);
    assert.equal(checkEquivalenceRepresentatives(values).correct, true);
    assert.deepEqual(values, before);
  }
  for (const values of [
    undefined,
    {},
    { below: "", inside: 3, above: 6 },
    { below: null, inside: 3, above: 6 },
    { below: 0.5, inside: 3, above: 6 },
    { below: 0, inside: 6, above: 7 },
    { below: 2, inside: 3, above: 4 },
  ])
    assert.equal(checkEquivalenceRepresentatives(values).correct, false);
});

test("boundary review requires both adjacent pairs without extra or duplicate selections", () => {
  assert.equal(checkBoundarySelection([0, 1, 5, 6]).correct, true);
  assert.equal(checkBoundarySelection(["6", "5", "1", "0"]).correct, true);
  for (const values of [
    [],
    [1, 5],
    [0, 1, 3, 5, 6],
    [0, 1, 5, 5, 6],
    [0, 1, 5, null],
    undefined,
  ])
    assert.equal(checkBoundarySelection(values).correct, false);
  assert.match(checkBoundarySelection([1, 5]).feedback, /0, 1, 5 e 6/);
});

test("the four feasible delivery rules preserve AND rather than OR", () => {
  assert.equal(DELIVERY_RULES.length, 4);
  assert(Object.isFrozen(DELIVERY_RULES));
  assert(DELIVERY_RULES.every(Object.isFrozen));
  const answer = Object.fromEntries(
    DELIVERY_RULES.map((rule) => [rule.id, rule.delivery]),
  );
  assert.deepEqual(answer, {
    r1: "free",
    r2: "standard",
    r3: "standard",
    r4: "standard",
  });
  assert.equal(checkDeliveryTable(answer).correct, true);
  for (const rule of DELIVERY_RULES)
    assert.equal(
      checkDeliveryTable({
        ...answer,
        [rule.id]: rule.delivery === "free" ? "standard" : "free",
      }).correct,
      false,
    );
  assert.equal(checkDeliveryTable({ r1: "free" }).correct, false);
});

test("review distinguishes the three techniques and can be repeated without state or score", () => {
  const correct = {
    groups: "equivalence",
    edges: "boundary",
    combinations: "decision",
  };
  assert.equal(checkTechniqueReview(correct).correct, true);
  assert.equal(
    checkTechniqueReview({ ...correct, groups: "decision" }).correct,
    false,
  );
  for (let index = 0; index < 3; index++) {
    assert.deepEqual(
      checkTechniqueReview(correct),
      checkTechniqueReview(correct),
    );
    assert.equal("points" in checkTechniqueReview(correct), false);
  }
});

test("the complement has no progress, arbitrary-code execution or storage dependency", () => {
  const files = [
    "core/test-design-practice.js",
    "components/test-design-practice.js",
  ];
  for (const file of files) {
    const source = read(file);
    assert.doesNotMatch(
      source,
      /localStorage|sessionStorage|QAQuestProgress|saveMissionResult|fetch\s*\(|\beval\s*\(|new\s+Function/,
    );
    assert.doesNotMatch(source, /\/\*|^\s*\/\//m);
  }
  const component = read(files[1]);
  assert.match(component, /event\.preventDefault\(\)/);
  assert.match(component, /event\.stopPropagation\(\)/);
  assert.match(component, /role="status" aria-live="polite"/);
  assert.match(component, /type="submit"/);
  assert.match(component, /test-design-table-wrap" tabindex="0" role="region"/);
  const phase2 = read("phase2.html");
  assert(
    phase2.indexOf("phase-two-complement") >
      phase2.indexOf('id="result-screen"'),
  );
  assert(phase2.includes("<qa-test-design-practice>"));
  assert.equal((phase2.match(/<h1(?:\s|>)/g) || []).length, 1);
});

test("phase2 material is canonical, ungated in the hub and appears once in the base library", () => {
  assert.equal(baseMissions.length, 4);
  assert.equal(learningTracks.length, 5);
  const [material] = getSupportMaterials("phase2");
  assert.equal(getSupportMaterials("phase2").length, 1);
  assert.equal(material.id, "test-design-guide");
  assert.equal(material.path, "materiais/qa-quest-tecnicas-projeto-testes.pdf");
  assert.equal(material.version, "1.0");
  const entries = getLibraryGroups()
    .filter((group) => group.id === "base")
    .flatMap((group) => group.entries)
    .filter(({ mission }) => mission.progressId === "phase2");
  assert.equal(entries.length, 1);
  const tracks = read("tracks.html");
  assert.equal((tracks.match(/mission-id="phase2"/g) || []).length, 1);
  assert(
    tracks.indexOf("tracks-foundation-material") >
      tracks.indexOf('id="track-details"'),
  );
  assert(read("phase2.html").includes('mission-id="phase2"'));
  for (const route of ["phase2.html", "phase3.html", "tracks.html"])
    for (const [, value] of read(route).matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(https?:|data:|#|mailto:)/.test(value)) continue;
      assert(
        existsSync(new URL(value, new URL(route, root))),
        `${route}: ${value}`,
      );
    }
  const file = new URL(`public/${material.path}`, root);
  assert(existsSync(file));
  const pdf = readFileSync(file);
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  assert.equal(
    (pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length,
    6,
  );
  assert(read("tools/generate-test-design-guide.py").includes("invariant=1"));
});

test("the phase3 checklist is native, optional and outside both evaluated views", () => {
  const html = read("phase3.html");
  const checklist = html.slice(
    html.indexOf('<details class="a11y-study">'),
    html.indexOf('<div class="simulator-workspace"'),
  );
  assert.equal((checklist.match(/type="checkbox"/g) || []).length, 4);
  for (const text of [
    "Rótulos e campos",
    "Operação por teclado",
    "Foco visível",
    "Mensagens de validação",
  ])
    assert(checklist.includes(text));
  assert(checklist.includes("não são salvas nem concedem XP"));
  assert(checklist.includes("não substitui avaliação"));
  assert.doesNotMatch(checklist, /<form|onchange=|onclick=/);
  assert(
    read("styles/phase3.css").includes(
      ".a11y-study :is(summary, input, a):focus-visible",
    ),
  );
  assert(read("styles/phase2.css").includes("prefers-reduced-motion"));
});
