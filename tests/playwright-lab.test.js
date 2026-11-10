import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync, existsSync } from "node:fs";
import {
  PLAYWRIGHT_MISSION_ID,
  PLAYWRIGHT_STEPS,
  PLAYWRIGHT_PRODUCTS,
  PLAYWRIGHT_PROFILES,
  createPlaywrightSession,
  filterPlaywrightCatalog,
  inspectPlaywrightResults,
  runPlaywrightCounterexample,
  simulatePlaywright,
  recordPlaywrightRun,
  answerPlaywrightStep,
  advancePlaywrightStep,
  playwrightScore,
  isPlaywrightComplete,
  buildPlaywrightCode,
  buildFragilePlaywrightCode,
} from "../core/playwright-lab.js";
import { CATALOG_PRODUCTS } from "../core/cypress-lab.js";
import {
  learningTracks,
  uniqueMissions,
  getRecommendedMission,
  getSupportMaterials,
} from "../core/content-catalog.js";
import { getLibraryGroups } from "../core/library-catalog.js";

const root = new URL("../", import.meta.url);
const read = (file) => readFileSync(new URL(file, root), "utf8");
const plain = (value) => JSON.parse(JSON.stringify(value));
const answers = [
  { imports: "native", setup: "beforeEach", async: "await" },
  { category: "label", search: "role", apply: "button" },
  ["filter", "search", "apply"],
  { count: "two", text: "names", category: "every" },
  "ready",
  { reference: "pass", candidate: "product", fragile: "test" },
  { isolation: "context", trace: "retry", verdict: "return" },
];

function solve(wrong = []) {
  let session = createPlaywrightSession();
  for (let index = 0; index < PLAYWRIGHT_STEPS.length; index++) {
    if (index === 3) session = runPlaywrightCounterexample(session);
    if (index === 5)
      for (const profile of PLAYWRIGHT_PROFILES)
        session = recordPlaywrightRun(session, profile.id);
    if (wrong.includes(index))
      session = answerPlaywrightStep(session, "incorrect").session;
    const result = answerPlaywrightStep(session, answers[index]);
    assert.equal(result.correct, true);
    session = result.session;
    assert.equal(
      playwrightScore(answerPlaywrightStep(session, answers[index]).session),
      playwrightScore(session),
    );
    session = advancePlaywrightStep(session);
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
        id !== "playwright" &&
        id !== "selenium" &&
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
    totalXp: Object.values(missions).reduce(
      (sum, item) => sum + item.bestXp,
      0,
    ),
    unlockedPhase: 5,
    missions,
    activityDays: ["2026-10-20", "2026-10-25"],
    selectedTrack: "automation",
    tracks: {
      automation: {
        completedModules: ["automation-fundamentals", "cypress"].filter(
          (id) => missions[id],
        ),
      },
    },
  };
}

