import { spawnSync } from "node:child_process";

const environment = {
  ...process.env,
  BRUNETTE_PRESENTATION: "1",
  BRUNETTE_DEPLOY_TARGET: "vercel",
};
for (const command of ["check", "build"]) {
  const result = spawnSync(
    process.execPath,
    ["node_modules/astro/bin/astro.mjs", command],
    {
      stdio: "inherit",
      env: environment,
    },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
await import("./verify-vercel.mjs");
