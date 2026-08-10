import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5199 },
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        novaai: resolve(root, "novaai/index.html"),
        nexum: resolve(root, "nexum/index.html"),
        prmpt: resolve(root, "prmpt/index.html"),
      },
    },
  },
});
