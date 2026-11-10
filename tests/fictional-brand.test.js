import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildCypressCode, CYPRESS_STEPS } from "../core/cypress-lab.js";
import {
  buildPlaywrightCode,
  PLAYWRIGHT_STEPS,
} from "../core/playwright-lab.js";
import { buildSeleniumCode, SELENIUM_STEPS } from "../core/selenium-lab.js";

const read = (file) =>
  readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const completed = (steps) => ({
  awards: Object.fromEntries(steps.map((step) => [step.id, step.points])),
});

test("simulators consistently identify the Fikily fictional brand", () => {
  for (const route of [
    "phase3.html",
    "phase4.html",
    "exploratory.html",
    "e2e.html",
    "smoke.html",
    "sanity.html",
    "regression.html",
    "performance.html",
    "security.html",
    "bug-report.html",
    "api.html",
    "automation-fundamentals.html",
    "cypress.html",
    "playwright.html",
    "selenium.html",
  ])
    assert.match(read(route), /Fikily|FIKILY/, route);
  assert.match(
    read("components/test-design-practice.js"),
    /Cenários fictícios da Fikily/,
  );
  assert.match(read("como-funciona.html"), /cenários da Fikily/);
});

test("fictional accounts and login controls remain aligned after the rename", () => {
  for (const file of [
    "phase3.html",
    "pages/phase3.js",
    "regression.html",
    "pages/regression.js",
  ])
    assert(read(file).includes("qa@fikily.test"), file);
  for (const account of [
    "cliente.ana@fikily.test",
    "cliente.bruno@fikily.test",
  ])
    for (const file of ["security.html", "pages/security.js"])
      assert(read(file).includes(account), `${file}: ${account}`);
  for (const selector of ["fikily-mark", "fikily-button"])
    for (const file of ["phase3.html", "styles/phase3.css"])
      assert(read(file).includes(selector), `${file}: ${selector}`);
  assert(read("pages/phase3.js").includes('const validPassword = "QA@2026"'));
  assert(read("pages/regression.js").includes('"Fvr123!"'));
});

test("generated framework examples and exported report names use the new brand", () => {
  assert.match(buildCypressCode(completed(CYPRESS_STEPS)), /Catálogo Fikily/);
  assert.match(
    buildPlaywrightCode(completed(PLAYWRIGHT_STEPS)),
    /Catálogo Fikily/,
  );
  assert.match(
    buildSeleniumCode(completed(SELENIUM_STEPS)),
    /process\.env\.FIKILY_LAB_URL/,
  );
  assert(read("selenium.html").includes("FIKILY_LAB_URL"));
  assert(read("pages/bug-report.js").includes('"fikily-FF-QA-014.txt"'));
  assert(
    read("pages/bug-report.js").includes("Relato didático local da Fikily"),
  );
});
