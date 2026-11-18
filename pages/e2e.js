import "../core/progress.js";
import "../components/save-status.js";
import { mountE2E } from "../src/pages/E2E/E2E.jsx";

const root = document.getElementById("e2e-root");
if (!root)
  throw new Error("Elemento de montagem da missão E2E não encontrado.");

mountE2E(root);
