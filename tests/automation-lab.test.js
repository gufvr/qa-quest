import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { AUTOMATION_MISSION_ID, AUTOMATION_STEPS, createLabSession, answerCheckpoint,
  advanceCheckpoint, runLabFixture, simulateCatalog, isLabComplete, labScore, buildLabCode } from "../core/automation-lab.js";
import { learningTracks, uniqueMissions, getRecommendedMission, getSupportMaterials, supportMaterials } from "../core/content-catalog.js";
import { getLibraryGroups } from "../core/library-catalog.js";
import { selectHomeInsight } from "../core/home-insights.js";

const root = new URL("../", import.meta.url);
const read = file => readFileSync(new URL(file, root), "utf8");
const previousIds = uniqueMissions.filter(mission => ![AUTOMATION_MISSION_ID, "cypress"].includes(mission.progressId)).map(mission => mission.progressId);
const plain = value => JSON.parse(JSON.stringify(value));

function createProgress(saved, { unavailable = false } = {}) {
  const storage = new Map(saved ? [["qa-quest-progress", JSON.stringify(saved)]] : []);
  storage.set("qa-quest-theme", "light");
  let writes = 0, events = 0;
  const window = { localStorage: {
    getItem(key) { if (unavailable) throw Error("Storage unavailable"); return storage.get(key) ?? null; },
    setItem(key, value) { if (unavailable) throw Error("Storage unavailable"); writes++; storage.set(key, value); }
  }, dispatchEvent() { events++; } };
  vm.runInNewContext(read("core/progress.js"), { window, CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } } });
  return { progress: window.QAQuestProgress, storage, writes: () => writes, events: () => events };
}

function legacySave(version = 5) {
  const missions = Object.fromEntries(previousIds.map((id, index) => [id, {
    completed: true, bestXp: 70 + index, attempts: index + 2, lastCompletedAt: "2026-10-25T15:00:00.000Z"
  }]));
  return { version, missions, totalXp: Object.values(missions).reduce((sum, item) => sum + item.bestXp, 0),
    unlockedPhase: 5, activityDays: ["2026-10-20", "2026-10-25"], selectedTrack: "professional",
    tracks: { release: { completedModules: ["smoke", "sanity", "regression"] }, flows: { completedModules: ["functional", "exploratory", "e2e"] }, specialized: { completedModules: ["performance", "security"] }, professional: { completedModules: ["bug-report", "api"] } } };
}

test("version 5 migration preserves all old missions, XP, attempts, dates and preferences", () => {
  const saved = legacySave();
  const h = createProgress(saved);
  const state = plain(h.progress.getState());
  assert.equal(state.version, 7);
  for (const key of ["missions", "totalXp", "unlockedPhase", "activityDays", "selectedTrack"]) assert.deepEqual(state[key], saved[key], key);
  for (const id of ["flows", "release", "specialized", "professional"]) assert.deepEqual(state.tracks[id], saved.tracks[id]);
  assert.deepEqual(state.tracks.automation, { completedModules: [] });
  assert.equal(h.storage.get("qa-quest-theme"), "light");
  assert.equal(h.writes(), 1);
  h.progress.getState(); h.progress.getTrackProgress("automation");
  assert.equal(h.writes(), 1, "migration is idempotent");
  assert.equal(getRecommendedMission(state).progressId, AUTOMATION_MISSION_ID);
});

test("empty, partial and older saves migrate without invented completions or activity", () => {
  for (const version of [1, 3, 4, 5]) {
    const saved = { version, unlockedPhase: 2, missions: { phase1: { completed: true, bestXp: 85, attempts: 3, lastCompletedAt: "2026-10-25T15:00:00.000Z" } } };
    const { progress } = createProgress(saved);
    const state = plain(progress.getState());
    assert.equal(state.totalXp, 85); assert.equal(state.unlockedPhase, 2);
    assert.deepEqual(state.missions, saved.missions);
    assert.deepEqual(state.activityDays, ["2026-10-25"]);
    assert.equal(progress.isTracksUnlocked(), false);
    assert.throws(() => progress.saveMissionResult(AUTOMATION_MISSION_ID, 100), /Fase 4/);
  }
  const empty = createProgress({ version: 5, missions: {}, activityDays: [], tracks: {} }).progress.getState();
  assert.equal(empty.totalXp, 0); assert.equal(empty.unlockedPhase, 1);
  assert.deepEqual(plain(empty.activityDays), []);
});

