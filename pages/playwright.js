import "../core/progress.js";
import "../components/save-status.js";
import { mountPlaywright } from "../src/pages/Playwright/Playwright.jsx";

const root = document.getElementById("playwright-root");
if (!root)
  throw new Error("Elemento de montagem do Playwright não encontrado.");

mountPlaywright(root);
