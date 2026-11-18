import "../core/progress.js";
import "../components/save-status.js";
import { mountExploratory } from "../src/pages/Exploratory/Exploratory.jsx";

const root = document.getElementById("exploratory-root");
if (!root)
  throw new Error("Elemento de montagem do Teste Exploratório não encontrado.");

mountExploratory(root);
