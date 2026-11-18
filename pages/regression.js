import "../core/progress.js";
import "../components/save-status.js";
import { mountRegression } from "../src/pages/Regression/Regression.jsx";

const root = document.getElementById("regression-root");
if (!root)
  throw new Error("Elemento de montagem da missão Regressão não encontrado.");

mountRegression(root);
