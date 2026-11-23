import "../core/progress.js";
import "../components/save-status.js";
import { mountSecurity } from "../src/pages/Security/Security.jsx";

const root = document.getElementById("security-root");
if (!root)
  throw new Error("Elemento de montagem da missão Segurança não encontrado.");

mountSecurity(root);
