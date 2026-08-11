import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const page = process.env.PAGE;

if (!page) throw new Error("PAGE env var is required (novaai | nexum | prmpt)");

/**
 * One page at a time, emitted as a single JS chunk and a single CSS file, so the
 * artifact builder can inline them without leaving any cross-chunk imports.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: `dist-artifact/${page}`,
    emptyOutDir: true,
    cssCodeSplit: false,
    copyPublicDir: false,
    rollupOptions: {
      input: resolve(root, `${page}/index.html`),
      output: { inlineDynamicImports: true, entryFileNames: "app.js", assetFileNames: "app.[ext]" },
    },
  },
});
