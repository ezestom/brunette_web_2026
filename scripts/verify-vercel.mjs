import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = ".vercel/output/functions/_render.func";
const entries = await readdir(root, { recursive: true, withFileTypes: true });
const forbidden = entries.filter(
  (entry) =>
    entry.isFile() &&
    /\.sqlite(?:-wal|-shm)?$|^primer-acceso\.txt$|^\.env(?:\.|$)/i.test(
      entry.name,
    ),
);
assert.deepEqual(
  forbidden.map((entry) => entry.name),
  [],
  "Private data must never be bundled for Vercel",
);
const config = JSON.parse(
  await readFile(join(root, ".vc-config.json"), "utf8"),
);
assert.equal(config.runtime, "nodejs24.x");
assert.equal(config.supportsResponseStreaming, true);
console.log(
  "Vercel artifact verified: Node 24, no SQLite database, credentials or env files.",
);
