import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const temporary = mkdtempSync(join(tmpdir(), "brunette-presentation-"));
process.env.BRUNETTE_PRESENTATION = "1";
process.env.BRUNETTE_DATA_DIR = join(temporary, "must-not-be-created");
const { getContent, getPublicContent } = await import("../src/lib/content.ts");

test("presentation reads a public snapshot without creating a database or admin account", () => {
  const content = getPublicContent();
  assert.equal(content.home.previewMode, true);
  assert.ok(content.products.length > 0);
  assert.ok(content.menuProducts.length > 0);
  assert.equal(existsSync(process.env.BRUNETTE_DATA_DIR), false);
});

test("presentation content is cloned and cannot mutate subsequent requests", () => {
  const first = getContent();
  const name = first.settings.name;
  first.settings.name = "Changed in memory";
  assert.equal(getContent().settings.name, name);
});

test.after(() => {
  globalThis.__brunetteDB?.close();
  rmSync(temporary, { recursive: true, force: true });
});
