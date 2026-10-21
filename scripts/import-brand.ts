import { readFileSync, writeFileSync } from "node:fs";
import { readContent, saveDraft, publish } from "../src/lib/db.ts";
const logo = "/assets/brunette-logo-beige.jpg";
const draft = readContent("draft"),
  current = readContent();
if (draft.revision !== current.revision)
  throw new Error("Hay cambios pendientes: no se publicaron.");
if (draft.settings.logo !== logo) {
  draft.settings.logo = logo;
  const saved = saveDraft(draft, draft.revision, "Identidad Brunette");
  publish(saved.revision, "Identidad Brunette");
}
const path = new URL("../content/demo.json", import.meta.url);
const seed = JSON.parse(readFileSync(path, "utf8"));
seed.settings.logo = logo;
writeFileSync(path, JSON.stringify(seed, null, 2) + "\n");
console.log("Logo guardado en la web, el panel y los datos iniciales.");
