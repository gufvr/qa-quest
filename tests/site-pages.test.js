import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import vm from "node:vm";
import {
  baseMissions, catalogItems, getRecommendedMission, getCompletedUniqueMissions,
  isAvailable, learningTracks, supportMaterials, uniqueMissions
} from "../core/content-catalog.js";
import { getLibraryGroups } from "../core/library-catalog.js";
import { getLegacyHomeDestination } from "../core/legacy-home-redirect.js";
import { homeInsights, getHomeInsightContext, localCalendarDay, selectHomeInsight } from "../core/home-insights.js";
import { createHomeInsightController, delayUntilLocalMidnight } from "../core/home-insight-controller.js";
import { renderHomeInsight } from "../components/home-insight.js";

const root = new URL("../", import.meta.url);
const read = (file) => readFileSync(new URL(file, root), "utf8");

// Isolated storage: these checks never open or modify a real browser profile.
function createProgress() {
  const storage = new Map();
  const window = {
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value)
    },
    dispatchEvent() {}
  };
  vm.runInNewContext(read("core/progress.js"), { window });
  return { progress: window.QAQuestProgress, storage };
}

for (const [hash, route] of Object.entries({
  jornada: "jornada.html", biblioteca: "biblioteca.html", "como-funciona": "como-funciona.html"
})) {
  test(`legacy ${hash}: preserve query, subdirectory and root entry`, () => {
    assert.equal(getLegacyHomeDestination(`https://gufvr.github.io/qa-quest/index.html?from=old#${hash}`),
      `https://gufvr.github.io/qa-quest/${route}?from=old`);
    assert.equal(getLegacyHomeDestination(`https://gufvr.github.io/qa-quest/#${hash}`),
      `https://gufvr.github.io/qa-quest/${route}`);
    assert.equal(getLegacyHomeDestination(`http://127.0.0.1:5173/index.html#${hash}`),
      `http://127.0.0.1:5173/${route}`);
  });
}

test("unknown hashes and non-home pages are not redirected", () => {
  for (const href of [
    "https://example.test/index.html#inicio", "https://example.test/index.html#unknown",
    "https://example.test/index.html", "https://example.test/phase3.html#jornada",
    "https://example.test/index.html#toString"
  ]) assert.equal(getLegacyHomeDestination(href), null);
});

test("library is derived from catalog and canonical materials appear once", () => {
  const groups = getLibraryGroups();
  const entries = groups.flatMap((group) => group.entries);
  assert.equal(new Set(entries.map(({ mission }) => mission.progressId)).size, entries.length);
  assert.equal(entries.reduce((sum, entry) => sum + entry.materialCount, 0), supportMaterials.length);
  const functional = entries.filter(({ mission }) => mission.progressId === "phase3");
  assert.equal(functional.length, 1);
  assert.equal(functional[0].mission.id, "phase3");
  assert(groups.every((group) => group.entries.length > 0));
  assert(groups.some((group) => group.id === "base"));
});

test("recommendation follows base, unlocks tracks and respects selected track", () => {
  const { progress } = createProgress();
  for (const mission of baseMissions) {
    const state = progress.getState();
    assert.equal(getRecommendedMission(state).progressId, mission.progressId);
    assert(catalogItems.filter((item) => item.type === "track").every((item) => !isAvailable(item, state)));
    progress.saveMissionResult(mission.progressId, 100);
  }
  assert(catalogItems.every((item) => isAvailable(item, progress.getState())));
  for (const track of learningTracks) {
    progress.selectTrack(track.id);
    const next = getRecommendedMission(progress.getState());
    assert.equal(next.groupId, track.id);
    assert.equal(next.progressId, track.modules.find((item) => item.progressId !== "phase3").progressId);
  }
});

test("completed content has empty recommendation and does not duplicate XP", () => {
  const { progress, storage } = createProgress();
  for (const mission of uniqueMissions) progress.saveMissionResult(mission.progressId, 100);
  const state = progress.getState();
  assert.equal(getRecommendedMission(state), null);
  assert.equal(getCompletedUniqueMissions(state).length, uniqueMissions.length);
  assert.equal(state.totalXp, uniqueMissions.length * 100);
  const before = storage.get(progress.storageKey);
  getRecommendedMission(progress.getState());
  getCompletedUniqueMissions(progress.getState());
  getLibraryGroups();
  assert.equal(storage.get(progress.storageKey), before);
  progress.saveMissionResult("phase3", 50);
  assert.equal(progress.getState().totalXp, state.totalXp);
  assert.equal(progress.getMission("phase3").bestXp, 100);
  assert.equal(progress.getMission("phase3").attempts, 2);
});

