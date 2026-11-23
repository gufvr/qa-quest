import "../core/progress.js";
import "../components/save-status.js";
import { mountSelenium } from "../src/pages/Selenium/Selenium.jsx";

const root = document.getElementById("selenium-root");
if (!root) throw new Error("Elemento de montagem do Selenium não encontrado.");

mountSelenium(root);
