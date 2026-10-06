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
        phase4: "phase4.html"
      }
    }
  }
});
