import { DatabaseSync } from "node:sqlite";
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { validateContent } from "../src/lib/validation.ts";

const dataDirectory = resolve(process.env.BRUNETTE_DATA_DIR || "data");
const databasePath = join(dataDirectory, "brunette.sqlite");
let content;
if (existsSync(databasePath)) {
  const db = new DatabaseSync(databasePath, { readOnly: true });
  try {
    const row = db
      .prepare("SELECT json FROM documents WHERE key = ?")
      .get("published");
    if (!row) throw new Error("No published content found");
    content = JSON.parse(row.json);
  } finally {
    db.close();
  }
} else {
  content = JSON.parse(await readFile("content/demo.json", "utf8"));
}
content = validateContent(content);
content.home.previewMode = true;
content.revision = `presentation-${new Date().toISOString()}`;

// Copy only images referenced by public content. Never copy the database,
// draft, accounts, credentials, audit log, or other files from the data folder.
const images = new Set();
function rewrite(value) {
  if (typeof value === "string" && value.startsWith("/media/")) {
    const name = value.slice("/media/".length);
    if (!/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(name))
      throw new Error(`Invalid published media path: ${value}`);
    images.add(name);
    return `/presentation-media/${name}`;
  }
  if (Array.isArray(value)) return value.map(rewrite);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, rewrite(entry)]),
    );
  return value;
}
const snapshot = rewrite(content);
await mkdir("public/presentation-media", { recursive: true });
for (const name of images)
  await copyFile(
    join(dataDirectory, "uploads", name),
    join("public/presentation-media", name),
  );
await writeFile(
  "content/presentation.json",
  JSON.stringify(snapshot, null, 2) + "\n",
);
console.log(
  `Exported published presentation content: ${content.products.length} products, ${images.size} uploaded images.`,
);
