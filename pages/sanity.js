import "../core/progress.js";
import "../components/save-status.js";
import { mountSanity } from "../src/pages/Sanity/Sanity.jsx";

const root = document.getElementById("sanity-root");
if (!root)
  throw new Error("Elemento de montagem da missão Sanidade não encontrado.");

mountSanity(root);
