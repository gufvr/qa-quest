import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync, existsSync } from "node:fs";
import {
  SELENIUM_MISSION_ID,
  SELENIUM_CASE,
  SELENIUM_STEPS,
  SELENIUM_PROFILES,
  createSeleniumSession,
  inspectSeleniumResult,
  runSeleniumCounterexample,
  simulateSelenium,
  recordSeleniumRun,
  answerSeleniumStep,
  advanceSeleniumStep,
  seleniumScore,
  isSeleniumComplete,
  buildSeleniumCode,
  buildFragileSeleniumCode,
} from "../core/selenium-lab.js";
import {
  learningTracks,
  uniqueMissions,
  getRecommendedMission,
  getSupportMaterials,
  isAvailable,
} from "../core/content-catalog.js";
import { getLibraryGroups } from "../core/library-catalog.js";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const plain = (value) => JSON.parse(JSON.stringify(value));
const answers = [
  { imports: "webdriver", session: "fresh", cleanup: "finally" },
  { field: "id", button: "testid", result: "testid" },
  ["find", "fill", "click", "wait", "assert"],
  "ready",
  { message: "text", discount: "amount", total: "amount" },
  { reference: "pass", candidate: "product", fragile: "test" },
  { isolation: "fresh", cleanup: "finally", verdict: "return" },
];

function solve(wrong = []) {
  let session = createSeleniumSession();
  for (let index = 0; index < SELENIUM_STEPS.length; index++) {
    if (index === 4) session = runSeleniumCounterexample(session);
    if (index === 5)
      for (const profile of SELENIUM_PROFILES)
        session = recordSeleniumRun(session, profile.id);
    if (wrong.includes(index))
      session = answerSeleniumStep(session, "incorrect").session;
    const result = answerSeleniumStep(session, answers[index]);
    assert.equal(result.correct, true);
    session = result.session;
    assert.equal(
      seleniumScore(answerSeleniumStep(session, answers[index]).session),
      seleniumScore(session),
    );
    session = advanceSeleniumStep(session);
  }
  return session;
}