test("new pages, local resources, mission routes and PDFs exist", () => {
  for (const route of ["index.html", "jornada.html", "biblioteca.html", "como-funciona.html"]) {
    const html = read(route);
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, route);
    for (const [, value] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(?:https?:|data:|#|mailto:)/.test(value)) continue;
      assert(existsSync(new URL(value, new URL(route, root))), `${route}: ${value}`);
    }
    assert(read("vite.config.js").includes(`"${route}"`), `Vite input: ${route}`);
  }
  for (const mission of catalogItems) assert(existsSync(new URL(mission.route, root)), mission.route);
  for (const material of supportMaterials) {
    const file = new URL(`public/${material.path}`, root);
    assert(existsSync(file), material.path);
    assert.equal(readFileSync(file).subarray(0, 5).toString(), "%PDF-");
  }
});

test("insight catalog has reviewed paraphrases and clearly separate original content", () => {
  assert.equal(new Set(homeInsights.map((entry) => entry.id)).size, homeInsights.length);
  const contexts = ["phase1", "phase2", "phase3", "phase4", ...learningTracks.map((track) => `track:${track.id}`), "general"];
  for (const context of contexts) {
    const pool = homeInsights.filter((entry) => entry.context === context);
    assert.deepEqual(pool.map((entry) => entry.type).sort(), ["fact", "guidance", "humor"]);
  }
  for (const entry of homeInsights) {
    assert(entry.text.length > 0 && entry.text.length < 220);
    assert(Object.isFrozen(entry));
    if (entry.type === "fact") {
      assert.equal(entry.editorialForm, "paraphrase");
      assert(entry.source.title && entry.source.section);
      assert.match(entry.source.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
      const url = new URL(entry.source.url);
      assert.equal(url.protocol, "https:");
      assert(["learn.microsoft.com", "martinfowler.com"].includes(url.hostname));
      assert.equal(entry.author, entry.source.author);
    } else {
      assert.equal(entry.author, "QA Quest");
      assert.equal(entry.editorialForm, "original");
      assert.equal(entry.source, null);
    }
  }
});

test("insights follow recommended phases, then selected track or general context", () => {
  const { progress } = createProgress();
  for (const mission of baseMissions) {
    const state = progress.getState();
    assert.equal(getHomeInsightContext(state), mission.progressId);
    assert.equal(selectHomeInsight(state).context, mission.progressId);
    progress.saveMissionResult(mission.progressId, 100);
  }
  assert.equal(getHomeInsightContext(progress.getState()), "general");
  for (const track of learningTracks) {
    progress.selectTrack(track.id);
    assert.equal(getHomeInsightContext(progress.getState()), `track:${track.id}`);
    assert.equal(selectHomeInsight(progress.getState()).context, `track:${track.id}`);
  }
  for (const mission of uniqueMissions) progress.saveMissionResult(mission.progressId, 100);
  assert.equal(selectHomeInsight(progress.getState()).context, "track:professional");
});

test("daily selection is deterministic, varies with calendar day and uses safe fallbacks", () => {
  const state = createProgress().progress.getState();
  const before = JSON.stringify(state);
  for (let day = 1; day < 8; day++) {
    const date = new Date(2026, 10, day, 8);
    const selected = selectHomeInsight(state, { date });
    assert.strictEqual(selected, selectHomeInsight(state, { date }));
    assert.strictEqual(selected, selectHomeInsight(state, { date: new Date(2026, 10, day, 23, 59) }));
    assert.notEqual(selected.id, selectHomeInsight(state, { date: new Date(2026, 10, day + 1) }).id);
  }
  const generalOnly = homeInsights.filter((entry) => entry.context === "general");
  assert.equal(selectHomeInsight(state, { messages: generalOnly }).context, "general");
  assert.equal(selectHomeInsight(state, { messages: [] }).id, "general-guidance");
  assert.equal(JSON.stringify(state), before);
  assert.throws(() => selectHomeInsight(state, { date: new Date(NaN) }), RangeError);
});

test("day calculation and next wakeup use local midnight, including month/year changes", () => {
  for (const date of [new Date(2026, 10, 1, 23, 59, 59), new Date(2026, 11, 31, 23, 59, 59)]) {
    const next = new Date(date.getTime());
    next.setHours(24, 0, 0, 0);
    assert.equal(localCalendarDay(next) - localCalendarDay(date), 1);
    assert.equal(delayUntilLocalMidnight(date), 1050);
    assert.equal(localCalendarDay(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0)), localCalendarDay(date));
  }
});