test("new module is independent after phase 4; repeats add only best-result improvement", () => {
  const { progress, storage, events } = createProgress();
  for (let phase = 1; phase <= 4; phase++) progress.saveMissionResult(`phase${phase}`, 100);
  progress.selectTrack("automation");
  assert.equal(getRecommendedMission(progress.getState()).progressId, AUTOMATION_MISSION_ID);
  assert.equal(selectHomeInsight(progress.getState()).context, "general");
  const first = progress.saveMissionResult(AUTOMATION_MISSION_ID, 80);
  assert.equal(first.totalXp, 480); assert.equal(first.attempts, 1); assert.equal(first.gainedXp, 80);
  const repeat = progress.saveMissionResult(AUTOMATION_MISSION_ID, 60);
  assert.equal(repeat.totalXp, 480); assert.equal(repeat.bestXp, 80); assert.equal(repeat.attempts, 2); assert.equal(repeat.gainedXp, 0);
  const improved = progress.saveMissionResult(AUTOMATION_MISSION_ID, 100);
  assert.equal(improved.totalXp, 500); assert.equal(improved.gainedXp, 20); assert.equal(improved.attempts, 3);
  assert(progress.getMission(AUTOMATION_MISSION_ID).lastCompletedAt);
  assert.equal(progress.getTrackProgress("automation").percentage, 50);
  for (const id of previousIds.filter(id => !id.startsWith("phase"))) assert.equal(progress.getMission(id), null);
  assert.equal(events(), 7);
  const reloaded = createProgress(JSON.parse(storage.get(progress.storageKey))).progress;
  assert.equal(reloaded.getMission(AUTOMATION_MISSION_ID).attempts, 3);
  assert.equal(reloaded.getState().selectedTrack, "automation");
});

test("future saves remain byte-identical and write-protected", () => {
  const future = { ...legacySave(99), futureField: { preserve: true } };
  future.missions["future-module"] = { completed: true, bestXp: 100, attempts: 8, lastCompletedAt: "2026-10-25T15:00:00Z" };
  const h = createProgress(future);
  const before = h.storage.get(h.progress.storageKey);
  assert.equal(h.progress.getState().version, 99); assert.equal(h.progress.isReadOnly(), true);
  assert.throws(() => h.progress.saveMissionResult(AUTOMATION_MISSION_ID, 100), /versão mais recente/);
  assert.throws(() => h.progress.selectTrack("automation"), /versão mais recente/);
  assert.equal(h.storage.get(h.progress.storageKey), before); assert.equal(h.writes(), 0);
});

test("unavailable storage retains existing in-memory fallback and validates module IDs", () => {
  const { progress } = createProgress(null, { unavailable: true });
  for (let phase = 1; phase <= 4; phase++) progress.saveMissionResult(`phase${phase}`, 100);
  progress.saveMissionResult(AUTOMATION_MISSION_ID, 100);
  assert.equal(progress.getState().totalXp, 500);
  assert.equal(progress.getMission(AUTOMATION_MISSION_ID).attempts, 1);
  assert.throws(() => progress.saveMissionResult("unreleased-module", 100), /desconhecida/);
});

test("catalog, progress, hub and Vite agree; future modules and unregistered PDFs are not published", () => {
  const { progress } = createProgress(legacySave());
  for (const track of learningTracks) {
    assert.equal(progress.getTrackProgress(track.id).total, track.modules.length);
    for (const mission of track.modules) assert.doesNotThrow(() => progress.saveMissionResult(mission.progressId, 100));
    assert(read("tracks.html").includes(`data-track="${track.id}"`));
    for (const mission of track.modules) assert(read("pages/tracks.js").includes(`id: "${mission.id}"`));
  }
  const automation = learningTracks.find(track => track.id === "automation");
  assert.equal(automation.modules.length, 2); assert.equal(automation.modules[0].progressId, AUTOMATION_MISSION_ID);
  assert(read("vite.config.js").includes('"automation-fundamentals.html"'));
  assert.deepEqual(getSupportMaterials("playwright"), []);
  assert.equal(getLibraryGroups().flatMap(group => group.entries).reduce((sum, item) => sum + item.materialCount, 0), supportMaterials.length);
});

