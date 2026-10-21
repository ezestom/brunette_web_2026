const fs = require("node:fs");
const path = require("node:path");
const file = path.resolve(__dirname, "../content/demo.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));
data.settings = {
  ...data.settings,
  whatsapp: "5491168641122",
  logo: "",
  colorPrimary: "#1c352c",
  colorBackground: "#f5eee5",
  colorAccent: "#f0b4c3",
};
const hours = Array.from({ length: 7 }, (_, day) => ({
  day,
  closed: day === 0,
  open: "09:00",
  close: "19:00",
}));
data.branches = [
  {
    id: "cafe",
    name: "Café Brunette",
    address: "Llavallol 4202",
    whatsapp: "",
    mapUrl: "",
    openingHours: hours,
    pickupEnabled: true,
    deliveryEnabled: true,
    deliveryZone: "Zona de entrega de ejemplo: consultar por WhatsApp",
    deliveryFee: null,
    active: true,
    isDemo: true,
  },
  {
    id: "mostrador",
    name: "Mostrador Brunette",
    address: "Asunción 4185",
    whatsapp: "",
    mapUrl: "",
    openingHours: hours,
    pickupEnabled: true,
    deliveryEnabled: true,
    deliveryZone: "Zona de entrega de ejemplo: consultar por WhatsApp",
    deliveryFee: null,
    active: true,
    isDemo: true,
  },
];
data.settings.defaultLeadTimeHours = 24;
data.products.forEach((p, i) => {
  p.availability = i === 7 ? "soldOut" : "available";
  p.leadTimeHours = p.fulfillment === "preorder" ? 48 : 0;
  p.variants.forEach((v, j) => {
    v.price =
      p.category === "tortas"
        ? 4200000 + i * 100000 + j * 1500000
        : 450000 + i * 15000;
  });
});
data.home.previewMode = true;
data.home.announcement =
  "Tu próximo antojo está acá · Retiro y entregas a coordinar";
fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log(
  "Demo updated with supplied addresses and general WhatsApp. Hours and prices are marked as examples.",
);
