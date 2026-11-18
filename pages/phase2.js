import "../core/progress.js";
import { mountPhase2 } from "../src/pages/Phase2/Phase2.jsx";

const root = document.getElementById("phase2-root");
if (!root)
  throw new Error("Elemento de montagem da Fase 2 não encontrado.");

mountPhase2(root);
