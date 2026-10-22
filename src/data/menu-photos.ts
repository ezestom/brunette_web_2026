// Sources and license: research/MENU-PHOTO-SOURCES.md. Illustrative demo photos.
const photo = (name: string) => `/assets/menu-demo/${name}.webp`;
const espresso = {
  image: photo("espresso"),
  gallery: [photo("espresso-detail")],
};
const latte = { image: photo("latte") };
const tea = { image: photo("tea") };
const croissant = {
  image: photo("croissant"),
  gallery: [photo("croissant-detail")],
};
const alfajor = { image: photo("alfajores") };
const chocolate = { image: photo("chocolate-cake") };
const sandwich = { image: photo("toasted-sandwich") };

export const MENU_PHOTOS: Record<
  string,
  { image: string; gallery?: string[] }
> = {
  ristretto: espresso,
  expresso: espresso,
  "cafe-doble": espresso,
  jarrito: espresso,
  "cafe-con-leche": latte,
  capuccino: latte,
  "leche-vegetal": latte,
  te: tea,
  "te-con-leche": tea,
  submarino: { image: photo("hot-chocolate") },
  "iced-coffee": { image: photo("iced-coffee") },
  "limonada-menta-jengibre": { image: photo("lemonade") },
  "jugo-de-naranja": { image: photo("orange-juice") },
  "smoothie-frutos": { image: photo("smoothie") },
  "smoothie-con-leche": { image: photo("smoothie") },
  agua: { image: photo("water") },
  "agua-con-gas": { image: photo("sparkling-water") },
  "gaseosa-lata": { image: photo("soda") },
  "mousse-chocolate-blanco-negro": chocolate,
  "mousse-chocolate-ganache-almendras": chocolate,
  "torta-matilda": chocolate,
  "lemon-pie": { image: photo("lemon-tart") },
  "key-lime-pie": { image: photo("lemon-tart") },
  "cheesecake-frutos-rojos": {
    image: photo("cheesecake"),
    gallery: [photo("cheesecake-detail")],
  },
  "alfajor-chocolate-banado": alfajor,
  "alfajor-almendras-ddl": alfajor,
  "alfajor-sable": alfajor,
  "alfajor-maicena": alfajor,
  "medialuna-manteca": croissant,
  croissant,
  "croissant-con-pastelera": croissant,
  "roll-canela": { image: photo("cinnamon-roll") },
  "cuadrado-brownie-nuez": {
    image: photo("brownie"),
    gallery: [photo("brownie-detail")],
  },
  "tostada-palta-huevo-cherry": { image: photo("avocado-toast") },
  "medialuna-rellena-jyq": croissant,
  "croissant-rellena-jyq": croissant,
  "tostado-arabe-jyq": sandwich,
  "tostado-campo-jyq": sandwich,
};
