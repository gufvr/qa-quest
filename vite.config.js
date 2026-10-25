import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        home: "index.html",
        phase1: "phase1.html",
        phase2: "phase2.html",
        phase3: "phase3.html",
        phase4: "phase4.html",
        tracks: "tracks.html",
        exploratory: "exploratory.html",
        e2e: "e2e.html",
        smoke: "smoke.html",
        sanity: "sanity.html",
        regression: "regression.html",
        performance: "performance.html",
        security: "security.html",
        bugReport: "bug-report.html"
      }
    }
  }
});
