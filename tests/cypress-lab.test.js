import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync, existsSync } from "node:fs";
import {
  CYPRESS_MISSION_ID,
  CYPRESS_STEPS,
  CYPRESS_ACTIONS,
  CYPRESS_PROFILES,
  createCypressSession,
  filterCatalog,
  simulateCypress,
  recordCypressRun,
  answerCypressStep,
  advanceCypressStep,
  cypressScore,
  isCypressComplete,
  buildCypressCode,
} from "../core/cypress-lab.js";
import {
  getRecommendedMission,
  getSupportMaterials,
  learningTracks,
  uniqueMissions,
} from "../core/content-catalog.js";
import { getLibraryGroups } from "../core/library-catalog.js";

const root = new URL("../", import.meta.url);
const read = (file) => readFileSync(new URL(file, root), "utf8");
const plain = (value) => JSON.parse(JSON.stringify(value));
const answers = [
  "rule",
  { suite: "describe", test: "it", visit: "visit" },
  "stable",
  ["filter", "search", "apply"],
  { sync: "ready", count: "nonempty", category: "every" },
  { reference: "pass", candidate: "product", fragile: "test" },
  { sync: "condition", isolation: "own", verdict: "return" },
];

function solve(wrongSteps = []) {
  let session = createCypressSession();
  for (let index = 0; index < CYPRESS_STEPS.length; index++) {
    if (index === 5)
      for (const profile of CYPRESS_PROFILES)
        session = recordCypressRun(session, profile.id);
    if (wrongSteps.includes(index)) {
      const wrong = answerCypressStep(session, "incorrect");
      assert.equal(wrong.correct, false);
      session = wrong.session;
    }
    const result = answerCypressStep(session, answers[index]);
    assert.equal(result.correct, true);
    session = result.session;
    assert.equal(
      cypressScore(answerCypressStep(session, answers[index]).session),
      cypressScore(session),
    );
    session = advanceCypressStep(session);
  }
  return session;
}

function harness(saved) {
  const storage = new Map(
    saved ? [["qa-quest-progress", JSON.stringify(saved)]] : [],
  );
  storage.set("qa-quest-theme", "light");
  storage.set("unrelated-key", "untouched");
  let writes = 0;
  const window = {
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => {
        storage.set(key, value);
        writes++;
      },
    },
    dispatchEvent() {},
  };
  vm.runInNewContext(read("core/progress.js"), {
    window,
    CustomEvent: class {},
  });
  return { progress: window.QAQuestProgress, storage, writes: () => writes };
}

function oldSave(version) {
  const missions = Object.fromEntries(
    uniqueMissions
      .filter(
        (item) =>
          !["cypress", "playwright"].includes(item.progressId) &&
          (version >= 6 || item.progressId !== "automation-fundamentals"),
      )
      .map((item, index) => [
        item.progressId,
        {
          completed: true,
          bestXp: 70 + index,
          attempts: index + 1,
          lastCompletedAt: "2026-10-25T15:00:00.000Z",
        },
      ]),
  );
  return {
    version,
    missions,
    totalXp: Object.values(missions).reduce(
      (sum, item) => sum + item.bestXp,
      0,
    ),
    unlockedPhase: 5,
    activityDays: ["2026-10-20", "2026-10-25"],
    selectedTrack: "automation",
    tracks: {
      automation: {
        completedModules: version >= 6 ? ["automation-fundamentals"] : [],
      },
    },
  };
}

