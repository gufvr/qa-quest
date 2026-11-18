import "../core/progress.js";
import { mountPhase4 } from "../src/pages/Phase4/Phase4.jsx";

const root = document.getElementById("phase4-root");
if (!root)
  throw new Error("Elemento de montagem da Fase 4 não encontrado.");

mountPhase4(root);
