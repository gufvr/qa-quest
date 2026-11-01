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
