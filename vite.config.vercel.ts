import { fileURLToPath } from "node:url";
import vinext from "vinext";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

// Vercel build path, added alongside the existing Cloudflare Workers path in
// vite.config.ts (used by `npm run dev`/`build`/`vinext deploy`). This file is
// only used for `npm run build:vercel`; it does not replace the Cloudflare setup.
export default defineConfig({
  css: { postcss: "./postcss.config.mjs" },
  resolve: {
    // The Nitro "rsc" build environment doesn't resolve tailwindcss's package.json
    // "style" export condition for `@import "tailwindcss"`, unlike the Cloudflare
    // build path; point it straight at the CSS entry file instead.
    alias: {
      tailwindcss: fileURLToPath(new URL("./node_modules/tailwindcss/index.css", import.meta.url)),
    },
  },
  plugins: [vinext(), nitro()],
});
