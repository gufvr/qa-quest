import "../core/progress.js";
import { mountPhase1 } from "../src/pages/Phase1/Phase1.jsx";

const root = document.getElementById("phase1-root");
if (!root)
  throw new Error("Elemento de montagem da Fase 1 não encontrado.");

mountPhase1(root);
