import "../core/progress.js";
import "../components/save-status.js";
import { mountAPI } from "../src/pages/API/API.jsx";

const root = document.getElementById("api-root");
if (!root)
  throw new Error("Elemento de montagem da missão API não encontrado.");

mountAPI(root);
