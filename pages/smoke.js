import "../core/progress.js";
import "../components/save-status.js";
import { mountSmoke } from "../src/pages/Smoke/Smoke.jsx";

const root = document.getElementById("smoke-root");
if (!root)
  throw new Error("Elemento de montagem da missão Smoke não encontrado.");

mountSmoke(root);
