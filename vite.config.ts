/// <reference types="vitest" />

import { defineConfig } from "vite";

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    target: "ES2022",
    outDir: "./dist/",
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "src/fetch.ts"),
      name: "@nazo-site/kuromoji.ts",
      fileName: "index.browser",
    },
  },

  test: {
    include: ["test/**/*.test.ts"],
    coverage: {
      include: ["src/**"],
    },
  },
});
