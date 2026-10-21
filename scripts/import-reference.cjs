/* One-time local reference import. Does not fetch remote resources. */
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const reference = path.resolve(root, "..", "bernice-frontend");
const catalog = JSON.parse(
  fs.readFileSync(path.join(reference, "public/catalog.json"), "utf8"),
).filter((p) => p.language === "en");
const manifest = JSON.parse(
  fs.readFileSync(path.join(reference, "research/manifest.json"), "utf8"),
);
const assets = new Set();
const titles = {
  "Birthday Cookie": "Cookie de cumpleaños",
  "S'mores Cookie": "Cookie de chocolate y marshmallow",
  "White & Dark Chocolate Chunk Cookie": "Cookie de dos chocolates",
  "Double Dark Chocolate Cookie": "Cookie de chocolate intenso",
  "Milk Chocolate Caramel Cookie": "Cookie de chocolate y caramelo",
  "Salted Caramel Pecan Cookie": "Cookie de caramelo y pecán",
  "Chocolate Chunk Walnut Cookie": "Cookie de chocolate y nuez",
  "Black & White Chocolate Cookie": "Cookie de chocolate blanco y negro",
  "Peanut Butter & Jam Cookie": "Cookie de maní y mermelada",
  "Pecan Cookie (Vegan)": "Cookie de pecán",
  "Variety Box": "Caja de cookies surtidas",
  "Frozen Cookie Dough": "Masa para cookies",
  "Hazelnut & Chocolate Ganache Cookie": "Cookie de avellanas y chocolate",
  "Rainbow Birthday Cake": "Torta de cumpleaños",
  "Full Frosting Rainbow Birthday Cake": "Torta de cumpleaños cubierta",
  "Chocolate Ganache Cake": "Torta de chocolate",
  "Carrot Cake": "Carrot cake",
  "Biscoff Cookie Butter Cake": "Torta de crema de galletitas",
  "Chocolate & Brown Butter Cake": "Torta de chocolate y manteca dorada",
  "Lemon Poppyseed Cake": "Torta de limón",
  "Honey & Peach Cake": "Torta de duraznos",
  "Celebration Cake": "Torta celebración",
};
const hero = Object.entries(manifest.assets).find(([k]) =>
  k.includes("BERNICE_HeroCakeImage.jpg?width=1920"),
)?.[1];
const names = Object.values(manifest.assets);
const fonts = names.filter((n) => n.includes("ApfelGrotezk"));
const products = catalog.map((p, i) => {
  assets.add(p.image);
  return {
    id: "ref-" + p.product_id,
    slug: p.url.split("/").pop(),
    name: titles[p.title] || p.title,
    description:
      "Producto de ejemplo para preparar el catálogo de Brunette. La descripción, los ingredientes y las opciones reales están pendientes de confirmar.",
    category: p.category === "cakes" ? "tortas" : "cookies",
    image: p.image,
    imageAlt: titles[p.title] || p.title,
    gallery: [p.image],
    availability: "onRequest",
    fulfillment: p.category === "cakes" ? "preorder" : "ready",
    leadTimeHours: null,
    featured: i < 3 || p.title === "Rainbow Birthday Cake",
    active: true,
    isDemo: true,
    allergens: [],
    variants: p.variants.map((v, j) => ({
      id: String(v.id),
      name:
        p.variants.length === 1
          ? "Presentación estándar"
          : j === 0
            ? "Chica"
            : "Grande",
      price: null,
      available: true,
    })),
    order: i,
  };
});
assets.add(hero);
fonts.forEach((f) => assets.add(f));
// Keep the original responsive hero variants available locally.
for (const [key, value] of Object.entries(manifest.assets))
  if (key.includes("BERNICE_HeroCakeImage.jpg")) assets.add(value);
const content = {
  schemaVersion: 1,
  revision: "initial-demo",
  settings: {
    name: "Brunette",
    tagline: "Mostrador de antojos",
    description:
      "Un lugar para encontrar tu próximo antojo. Catálogo, pedidos para retirar y consultas por WhatsApp.",
    whatsapp: "",
    instagram: "https://www.instagram.com/brunette.mostradordeantojos/",
    address: "",
    mapUrl: "",
    currency: "ARS",
    timezone: "America/Argentina/Buenos_Aires",
    openingHours: [],
    pickupEnabled: true,
    deliveryEnabled: true,
    deliveryZone: "",
    deliveryFee: null,
    minimumOrder: null,
    defaultLeadTimeHours: null,
    closedDates: [],
    orderNotice:
      "La disponibilidad, el precio final y el horario se confirman por WhatsApp. Enviar la consulta no reserva el pedido.",
  },
  home: {
    heroTitle: "Antojos que se comparten.",
    heroSubtitle:
      "Del mostrador a tu mesa. Encontrá tu favorito y coordiná tu pedido con nosotros.",
    heroImage: hero,
    introTitle: "Siempre hay una buena excusa para algo rico.",
    introText:
      "Elegí del catálogo, consultá lo que hay disponible o pedí con anticipación para una ocasión especial.",
    storyTitle: "Un mostrador. Mil antojos.",
    storyText:
      "Este espacio está reservado para contar la historia de Brunette, presentar al equipo y compartir lo que hace especial a cada preparación.",
    storyImage: products.find((p) => p.category === "tortas").image,
    announcement: "Consultá por los antojos del día",
    showAnnouncement: true,
    previewMode: true,
  },
  categories: [
    {
      id: "cookies",
      name: "Cookies",
      description: "Para compartir. O no.",
      image: products[0].image,
      active: true,
    },
    {
      id: "tortas",
      name: "Tortas",
      description: "Para los días que merecen algo especial.",
      image: products.find((p) => p.category === "tortas").image,
      active: true,
    },
  ],
  products,
};
fs.mkdirSync(path.join(root, "content"), { recursive: true });
fs.mkdirSync(path.join(root, "public/assets"), { recursive: true });
const target = path.join(root, "content/demo.json");
if (fs.existsSync(target))
  throw new Error("The seed already exists. Preserve edited content.");
fs.writeFileSync(target, JSON.stringify(content, null, 2));
for (const file of assets) {
  if (!file) continue;
  fs.copyFileSync(
    path.join(reference, "public", file),
    path.join(root, "public", file),
  );
}
console.log(
  `Imported ${products.length} demo products and ${assets.size} selected local assets.`,
);
