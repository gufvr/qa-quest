import "../core/progress.js";
import "../components/save-status.js";
import { mountBugReport } from "../src/pages/BugReport/BugReport.jsx";

const root = document.getElementById("bug-report-root");
if (!root)
  throw new Error(
    "Elemento de montagem da missão Relato de Defeitos não encontrado.",
  );

mountBugReport(root);