test("automation guide is canonical, appears once in its library group and stays outside the mission gate", () => {
  assert.deepEqual(getSupportMaterials(AUTOMATION_MISSION_ID), [{
    id: "automation-fundamentals-guide",
    missionId: AUTOMATION_MISSION_ID,
    title: "Fundamentos da Automação",
    description: "Aula introdutória sobre automação de testes, seletores, assertions e boas práticas.",
    path: "materiais/qa-quest-fundamentos-automacao.pdf",
    filename: "qa-quest-fundamentos-automacao.pdf",
    format: "PDF",
    version: "1.0"
  }]);
  assert.equal(supportMaterials.filter(material => material.id === "automation-fundamentals-guide").length, 1);
  const group = getLibraryGroups().find(item => item.id === "automation");
  assert.equal(group.index, 5);
  assert.equal(group.entries.filter(entry => entry.mission.progressId === AUTOMATION_MISSION_ID).length, 1);
  assert.equal(group.entries[0].materialCount, 1);
  const html = read("automation-fundamentals.html");
  const widget = '<qa-support-material mission-id="automation-fundamentals"></qa-support-material>';
  assert.equal(html.split(widget).length - 1, 1);
  assert(html.indexOf(widget) < html.indexOf('<div id="lab-content" hidden>'));
  assert(read("pages/automation-fundamentals.js").includes('import "../components/support-material.js"'));
  const pdf = readFileSync(new URL("public/materiais/qa-quest-fundamentos-automacao.pdf", root));
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
});

const answers = ["filter", "stable", ["open", "filter", "wait"], { subject: "categories", operator: "every", value: "accessories" }, "ready", "behavior", { selector: "stable", assertion: "keep" }];

function solve({ incorrectSteps = [] } = {}) {
  let session = createLabSession();
  for (let index = 0; index < AUTOMATION_STEPS.length; index++) {
    if (index === 5) { session = runLabFixture(session, "reference"); session = runLabFixture(session, "candidate"); }
    if (incorrectSteps.includes(index)) {
      const wrong = answerCheckpoint(session, "incorrect");
      assert.equal(wrong.correct, false); session = wrong.session;
    }
    const result = answerCheckpoint(session, answers[index]);
    assert.equal(result.correct, true); session = result.session;
    const before = labScore(session);
    assert.equal(labScore(answerCheckpoint(session, answers[index]).session), before, "no duplicate points");
    session = advanceCheckpoint(session);
  }
  return session;
}

test("seven practical checkpoints build a controlled test and total 100 XP", () => {
  const initial = createLabSession();
  assert.equal(advanceCheckpoint(initial), initial); assert.equal(isLabComplete(initial), false);
  assert.equal(runLabFixture(initial, "candidate"), initial);
  const session = solve();
  assert.equal(isLabComplete(session), true); assert.equal(labScore(session), 100);
  assert.equal(AUTOMATION_STEPS.reduce((sum, step) => sum + step.points, 0), 100);
  assert.match(buildLabCode(session), /ASSERT EVERY/); assert.doesNotMatch(buildLabCode(session), /TODO/);
  assert.match(buildLabCode(session), /não executável/);
});

test("corrections award exactly half per item and round only the final XP total", () => {
  assert.equal(labScore(solve({ incorrectSteps: [1] })), 93);
  const half = solve({ incorrectSteps: [0, 1, 2, 3, 4, 5, 6] });
  assert.equal(labScore(half), 50); assert.equal(half.awards.selector, 7.5);
  const restarted = createLabSession(); assert.equal(labScore(restarted), 0); assert.deepEqual(restarted.runs, {});
});

test("reference and defective fixtures are deterministic and evidence is required before diagnosis", () => {
  assert.deepEqual(simulateCatalog("reference"), simulateCatalog("reference"));
  assert.deepEqual(simulateCatalog("candidate"), simulateCatalog("candidate"));
  assert.equal(simulateCatalog("reference").passed, true);
  assert.equal(simulateCatalog("candidate").passed, false);
  assert.equal(simulateCatalog("candidate").ready, true);
  assert.equal(simulateCatalog("candidate").products.filter(item => item.category !== "accessories").length, 1);
  assert.throws(() => simulateCatalog("remote"), /desconhecida/);
  const session = { ...createLabSession(), step: 5 };
  const result = answerCheckpoint(session, "behavior");
  assert.equal(result.correct, false); assert.equal(result.session, session); assert.deepEqual(result.session.mistakes, []);
  for (const profile of ["reference", "candidate"]) {
    const evidence = simulateCatalog(profile);
    for (const field of ["expected", "observed", "impact"]) assert(evidence[field]);
  }
});

test("lab implementation has no arbitrary-code execution, network API or extension requirement", () => {
  for (const file of ["core/automation-lab.js", "pages/automation-fundamentals.js"]) {
    assert.doesNotMatch(read(file), /\beval\s*\(|\b(?:new\s+)?Function\s*\(|\bfetch\s*\(|XMLHttpRequest|chrome\.runtime/);
  }
  const html = read("automation-fundamentals.html");
  assert.match(html, /qa-support-material mission-id="automation-fundamentals"/);
  assert.match(html, /role="status"/); assert.match(html, /não executável/);
  assert.match(read("styles/automation-fundamentals.css"), /prefers-reduced-motion/);
});
