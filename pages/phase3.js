import "../core/progress.js";
import { mountPhase3 } from "../src/pages/Phase3/Phase3.jsx";

const root = document.getElementById("phase3-root");
if (!root)
  throw new Error("Elemento de montagem da Fase 3 não encontrado.");

mountPhase3(root);
