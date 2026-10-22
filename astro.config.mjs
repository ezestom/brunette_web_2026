import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";
import vercel from "@astrojs/vercel";
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

if (existsSync(".env")) process.loadEnvFile(".env");
const vercelBuild = process.env.BRUNETTE_DEPLOY_TARGET === "vercel";
const presentation = process.env.BRUNETTE_PRESENTATION === "1";
const vercelHosts = [
  process.env.VERCEL_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
  process.env.VERCEL_BRANCH_URL,
].filter(Boolean);
const siteUrl =
  vercelBuild && vercelHosts.length
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || vercelHosts[0]}`
    : process.env.BRUNETTE_SITE_URL;
const site = siteUrl ? new URL(siteUrl) : null;
// The adapter excludes exact files, not globs or entire directories. Enumerate
// private local data so tracing never copies it into the deployable function.
const privateFiles = [];
if (vercelBuild) {
  for (const folder of [
    "data",
    "backups",
    "test-results",
    process.env.BRUNETTE_DATA_DIR,
  ].filter(Boolean)) {
    if (!existsSync(folder)) continue;
    for (const entry of readdirSync(folder, {
      recursive: true,
      withFileTypes: true,
    }))
      if (entry.isFile())
        privateFiles.push(resolve(entry.parentPath, entry.name));
  }
  for (const entry of readdirSync(".", { withFileTypes: true }))
    if (entry.isFile() && entry.name.startsWith(".env"))
      privateFiles.push(resolve(entry.name));
}

export default defineConfig({
  ...(site ? { site: site.origin } : {}),
  security: {
    allowedDomains: [
      { hostname: "127.0.0.1" },
      { hostname: "localhost" },
      ...(site ? [{ hostname: site.hostname }] : []),
      ...(vercelBuild ? vercelHosts.map((hostname) => ({ hostname })) : []),
    ],
  },
  integrations: [react()],
  output: "server",
  adapter: vercelBuild
    ? vercel({
        excludeFiles: privateFiles.map((file) => pathToFileURL(file).href),
        maxDuration: 10,
      })
    : node({ mode: "standalone" }),
  ...(presentation ? { session: false } : {}),
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