test("Playwright builds seven checkpoints, native syntax and exactly 100 XP without executing the spec", () => {
  const initial = createPlaywrightSession();
  assert.equal(advancePlaywrightStep(initial), initial);
  assert.equal(isPlaywrightComplete(initial), false);
  assert.equal(recordPlaywrightRun(initial, "reference"), initial);
  assert.equal(runPlaywrightCounterexample(initial), initial);
  const session = solve();
  assert.equal(isPlaywrightComplete(session), true);
  assert.equal(playwrightScore(session), 100);
  assert.equal(
    PLAYWRIGHT_STEPS.reduce((sum, step) => sum + step.points, 0),
    100,
  );
  const code = buildPlaywrightCode(session);
  assert.match(code, /import \{ test, expect \} from "@playwright\/test"/);
  assert.match(code, /test.beforeEach\(async/);
  assert.match(code, /await page.goto/);
  for (const method of [
    "getByRole",
    "getByLabel",
    "getByTestId",
    "selectOption",
    "fill",
    "click",
    "toHaveCount",
    "toContainText",
    "toHaveAttribute",
  ])
    assert(code.includes(method), method);
  assert(
    code.indexOf('"data-state", "ready"') < code.indexOf("toHaveCount(2)"),
  );
  assert.doesNotMatch(code, /\bcy\.|waitForTimeout|networkidle|vitest|jest/);
  assert.doesNotThrow(() => new vm.Script(code.replace(/^import[^\n]*\n/, "")));
});

test("partial awards remain fractional during a round and round only at the persistence boundary", () => {
  for (let index = 0; index < PLAYWRIGHT_STEPS.length; index++) {
    const session = solve([index]);
    assert.equal(
      playwrightScore(session),
      100 - PLAYWRIGHT_STEPS[index].points / 2,
    );
  }
  assert.equal(playwrightScore(solve([1])), 92.5);
  assert.equal(Math.round(playwrightScore(solve([1]))), 93);
  assert.equal(playwrightScore(solve([0, 1, 2, 3, 4, 5, 6])), 50);
  assert.equal(playwrightScore(createPlaywrightSession()), 0);
});

test("counterexample proves that two items alone do not validate category or content", () => {
  const initial = { ...createPlaywrightSession(), step: 3 };
  const missing = answerPlaywrightStep(initial, answers[3]);
  assert.equal(missing.correct, false);
  assert.equal(missing.session, initial);
  assert.deepEqual(initial.mistakes, []);
  const session = runPlaywrightCounterexample(initial);
  assert.equal(session.counterexample.countPass, true);
  assert.equal(session.counterexample.categoryPass, false);
  assert.equal(session.counterexample.namesPass, false);
  assert.equal(answerPlaywrightStep(session, answers[3]).points, 20);
  assert.equal(inspectPlaywrightResults([]).categoryPass, false);
});

test("three deterministic profiles distinguish ready product failure and premature value assertion", () => {
  for (const profile of PLAYWRIGHT_PROFILES) {
    const run = simulatePlaywright(profile.id);
    assert.deepEqual(run, simulatePlaywright(profile.id));
    for (const field of ["expected", "observed", "impact", "classification"])
      assert(run[field]);
    assert.equal(run.trace.length, 3);
    assert(
      run.trace.every(
        (event, index, events) =>
          index === 0 || event.at >= events[index - 1].at,
      ),
    );
  }
  const candidate = simulatePlaywright("candidate"),
    fragile = simulatePlaywright("fragile");
  assert.equal(candidate.ready, true);
  assert.equal(candidate.passed, false);
  assert.equal(candidate.eventualProducts.length, 3);
  assert.equal(candidate.classification, "product");
  assert.equal(fragile.ready, false);
  assert.equal(fragile.classification, "test");
  assert.equal(fragile.observedAt, 300);
  assert.equal(fragile.readyAt, 800);
  assert.equal(fragile.eventualProducts.length, 2);
  assert.match(buildFragilePlaywrightCode(), /waitForTimeout\(300\)/);
  assert.match(buildFragilePlaywrightCode(), /expect\(snapshot\).toBe\(2\)/);
  assert.doesNotMatch(buildFragilePlaywrightCode(), /expect.poll/);
  const session = { ...createPlaywrightSession(), step: 5 },
    result = answerPlaywrightStep(session, answers[5]);
  assert.equal(result.session, session);
  assert.deepEqual(session.mistakes, []);
  assert.throws(() => simulatePlaywright("remote"), /desconhecido/);
});

test("reference data agrees with Cypress but remains local and unchanged by learner filtering", () => {
  assert.deepEqual(PLAYWRIGHT_PRODUCTS, CATALOG_PRODUCTS);
  assert.equal(filterPlaywrightCatalog().length, 3);
  assert.equal(filterPlaywrightCatalog("accessories", "Aurora").length, 2);
  assert.equal(filterPlaywrightCatalog("electronics", "TECLADO").length, 1);
  assert.equal(filterPlaywrightCatalog("all", "<script>").length, 0);
  const copy = filterPlaywrightCatalog();
  copy.pop();
  assert.equal(filterPlaywrightCatalog().length, 3);
});

test("versions 5, 6 and 7 migrate once to 9 without losing previous missions, XP, dates or preferences", () => {
  for (const version of [5, 6, 7]) {
    const saved = oldSave(version),
      h = harness(saved),
      state = plain(h.progress.getState());
    assert.equal(state.version, 9);
    for (const field of [
      "missions",
      "totalXp",
      "activityDays",
      "selectedTrack",
      "unlockedPhase",
    ])
      assert.deepEqual(state[field], saved[field], field);
    assert.equal(h.progress.getMission("playwright"), null);
    assert.equal(h.progress.getTrackProgress("automation").total, 4);
    assert.deepEqual(
      plain(h.progress.getTrackProgress("automation").completedModules),
      saved.tracks.automation.completedModules,
    );
    assert.equal(h.storage.get("qa-quest-theme"), "light");
    assert.equal(h.storage.get("unrelated"), "keep");
    assert.equal(h.writes(), 1);
    h.progress.getState();
    assert.equal(h.writes(), 1);
    if (version === 7)
      assert.equal(getRecommendedMission(state).progressId, "playwright");
  }
});

test("phase4 is the only mission gate, repeats add only improvements and snapshots reload correctly", () => {
  const h = harness();
  assert.throws(
    () => h.progress.saveMissionResult("playwright", 100),
    /Fase 4/,
  );
  for (let phase = 1; phase <= 4; phase++)
    h.progress.saveMissionResult(`phase${phase}`, 100);
  h.progress.selectTrack("automation");
  const first = h.progress.saveMissionResult(
    "playwright",
    playwrightScore(solve([1])),
  );
  assert.equal(first.bestXp, 93);
  assert.equal(first.totalXp, 493);
  assert.equal(first.attempts, 1);
  assert.equal(h.progress.getMission("cypress"), null);
  assert.equal(h.progress.getMission("automation-fundamentals"), null);
  const repeat = h.progress.saveMissionResult("playwright", 50);
  assert.equal(repeat.gainedXp, 0);
  assert.equal(repeat.bestXp, 93);
  assert.equal(repeat.totalXp, 493);
  assert.equal(repeat.attempts, 2);
  const improved = h.progress.saveMissionResult("playwright", 100);
  assert.equal(improved.gainedXp, 7);
  assert.equal(improved.totalXp, 500);
  assert.equal(improved.attempts, 3);
  const loaded = harness(
    JSON.parse(h.storage.get("qa-quest-progress")),
  ).progress;
  assert.equal(loaded.getMission("playwright").attempts, 3);
  assert.equal(loaded.getState().selectedTrack, "automation");
  assert(loaded.getMission("playwright").lastCompletedAt);
});

test("future saves stay byte-identical and unavailable storage retains the memory fallback", () => {
  const future = { ...oldSave(99), unknownField: true };
  future.missions.future = { completed: true, bestXp: 100 };
  const h = harness(future),
    before = h.storage.get("qa-quest-progress");
  assert.equal(h.progress.isReadOnly(), true);
  assert.throws(
    () => h.progress.saveMissionResult("playwright", 100),
    /versão mais recente/,
  );
  assert.equal(h.storage.get("qa-quest-progress"), before);
  assert.equal(h.writes(), 0);
  const memory = harness(null, true).progress;
  for (let phase = 1; phase <= 4; phase++)
    memory.saveMissionResult(`phase${phase}`, 100);
  memory.saveMissionResult("playwright", 100);
  assert.equal(memory.getState().totalXp, 500);
});

test("canonical catalog, hub, library, PDF and multipage Vite agree with Selenium", () => {
  const track = learningTracks.find((track) => track.id === "automation");
  assert.deepEqual(
    track.modules.map((item) => item.id),
    ["automation-fundamentals", "cypress", "playwright", "selenium"],
  );
  const materials = getSupportMaterials(PLAYWRIGHT_MISSION_ID);
  assert.equal(materials.length, 1);
  assert.equal(materials[0].filename, "qa-quest-playwright.pdf");
  const group = getLibraryGroups().find((group) => group.id === "automation");
  assert.equal(
    group.entries.filter((entry) => entry.mission.progressId === "playwright")
      .length,
    1,
  );
  assert.equal(
    readFileSync(new URL(`public/${materials[0].path}`, root))
      .subarray(0, 5)
      .toString(),
    "%PDF-",
  );
  const html = read("playwright.html");
  assert.match(html, /<label for="pw-category">Categoria<\/label>/);
  assert.match(html, /<label for="pw-search">Buscar produto<\/label>/);
  assert(
    html.indexOf('mission-id="playwright"') <
      html.indexOf('<div id="pw-content" hidden>'),
  );
  assert(read("pages/tracks.js").includes('id: "playwright"'));
  assert(read("vite.config.js").includes('playwright: "playwright.html"'));
  for (const [, value] of html.matchAll(/(?:href|src)="([^"]+)"/g))
    if (!/^(?:https?:|#|data:)/.test(value))
      assert(
        existsSync(new URL(value, new URL("playwright.html", root))),
        value,
      );
  assert.equal(getSupportMaterials("selenium").length, 1);
  assert(track.modules.some((item) => item.id === "selenium"));
});

test("StepScript supports Playwright and keeps Cypress as the safe default", () => {
  const registry = new Map();
  class Element {
    dataset = {};
    innerHTML = "";
    constructor(framework) {
      this.framework = framework;
    }
    getAttribute() {
      return this.framework;
    }
  }
  vm.runInNewContext(
    read("components/stepscript-support.js").replace(/^import[^\n]*\n/, ""),
    {
      HTMLElement: Element,
      customElements: {
        get: (id) => registry.get(id),
        define: (id, value) => registry.set(id, value),
      },
    },
  );
  const Component = registry.get("qa-stepscript-support");
  for (const [attribute, framework] of [
    [undefined, "Cypress"],
    ["playwright", "Playwright"],
    ["<script>alert(1)</script>", "Cypress"],
  ]) {
    const element = new Component(attribute);
    element.connectedCallback();
    assert(element.innerHTML.includes(`Exporte para ${framework}`));
    assert(element.innerHTML.includes(`um projeto ${framework}`));
    assert(!element.innerHTML.includes("alert(1)"));
    assert.match(element.innerHTML, /SEM XP EXTRA/);
    const before = element.innerHTML;
    element.connectedCallback();
    assert.equal(element.innerHTML, before);
  }
});

test("new lab has no code execution, network simulation calls or extension messaging", () => {
  for (const file of ["core/playwright-lab.js", "pages/playwright.js"])
    assert.doesNotMatch(
      read(file),
      /\beval\s*\(|\b(?:new\s+)?Function\s*\(|\bfetch\s*\(|XMLHttpRequest|chrome\.runtime|postMessage\s*\(/,
    );
  assert.match(read("styles/playwright.css"), /prefers-reduced-motion/);
  assert.match(read("playwright.html"), /role="status"/);
  assert.match(read("playwright.html"), /framework="playwright"/);
  assert.match(
    read("playwright.html"),
    /não é um trace real|NÃO É UM TRACE REAL/,
  );
});