function insightHarness() {
  const win = new EventTarget();
  const doc = new EventTarget();
  const timers = new Map();
  const rendered = [];
  let nextTimer = 0;
  let date = new Date(2026, 10, 1, 23, 59, 59);
  let canRender = true;
  doc.hidden = false;
  win.setTimeout = (callback, delay) => { const id = ++nextTimer; timers.set(id, { callback, delay }); return id; };
  win.clearTimeout = (id) => timers.delete(id);
  const { progress, storage } = createProgress();
  const controller = createHomeInsightController({
    win, doc, getState: () => progress.getState(), now: () => date,
    canRender: () => canRender, render: (entry) => rendered.push(entry)
  });
  return {
    win, doc, timers, rendered, controller, progress, storage,
    setDate: (value) => { date = value; },
    setCanRender: (value) => { canRender = value; },
    tick() { const [id, timer] = timers.entries().next().value; timers.delete(id); timer.callback(); }
  };
}

test("midnight, focus and visibility refresh insights without repeated renders or writes", () => {
  const h = insightHarness();
  h.controller.update(h.progress.getState());
  assert.equal(h.rendered.length, 1);
  assert.equal(h.timers.size, 1);
  assert.equal([...h.timers.values()][0].delay, 1050);
  h.win.dispatchEvent(new Event("focus"));
  h.win.dispatchEvent(new Event("pageshow"));
  assert.equal(h.rendered.length, 1);
  h.setDate(new Date(2026, 10, 2, 0, 0, 0, 50));
  h.tick();
  assert.equal(h.rendered.length, 2);
  assert.notEqual(h.rendered[0].id, h.rendered[1].id);
  h.doc.hidden = true;
  h.doc.dispatchEvent(new Event("visibilitychange"));
  assert.equal(h.timers.size, 0);
  h.setDate(new Date(2026, 10, 3, 12));
  h.doc.hidden = false;
  h.doc.dispatchEvent(new Event("visibilitychange"));
  assert.equal(h.rendered.length, 3);
  assert.equal(h.timers.size, 1);
  assert.equal(h.storage.size, 0);
  h.controller.destroy();
  assert.equal(h.timers.size, 0);
});

test("progress context updates preserve existing data and suspended pages resume cleanly", () => {
  const h = insightHarness();
  h.progress.saveMissionResult("phase1", 85);
  const before = h.storage.get(h.progress.storageKey);
  h.controller.update(h.progress.getState());
  assert.equal(h.rendered.at(-1).context, "phase2");
  h.win.dispatchEvent(new Event("pagehide"));
  assert.equal(h.timers.size, 0);
  h.setDate(new Date(2026, 10, 2, 12));
  h.win.dispatchEvent(new Event("focus"));
  assert.equal(h.rendered.length, 1);
  h.win.dispatchEvent(new Event("pageshow"));
  assert.equal(h.rendered.length, 2);
  assert.equal(h.storage.get(h.progress.storageKey), before);
  h.controller.destroy();
  h.win.dispatchEvent(new Event("focus"));
  assert.equal(h.rendered.length, 2);
});

test("updates defer while the reader uses the source link", () => {
  const h = insightHarness();
  h.controller.update(h.progress.getState());
  h.setCanRender(false);
  h.setDate(new Date(2026, 10, 2, 12));
  h.controller.refresh();
  assert.equal(h.rendered.length, 1);
  h.setCanRender(true);
  h.controller.refresh();
  assert.equal(h.rendered.length, 2);
  h.controller.destroy();
});

test("rendered labels, source metadata and authored messages stay unambiguous", () => {
  const attributes = new Map();
  const source = {
    hidden: true,
    setAttribute: (key, value) => attributes.set(key, value),
    removeAttribute: (key) => { attributes.delete(key); delete source[key]; }
  };
  const nodes = Object.fromEntries(["label", "text", "author"].map((key) => [`[data-insight-${key}]`, {}]));
  nodes["[data-insight-source]"] = source;
  const root = {
    dataset: {}, classList: { remove() {}, add() {} },
    querySelector: (selector) => nodes[selector]
  };
  const fact = homeInsights.find((entry) => entry.type === "fact");
  renderHomeInsight(root, fact);
  assert.equal(nodes["[data-insight-text]"].textContent, fact.text);
  assert.equal(source.hidden, false);
  assert.equal(source.href, fact.source.url);
  assert.equal(source.title, fact.source.title);
  assert(attributes.get("aria-label").includes(fact.source.title));
  assert(nodes["[data-insight-author]"].textContent.includes(fact.author));
  const humor = homeInsights.find((entry) => entry.type === "humor");
  renderHomeInsight(root, humor);
  assert.equal(source.hidden, true);
  assert(!source.href);
  assert.equal(root.dataset.insightType, "humor");
  assert(nodes["[data-insight-author]"].textContent.includes("humor autoral"));
  const html = read("index.html");
  assert.match(html, /id="home-insight" aria-live="off"/);
  assert.match(html, /data-insight-source hidden target="_blank" rel="noopener noreferrer"/);
});
