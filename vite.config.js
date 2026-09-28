import { defineConfig } from "vite";

// Relative base so the site works at https://<user>.github.io/bubble-sort/ and on any custom domain.
export default defineConfig({
  base: "./",
  build: { target: "es2019", chunkSizeWarningLimit: 1500 }
});
