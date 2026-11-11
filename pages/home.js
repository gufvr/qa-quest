import { initializeLegacyHomeRedirect } from "../core/legacy-home-redirect.js";
import { mountHome } from "../src/pages/Home/Home.jsx";

if (!initializeLegacyHomeRedirect()) {
  mountHome(document.getElementById("conteudo"));
}
