import "../core/progress.js";
import "../components/save-status.js";
import { mountPerformance } from "../src/pages/Performance/Performance.jsx";

const root = document.getElementById("performance-root");
if (!root)
  throw new Error("Elemento de montagem da missão Performance não encontrado.");

mountPerformance(root);