function harness(saved, unavailable = false) {
  const storage = new Map(
    saved ? [["qa-quest-progress", JSON.stringify(saved)]] : [],
  );
  storage.set("qa-quest-theme", "light");
  storage.set("unrelated", "keep");
  let writes = 0;
  const window = {
    localStorage: {
      getItem(key) {
        if (unavailable) throw Error("Storage unavailable");
        return storage.get(key) ?? null;
      },
      setItem(key, value) {
        if (unavailable) throw Error("Storage unavailable");
        writes++;
        storage.set(key, value);
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
  const ids = uniqueMissions
    .map((item) => item.progressId)
    .filter(
      (id) =>
        id !== "selenium" &&
        (version >= 8 || id !== "playwright") &&
        (version >= 7 || id !== "cypress") &&
        (version >= 6 || id !== "automation-fundamentals"),
    );
  const missions = Object.fromEntries(
    ids.map((id, index) => [
      id,
      {
        completed: true,
        bestXp: 70 + index,
        attempts: index + 2,
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
        completedModules: [
          "automation-fundamentals",
          "cypress",
          "playwright",
        ].filter((id) => missions[id]),
      },
    },
  };
}

test("seven steps total 100 XP and generate JavaScript syntax without running it", () => {
  assert.deepEqual(
    SELENIUM_STEPS.map((step) => step.points),
    [10, 15, 15, 15, 15, 20, 10],
  );
  const session = solve();
  assert(isSeleniumComplete(session));
  assert.equal(seleniumScore(session), 100);
  const code = buildSeleniumCode(session);
  assert.doesNotThrow(() => new vm.Script(code, { filename: "cupom.cjs" }));
  for (const fragment of [
    'require("selenium-webdriver")',
    'require("node:assert/strict")',
    "new Builder()",
    "By.id",
    "sendKeys",
    "driver.wait",
    "assert.equal",
    "finally",
    "driver.quit()",
  ])
    assert(code.includes(fragment), fragment);
  assert.doesNotMatch(code, /@playwright\/test|\bcy\.|\beval\(/);
  assert.match(buildFragileSeleniumCode(), /setTimeout\(resolve, 300\)/);
});

test("missing evidence does not cost points; wrong answers give half after correction", () => {
  const initial = createSeleniumSession();
  assert.equal(seleniumScore(initial), 0);
  const checks = { ...initial, step: 4 };
  const missing = answerSeleniumStep(checks, answers[4]);
  assert.equal(missing.correct, false);
  assert.deepEqual(missing.session.mistakes, []);
  assert.equal(seleniumScore(missing.session), 0);
  const observed = runSeleniumCounterexample(checks);
  const wrong = answerSeleniumStep(observed, "incorrect");
  assert.deepEqual(wrong.session.mistakes, ["checks"]);
  assert.equal(answerSeleniumStep(wrong.session, answers[4]).points, 7.5);
  const diagnosis = { ...initial, step: 5 };
  assert.deepEqual(
    answerSeleniumStep(diagnosis, answers[5]).session.mistakes,
    [],
  );
  assert.equal(seleniumScore(solve([1])), 92.5);
  assert.equal(Math.round(seleniumScore(solve([1]))), 93);
  assert.equal(seleniumScore(solve([0, 1, 2, 3, 4, 5, 6])), 50);
  assert.equal(advanceSeleniumStep(initial), initial);
});

test("message-only counterexample and all three fixed profiles support distinct diagnoses", () => {
  const counterexample = runSeleniumCounterexample({
    ...createSeleniumSession(),
    step: 4,
  });
  assert.equal(counterexample.counterexample.messagePass, true);
  assert.equal(counterexample.counterexample.discountPass, false);
  assert.equal(counterexample.counterexample.totalPass, false);
  assert.deepEqual(
    inspectSeleniumResult({
      message: SELENIUM_CASE.message,
      discount: SELENIUM_CASE.discount,
      total: SELENIUM_CASE.total,
    }),
    { messagePass: true, discountPass: true, totalPass: true },
  );
  const reference = simulateSelenium("reference");
  const candidate = simulateSelenium("candidate");
  const fragile = simulateSelenium("fragile");
  assert.equal(reference.classification, "pass");
  assert.equal(candidate.classification, "product");
  assert.equal(fragile.classification, "test");
  assert.equal(candidate.ready, true);
  assert.equal(candidate.result.total, "R$ 200,00");
  assert.equal(fragile.ready, false);
  assert.equal(fragile.observedAt, 300);
  assert.equal(fragile.readyAt, 800);
  assert.equal(fragile.eventualResult.total, "R$ 180,00");
  for (const run of [reference, candidate, fragile]) {
    assert.equal(run.timeline.length, 3);
    assert(run.expected && run.observed && run.impact);
  }
  assert.throws(() => simulateSelenium("unknown"), /desconhecido/);
});

test("versions 5 through 8 migrate once without losing previous missions or preferences", () => {
  for (const version of [5, 6, 7, 8]) {
    const saved = oldSave(version);
    const h = harness(saved);
    const state = plain(h.progress.getState());
    assert.equal(state.version, 9);
    for (const key of [
      "missions",
      "totalXp",
      "activityDays",
      "selectedTrack",
      "unlockedPhase",
    ])
      assert.deepEqual(state[key], saved[key], key);
    assert.equal(h.progress.getTrackProgress("automation").total, 4);
    assert.equal(h.progress.getMission("selenium"), null);
    assert.equal(h.storage.get("qa-quest-theme"), "light");
    assert.equal(h.storage.get("unrelated"), "keep");
    assert.equal(h.writes(), 1);
    h.progress.getState();
    assert.equal(h.writes(), 1);
    if (version === 8) {
      assert.deepEqual(
        state.tracks.automation.completedModules,
        saved.tracks.automation.completedModules,
      );
      assert.equal(getRecommendedMission(state).progressId, "selenium");
    }
  }
});

test("Selenium requires phase 4 only; repeats preserve best XP and future saves are read-only", () => {
  const h = harness();
  assert.throws(() => h.progress.saveMissionResult("selenium", 100), /Fase 4/);
  for (let phase = 1; phase <= 4; phase++)
    h.progress.saveMissionResult(`phase${phase}`, 100);
  const mission = learningTracks
    .find((track) => track.id === "automation")
    .modules.find((item) => item.id === "selenium");
  assert(isAvailable(mission, h.progress.getState()));
  h.progress.selectTrack("automation");
  const first = h.progress.saveMissionResult(
    "selenium",
    seleniumScore(solve([1])),
  );
  assert.equal(first.bestXp, 93);
  assert.equal(first.totalXp, 493);
  assert.equal(first.attempts, 1);
  for (const id of ["automation-fundamentals", "cypress", "playwright"])
    assert.equal(h.progress.getMission(id), null);
  const repeat = h.progress.saveMissionResult("selenium", 50);
  assert.equal(repeat.gainedXp, 0);
  assert.equal(repeat.totalXp, 493);
  assert.equal(repeat.attempts, 2);
  const improved = h.progress.saveMissionResult("selenium", 100);
  assert.equal(improved.gainedXp, 7);
  assert.equal(improved.totalXp, 500);
  assert.equal(improved.attempts, 3);
  assert(h.progress.getMission("selenium").lastCompletedAt);
  const reloaded = harness(
    JSON.parse(h.storage.get(h.progress.storageKey)),
  ).progress;
  assert.equal(reloaded.getMission("selenium").bestXp, 100);
  const future = { ...oldSave(99), unknownField: true };
  future.missions.future = { completed: true, bestXp: 100 };
  const futureHarness = harness(future);
  const before = futureHarness.storage.get("qa-quest-progress");
  assert(futureHarness.progress.isReadOnly());
  assert.throws(
    () => futureHarness.progress.saveMissionResult("selenium", 100),
    /versão mais recente/,
  );
  assert.equal(futureHarness.storage.get("qa-quest-progress"), before);
  assert.equal(futureHarness.writes(), 0);
  const memory = harness(null, true).progress;
  for (let phase = 1; phase <= 4; phase++)
    memory.saveMissionResult(`phase${phase}`, 100);
  memory.saveMissionResult("selenium", 100);
  assert.equal(memory.getState().totalXp, 500);
});

test("catalog, hub, journey, library, route and PDF share the Selenium identifier", () => {
  const track = learningTracks.find((item) => item.id === "automation");
  assert.deepEqual(
    track.modules.map((item) => item.id),
    ["automation-fundamentals", "cypress", "playwright", "selenium"],
  );
  assert.equal(track.modules[3].order, 4);
  assert.equal(track.modules[3].route, "selenium.html");
  assert.equal(
    uniqueMissions.filter((item) => item.progressId === "selenium").length,
    1,
  );
  const material = getSupportMaterials(SELENIUM_MISSION_ID);
  assert.equal(material.length, 1);
  assert.equal(material[0].filename, "qa-quest-selenium.pdf");
  assert.equal(
    getLibraryGroups()
      .find((group) => group.id === "automation")
      .entries.filter((entry) => entry.mission.progressId === "selenium")
      .length,
    1,
  );
  const pdf = readFileSync(new URL(`public/${material[0].path}`, root));
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  const html = read("selenium.html");
  assert(
    html.indexOf('mission-id="selenium"') <
      html.indexOf('<div id="sel-content" hidden>'),
  );
  assert.match(html, /id="coupon-code"/);
  assert.match(html, /data-testid="coupon-result"/);
  assert.match(html, /data-testid="coupon-total"/);
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
  assert(read("pages/tracks.js").includes('id: "selenium"'));
  assert(read("vite.config.js").includes('selenium: "selenium.html"'));
  for (const [, value] of html.matchAll(/(?:href|src)="([^"]+)"/g))
    if (!/^(?:https?:|#|data:)/.test(value))
      assert(existsSync(new URL(value, new URL("selenium.html", root))), value);
});

test("mission avoids arbitrary code execution, network simulation and extension coupling", () => {
  for (const file of ["core/selenium-lab.js", "pages/selenium.js"])
    assert.doesNotMatch(
      read(file),
      /\beval\s*\(|\b(?:new\s+)?Function\s*\(|\bfetch\s*\(|XMLHttpRequest|chrome\.runtime|postMessage\s*\(/,
    );
  assert.match(read("styles/selenium.css"), /prefers-reduced-motion/);
  assert.match(read("selenium.html"), /role="status"/);
  assert.match(read("selenium.html"), /NÃO É UM LOG REAL/);
  assert.doesNotMatch(read("selenium.html"), /qa-stepscript-support/);
});
