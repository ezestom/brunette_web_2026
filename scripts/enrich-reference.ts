import type { Content } from "../src/lib/types";
import { readFileSync, writeFileSync } from "node:fs";
import { readContent, saveDraft, publish } from "../src/lib/db.ts";
const media = JSON.parse(
  readFileSync(
    new URL("../content/reference-media.json", import.meta.url),
    "utf8",
  ),
);
const gallery = JSON.parse(
  readFileSync(
    new URL("../content/reference-gallery.json", import.meta.url),
    "utf8",
  ),
);
const labels = JSON.parse(
  readFileSync(
    new URL("../content/reference-ingredients.json", import.meta.url),
    "utf8",
  ),
);
const translations: Record<string, string> = {
  "White chocolate": "Chocolate blanco",
  "Dark chocolate": "Chocolate amargo",
  "Dark Chocolate": "Chocolate amargo",
  Sprinkles: "Granas",
  Marshmallows: "Malvaviscos",
  "Graham crackers": "Galletitas",
  Chunks: "Trozos de chocolate",
  Chocolate: "Chocolate",
  "More Chocolate Chunks": "Más chocolate",
  "Chocolate chips": "Chips de chocolate",
  Caramel: "Caramelo",
  "Caramel chunks": "Trozos de caramelo",
  Pecans: "Nueces pecán",
  "Milk chocolate": "Chocolate con leche",
  "Milk Chocolate": "Chocolate con leche",
  "Roasted Walnuts": "Nueces tostadas",
  "Brownie Chunks": "Trozos de brownie",
  "Blondie Chunks": "Trozos de blondie",
  "Peanut Butter": "Mantequilla de maní",
  "Raspberry Jam": "Mermelada de frambuesa",
  "Toasted Pecan": "Pecán tostada",
  "Chocolate Chip": "Chips de chocolate",
  "Maple Syrup": "Jarabe de arce",
  "Salted Caramel": "Caramelo salado",
  Hazelnut: "Avellanas",
};
function enrich(content: Content) {
  if (!content.home.gallery?.length && content.home.previewMode)
    content.home.gallery = gallery;
  for (const p of content.products) {
    p.ingredients ??= [];
    if (!p.isDemo) continue;
    if (
      media[p.slug] &&
      !media[p.slug].endsWith(".heic") &&
      p.gallery.length === 1
    )
      p.gallery.push(media[p.slug]);
    p.gallery = p.gallery.filter((src) => !src.endsWith(".heic"));
    if (!p.ingredients.length && labels[p.slug])
      p.ingredients = labels[p.slug].map((s: string) => translations[s] || s);
  }
  return content;
}
const seedFile = new URL("../content/demo.json", import.meta.url),
  seed = JSON.parse(readFileSync(seedFile, "utf8"));
writeFileSync(seedFile, JSON.stringify(enrich(seed), null, 2) + "\n");
const current = readContent(),
  draft = readContent("draft");
if (current.revision === draft.revision) {
  const saved = saveDraft(
    enrich(draft),
    draft.revision,
    "Importación visual de referencia",
  );
  publish(saved.revision, "Importación visual de referencia");
  console.log("Galerías y etiquetas de prueba importadas.");
} else
  console.log("Hay borrador pendiente: no se modificó el contenido publicado.");
