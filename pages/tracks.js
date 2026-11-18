import "../core/progress.js";
import "../components/support-material.js";
import { mountTracks } from "../src/pages/Tracks/Tracks.jsx";

const root = document.getElementById("tracks-root");
if (!root)
  throw new Error("Elemento de montagem do hub de trilhas não encontrado.");

mountTracks(root);