test("Cypress has seven controlled checkpoints, complete code and exactly 100 XP", () => {
  const initial = createCypressSession();
  assert.equal(advanceCypressStep(initial), initial);
  assert.equal(isCypressComplete(initial), false);
  assert.equal(recordCypressRun(initial, "candidate"), initial);
  assert.equal(
    CYPRESS_STEPS.reduce((sum, step) => sum + step.points, 0),
    100,
  );
  const solved = solve();
  assert.equal(isCypressComplete(solved), true);
  assert.equal(cypressScore(solved), 100);
  const code = buildCypressCode(solved);
  assert.doesNotMatch(code, /TODO|cy\.wait\(/);
  assert.match(code, /describe\(/);
  assert.match(code, /it\(/);
  assert.match(code, /cy\.visit\("\/catalog"\)/);
  assert.match(code, /greaterThan\(0\)/);
  assert.match(code, /Array.from\(\$cards\)/);
  assert.match(code, /data-state.*ready/);

  assert.doesNotThrow(() => new vm.Script(code));
  for (const action of CYPRESS_ACTIONS) assert(code.includes(action.code));
  assert.match(buildCypressCode(initial), /TODO/);
});

test("every incorrect checkpoint can be corrected for half, without duplicate awards", () => {
  for (let index = 0; index < CYPRESS_STEPS.length; index++) {
    const solved = solve([index]);
    assert.equal(cypressScore(solved), 100 - CYPRESS_STEPS[index].points / 2);
  }
  assert.equal(cypressScore(solve([0, 1, 2, 3, 4, 5, 6])), 50);
  assert.equal(cypressScore(createCypressSession()), 0);
});

test("reference, product failure and premature snapshot are distinct deterministic evidence", () => {
  for (const { id } of CYPRESS_PROFILES) {
    const run = simulateCypress(id);
    assert.deepEqual(run, simulateCypress(id));
    for (const field of ["expected", "observed", "impact"]) assert(run[field]);
    assert(run.trace.length >= 3);
  }
  assert.equal(simulateCypress("reference").passed, true);
  assert.equal(simulateCypress("candidate").ready, true);
  assert.equal(simulateCypress("candidate").classification, "product");
  assert.equal(simulateCypress("candidate").eventualProducts.length, 3);
  const fragile = simulateCypress("fragile");
  assert.equal(fragile.ready, false);
  assert.equal(fragile.classification, "test");
  assert(fragile.observedAt < fragile.readyAt);
  assert.equal(fragile.eventualProducts.length, 2);
  assert.match(fragile.trace.join(" "), /then.*não tem retry/);
  assert.throws(() => simulateCypress("external"), /desconhecido/);
  const initial = { ...createCypressSession(), step: 5 };
  const result = answerCypressStep(initial, answers[5]);
  assert.strictEqual(result.session, initial);
  assert.equal(result.correct, false);
  assert.deepEqual(result.session.mistakes, []);
});

test("interactive reference filters category and query without modifying fixtures or awarding XP", () => {
  assert.equal(filterCatalog().length, 3);
  assert.equal(filterCatalog("accessories", "Aurora").length, 2);
  assert.equal(filterCatalog("electronics", "teclado").length, 1);
  assert.equal(filterCatalog("all", "<script>").length, 0);
  const products = filterCatalog();
  products.pop();
  assert.equal(filterCatalog().length, 3);
  assert.equal(cypressScore(createCypressSession()), 0);
});

test("version 5 and 6 migrate once, preserving old missions, XP, attempts, activity and preferences", () => {
  for (const version of [5, 6]) {
    const save = oldSave(version),
      h = harness(save),
      state = plain(h.progress.getState());
    assert.equal(state.version, 8);
    for (const field of [
      "missions",
      "totalXp",
      "unlockedPhase",
      "activityDays",
      "selectedTrack",
    ])
      assert.deepEqual(state[field], save[field], field);
    assert.equal(h.progress.getMission("cypress"), null);
    assert.equal(h.progress.getTrackProgress("automation").total, 3);
    assert.equal(h.storage.get("qa-quest-theme"), "light");
    assert.equal(h.storage.get("unrelated-key"), "untouched");
    assert.equal(h.writes(), 1);
    h.progress.getState();
    assert.equal(h.writes(), 1);
    if (version === 6)
      assert.equal(getRecommendedMission(state).progressId, "cypress");
  }
});

test("Cypress unlocks only after phase 4, independently of Fundamentals, and repeats preserve best XP", () => {
  const h = harness();
  assert.throws(() => h.progress.saveMissionResult("cypress", 100), /Fase 4/);
  for (let phase = 1; phase <= 4; phase++)
    h.progress.saveMissionResult(`phase${phase}`, 100);
  h.progress.selectTrack("automation");
  const first = h.progress.saveMissionResult("cypress", 90);
  assert.equal(first.gainedXp, 90);
  assert.equal(first.totalXp, 490);
  assert.equal(first.attempts, 1);
  assert.equal(h.progress.getMission("automation-fundamentals"), null);
  assert.deepEqual(
    plain(h.progress.getTrackProgress("automation").completedModules),
    ["cypress"],
  );
  const repeat = h.progress.saveMissionResult("cypress", 50);
  assert.equal(repeat.bestXp, 90);
  assert.equal(repeat.gainedXp, 0);
  assert.equal(repeat.totalXp, 490);
  assert.equal(repeat.attempts, 2);
  const improve = h.progress.saveMissionResult("cypress", 100);
  assert.equal(improve.gainedXp, 10);
  assert.equal(improve.totalXp, 500);
  assert.equal(improve.attempts, 3);
  assert(h.progress.getMission("cypress").lastCompletedAt);
  const reloaded = harness(
    JSON.parse(h.storage.get(h.progress.storageKey)),
  ).progress;
  assert.equal(reloaded.getMission("cypress").bestXp, 100);
  assert.equal(reloaded.getMission("cypress").attempts, 3);
  assert.equal(reloaded.getState().selectedTrack, "automation");
});

test("newer saves stay untouched and the new module refuses to overwrite them", () => {
  const save = { ...oldSave(99), future: true };
  save.missions["future-module"] = { completed: true, bestXp: 100 };
  const h = harness(save),
    before = h.storage.get("qa-quest-progress");
  assert.equal(h.progress.isReadOnly(), true);
  assert.throws(
    () => h.progress.saveMissionResult("cypress", 100),
    /versão mais recente/,
  );
  assert.equal(h.storage.get("qa-quest-progress"), before);
  assert.equal(h.writes(), 0);
});

test("mission, hub, journey, library, PDF and Vite share the canonical Cypress ID", () => {
  const track = learningTracks.find((track) => track.id === "automation");
  assert.deepEqual(
    track.modules.map((item) => item.id),
    ["automation-fundamentals", "cypress", "playwright"],
  );
  assert.equal(track.modules[1].route, "cypress.html");
  const material = getSupportMaterials(CYPRESS_MISSION_ID);
  assert.equal(material.length, 1);
  assert.equal(material[0].filename, "qa-quest-cypress.pdf");
  assert.equal(
    getLibraryGroups()
      .find((group) => group.id === "automation")
      .entries.filter((entry) => entry.mission.id === "cypress").length,
    1,
  );
  assert(existsSync(new URL(`public/${material[0].path}`, root)));
  assert.equal(
    readFileSync(new URL(`public/${material[0].path}`, root))
      .subarray(0, 5)
      .toString(),
    "%PDF-",
  );
  assert(read("vite.config.js").includes('cypress: "cypress.html"'));
  assert(read("pages/tracks.js").includes('id: "cypress"'));
  for (const future of ["selenium"])
    assert.equal(
      track.modules.some((item) => item.id === future),
      false,
    );
  const html = read("cypress.html");
  assert(
    html.indexOf('mission-id="cypress"') <
      html.indexOf('<div id="cy-content" hidden>'),
  );
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
  for (const [, value] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (!/^(?:https?:|data:|#)/.test(value))
      assert(existsSync(new URL(value, new URL("cypress.html", root))), value);
  }
});

test("no arbitrary code execution, real requests or extension communication is introduced", () => {
  for (const file of [
    "core/cypress-lab.js",
    "pages/cypress.js",
    "components/stepscript-support.js",
  ]) {
    assert.doesNotMatch(
      read(file),
      /\beval\s*\(|\b(?:new\s+)?Function\s*\(|\bfetch\s*\(|XMLHttpRequest|chrome\.runtime|postMessage\s*\(/,
    );
  }
  assert.match(
    read("cypress.html"),
    /não instala|nenhum Cypress|nenhum Cypress/i,
  );
  assert.match(read("cypress.html"), /role="status"/);
  assert.match(read("styles/cypress.css"), /prefers-reduced-motion/);
  const support = read("components/stepscript-support.js");
  assert.match(support, /SEM XP EXTRA/);
  assert.match(support, /não executa os testes pelo painel/);
  assert.match(support, /target="_blank" rel="noopener noreferrer"/);
});
