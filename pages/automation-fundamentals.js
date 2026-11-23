import "../core/progress.js";
import "../components/save-status.js";
import "../components/support-material.js";
import { mountAutomationFundamentals } from "../src/pages/AutomationFundamentals/AutomationFundamentals.jsx";

const root = document.getElementById("automation-fundamentals-root");
if (!root)
  throw new Error("Elemento de montagem dos Fundamentos não encontrado.");

mountAutomationFundamentals(root);
