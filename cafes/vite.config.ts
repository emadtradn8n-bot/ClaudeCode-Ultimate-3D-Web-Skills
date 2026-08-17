import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

/** Four independent cafe sites plus an index, sharing one node_modules. */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5210 },
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        nasma: resolve(root, "nasma/index.html"),
        rumman: resolve(root, "rumman/index.html"),
        misk: resolve(root, "misk/index.html"),
        raseef: resolve(root, "raseef/index.html"),
        ghaim: resolve(root, "ghaim/index.html"),
        ghaimx: resolve(root, "ghaimx/index.html"),
      },
    },
  },
});
