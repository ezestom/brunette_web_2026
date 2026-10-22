import assert from "node:assert/strict";
import { readFile, mkdtemp, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

process.env.NODE_ENV = "production";
delete process.env.BRUNETTE_PRESENTATION;
const temporary = await mkdtemp(join(tmpdir(), "brunette-vercel-runtime-"));
process.env.BRUNETTE_DATA_DIR = join(temporary, "must-not-exist");
const root = resolve(".vercel/output/functions/_render.func");
const config = JSON.parse(
  await readFile(join(root, ".vc-config.json"), "utf8"),
);
const handler = (await import(pathToFileURL(join(root, config.handler)).href))
  .default;
for (const path of [
  "/",
  "/carta",
  "/catalogo?categoria=cookies",
  "/productos/carta-croissant",
  "/contacto",
  "/nosotros",
  "/sucursales",
]) {
  const response = await handler.fetch(
    new Request(`https://brunette-web-2026.vercel.app${path}`),
  );
  assert.equal(response.status, 200, path);
  assert.match(response.headers.get("x-robots-tag"), /noindex/);
  const html = await response.text();
  assert.ok(html.length > 1000, path);
  assert.ok(
    !html.includes('href="/admin"'),
    "Presentation must not link to administration",
  );
}
const catalogResponse = await handler.fetch(
  new Request("https://brunette-web-2026.vercel.app/api/catalog"),
);
const content = await catalogResponse.json();
assert.equal(content.home.previewMode, true);
assert.ok(content.products.length > 0 && content.menuProducts.length > 0);
for (const path of [
  "/admin",
  "/api/auth/me",
  "/api/admin/content",
  "/data/brunette.sqlite",
  "/backups/test",
]) {
  const response = await handler.fetch(
    new Request(`https://brunette-web-2026.vercel.app${path}`),
  );
  assert.equal(response.status, 404, path);
}
assert.equal(
  await access(process.env.BRUNETTE_DATA_DIR).then(
    () => true,
    () => false,
  ),
  false,
);
console.log(
  "Built Vercel function verified: public routes and catalog work, private routes blocked, no database created, presentation mode embedded without runtime env.",
);
