import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

// Reference photographs for the sales demo, never presented as Brunette's own.
const photos = [
  ["espresso", 21366984, "close-up-of-a-shot-of-espresso", "Pexels"],
  [
    "espresso-detail",
    37029476,
    "elegant-espresso-cup-with-coffee-on-saucer",
    "firas chougari",
  ],
  ["latte", 17305193, "coffee-cup-on-table", "Pexels"],
  ["tea", 7225793, "photograph-of-a-white-cup-with-tea", "cottonbro studio"],
  ["hot-chocolate", 11158851, "milk-added-to-cup-of-hot-chocolate", "Pexels"],
  ["iced-coffee", 7937425, "iced-coffee-drink-in-a-glass", "Nicola Barts"],
  ["lemonade", 18142613, "glass-of-lemonade", "Pexels"],
  ["orange-juice", 19116918, "glass-of-orange-juice", "Pexels"],
  ["smoothie", 9251276, "a-glass-of-smoothie", "Daniel Ruiz"],
  ["croissant", 3892469, "close-up-photo-of-croissant", "Pexels"],
  ["croissant-detail", 3850349, "croissant", "Pexels"],
  ["alfajores", 17358380, "alfajores", "Pexels"],
  ["brownie", 15033482, "brownies-on-a-plate", "Ana Lobo"],
  [
    "brownie-detail",
    7157867,
    "chocolate-brownies-on-a-white-ceramic-plate",
    "Pexels",
  ],
  [
    "cheesecake",
    28377761,
    "delicious-berry-cheesecake-slice-on-plate",
    "Zehra K.",
  ],
  [
    "cheesecake-detail",
    4051736,
    "close-up-shot-of-a-berries-cheesecake",
    "alleksana",
  ],
  [
    "avocado-toast",
    31683420,
    "delicious-avocado-toast-with-poached-egg-and-coffee",
    "Pexels",
  ],
  ["toasted-sandwich", 13376561, "toast-with-ham-and-cheese", "Pexels"],
  [
    "cinnamon-roll",
    35347730,
    "freshly-baked-cinnamon-rolls-on-paper",
    "Pexels",
  ],
  [
    "chocolate-cake",
    1028711,
    "chocolate-cake-slice",
    "Acharaporn Kamornboonyarush",
  ],
  ["lemon-tart", 6605303, "lemon-tart-on-marble-table", "Geraud pfeiffer"],
  [
    "water",
    8074426,
    "water-being-poured-from-a-glass-bottle-to-a-clear-drinking-glass",
    "Ksenia Chernaya",
  ],
  [
    "sparkling-water",
    327090,
    "close-up-of-bottle-pouring-water-on-glass",
    "Pixabay",
  ],
  [
    "soda",
    8444425,
    "close-up-shot-of-a-glass-of-drink-beside-a-can",
    "Guto Macedo",
  ],
];

await mkdir("public/assets/menu-demo", { recursive: true });
const requested = process.argv.slice(2);
const selected = requested.length
  ? photos.filter(([name]) => requested.includes(name))
  : photos;
for (let i = 0; i < selected.length; i += 4) {
  await Promise.all(
    selected.slice(i, i + 4).map(async ([name, id]) => {
      const response = await fetch(
        `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1400`,
        { signal: AbortSignal.timeout(30000) },
      );
      if (
        !response.ok ||
        !response.headers.get("content-type")?.startsWith("image/")
      )
        throw new Error(`Photo ${id}: ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      await sharp(bytes)
        .rotate()
        .resize({ width: 1100, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(`public/assets/menu-demo/${name}.webp`);
      console.log(`Saved ${name}`);
    }),
  );
}
await writeFile(
  "research/MENU-PHOTO-SOURCES.md",
  [
    "# Fotografías de referencia para la carta demo",
    "",
    "Descargadas el 22 de octubre de 2026. Son fotografías ilustrativas de terceros, no fotografías de productos reales de Brunette. Reemplazar al cargar el contenido del cliente.",
    "",
    "Fuente: [Pexels](https://www.pexels.com/). [Licencia](https://www.pexels.com/legal-pages/license/). Uso como imágenes de una web de demostración; no se redistribuyen como banco de imágenes. Cada enlace conserva la identificación del fotógrafo en la página de origen.",
    "",
    "| Archivo | Fotógrafo / fuente | Original |",
    "| --- | --- | --- |",
    ...photos.map(
      ([name, id, slug, author]) =>
        `| ${name}.webp | ${author} | [Foto ${id}](https://www.pexels.com/photo/${slug}-${id}/) |`,
    ),
    "",
  ].join("\n"),
);
