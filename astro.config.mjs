import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";
import { existsSync } from "node:fs";

if (existsSync(".env")) process.loadEnvFile(".env");
const site = process.env.BRUNETTE_SITE_URL
  ? new URL(process.env.BRUNETTE_SITE_URL)
  : null;

export default defineConfig({
  ...(site ? { site: site.origin } : {}),
  security: {
    allowedDomains: [
      { hostname: "127.0.0.1" },
      { hostname: "localhost" },
      ...(site ? [{ hostname: site.hostname }] : []),
    ],
  },
  integrations: [react()],
  output: "server",
  adapter: node({ mode: "standalone" }),
  devToolbar: { enabled: false },
  vite: {
    // Checking/building must not replace the JSX runtime used by the live dev server.
    cacheDir: process.argv.includes("dev")
      ? ".astro/vite-development"
      : ".astro/vite-build",
    optimizeDeps: { force: true },
    plugins: [tailwindcss()],
    server: {
      fs: { deny: ["**/.env*", "**/.git/**", "**/data/**", "**/backups/**"] },
    },
  },
});
