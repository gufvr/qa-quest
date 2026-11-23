import "../core/progress.js";
import "../components/save-status.js";
import { mountCypress } from "../src/pages/Cypress/Cypress.jsx";

const root = document.getElementById("cypress-root");
if (!root) throw new Error("Elemento de montagem do Cypress não encontrado.");

mountCypress(root);
