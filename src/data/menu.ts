import type { Product } from "../lib/types.ts";
import { MENU_PHOTOS } from "./menu-photos.ts";

export interface MenuSection {
  id: "bebidas-calientes" | "bebidas-frias" | "tortas" | "dulces" | "salados";
  number: string;
  name: string;
  subtitle: string;
  badge?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  section:
    "bebidas-calientes" | "bebidas-frias" | "tortas" | "dulces" | "salados";
  price: string;
  priceNum: number;
  description: string;
  image: string;
  badge?: string;
  note?: string;
  gallery?: string[];
}

export const menuProductHref = (item: MenuItem) =>
  `/productos/carta-${item.id}`;

/** Demo menu and catalog share the same detail UI and order validation. */
export function menuProduct(item: MenuItem): Product {
  return {
    id: `carta-${item.id}`,
    slug: `carta-${item.id}`,
    name: item.name,
    description: item.description,
    category: `carta-${item.section}`,
    image: item.image,
    imageAlt: `${item.name} · foto ilustrativa`,
    gallery: item.gallery || [],
    availability: "available",
    fulfillment: "ready",
    leadTimeHours: 0,
    featured: false,
    active: true,
    isDemo: true,
    allergens: [],
    variants: [
      {
        id: "unidad",
        name: item.section === "tortas" ? "Una porción" : "Una unidad",
        price: Math.round(item.priceNum * 100),
        available: true,
      },
    ],
    order: MENU_ITEMS.indexOf(item),
  };
}

export const MENU_SECTIONS: MenuSection[] = [
  {
    id: "bebidas-calientes",
    number: "01",
    name: "Bebidas Calientes",
    subtitle: "Cafetería de especialidad y tés en hebras seleccionados.",
  },
  {
    id: "bebidas-frias",
    number: "02",
    name: "Bebidas Frías",
    subtitle: "Iced coffee, limonadas caseras, smoothies y jugos naturales.",
  },
  {
    id: "tortas",
    number: "03",
    name: "Tortas",
    subtitle: "Porciones del mostrador elaboradas artesanalmente.",
    badge: "Consultar disponibilidad",
  },
  {
    id: "dulces",
    number: "04",
    name: "Dulces",
    subtitle: "Alfajores artesanales, budines, hojaldres, rolls y cuadrados.",
  },
  {
    id: "salados",
    number: "05",
    name: "Salados",
    subtitle:
      "Tostados en pan de campo o árabe, scons de queso y bocados salados.",
  },
];

const DEMO_MENU_ITEMS: MenuItem[] = [
  // 01. BEBIDAS CALIENTES
  {
    id: "ristretto",
    name: "Ristretto",
    section: "bebidas-calientes",
    price: "$ 3.200",
    priceNum: 3200,
    description:
      "Extracción corta, densa y concentrada de café de especialidad con crema dorada y aromática.",
    image: "/assets/Two_Food_Photograhers-59-9845bb3d.jpg",
  },
  {
    id: "expresso",
    name: "Expresso",
    section: "bebidas-calientes",
    price: "$ 3.300",
    priceNum: 3300,
    description:
      "Café espresso clásico de cuerpo pleno, equilibrado y con sutiles notas a cacao.",
    image: "/assets/Two_Food_Photograhers-59-9845bb3d.jpg",
  },
  {
    id: "cafe-doble",
    name: "Café doble",
    section: "bebidas-calientes",
    price: "$ 4.800",
    priceNum: 4800,
    description:
      "Doble shot de espresso de especialidad para un sabor potente y prolongado.",
    image: "/assets/Two_Food_Photograhers-59-9845bb3d.jpg",
  },
  {
    id: "cafe-con-leche",
    name: "Café con leche",
    section: "bebidas-calientes",
    price: "$ 6.400",
    priceNum: 6400,
    description:
      "Espresso de especialidad combinado con leche cremada y sedosa al punto ideal.",
    image: "/assets/Two_Food_Photograhers-4-e4a94fd2.jpg",
  },
  {
    id: "capuccino",
    name: "Capuccino",
    section: "bebidas-calientes",
    price: "$ 5.400",
    priceNum: 5400,
    description:
      "Proporción clásica de espresso, leche vaporizada y abundante espuma con toque de cacao amargo.",
    image: "/assets/Two_Food_Photograhers-4-e4a94fd2.jpg",
  },
  {
    id: "submarino",
    name: "Submarino",
    section: "bebidas-calientes",
    price: "$ 5.800",
    priceNum: 5800,
    description:
      "Leche caliente espumada con barra de chocolate artesanal para fundir en taza.",
    image: "/assets/Two_Food_Photograhers-74100a5d.jpg",
  },
  {
    id: "jarrito",
    name: "Jarrito",
    section: "bebidas-calientes",
    price: "$ 3.400",
    priceNum: 3400,
    description:
      "Formato tradicional de cafetería porteña: espresso largo en jarrito de vidrio templado.",
    image: "/assets/Two_Food_Photograhers-59-9845bb3d.jpg",
  },
  {
    id: "te",
    name: "Té en hebras",
    section: "bebidas-calientes",
    price: "$ 3.400",
    priceNum: 3400,
    description:
      "Selección de tés premium en hebras: Earl Grey, Green Tea, Frutos Rojos o Manzanilla natural.",
    image: "/assets/Two_Food_Photograhers-74100a5d.jpg",
  },
  {
    id: "te-con-leche",
    name: "Té con leche",
    section: "bebidas-calientes",
    price: "$ 3.500",
    priceNum: 3500,
    description:
      "Infusión de hebras de té negro suavemente combinada con leche caliente texturizada.",
    image: "/assets/Two_Food_Photograhers-74100a5d.jpg",
  },
  {
    id: "leche-vegetal",
    name: "Leche vegetal",
    section: "bebidas-calientes",
    price: "$ 1.600",
    priceNum: 1600,
    description:
      "Opción de bebida vegetal de almendras o avena cremosa para personalizar cualquiera de tus infusiones.",
    image: "/assets/Two_Food_Photograhers-4-e4a94fd2.jpg",
  },

  // 02. BEBIDAS FRÍAS
  {
    id: "iced-coffee",
    name: "Iced coffee",
    section: "bebidas-frias",
    price: "$ 6.500",
    priceNum: 6500,
    description:
      "Café de especialidad extraído al momento y enfriado sobre rocas de hielo, con o sin leche.",
    image: "/assets/Two_Food_Photograhers-164-ea3c4ce6.jpg",
  },
  {
    id: "limonada-menta-jengibre",
    name: "Limonada con menta y jengibre",
    section: "bebidas-frias",
    price: "$ 4.800",
    priceNum: 4800,
    description:
      "Jugo natural de limones frescos, hojas de menta del huerto y un toque sutil de jengibre fresco.",
    image: "/assets/Two_Food_Photograhers-40-b680fce9.jpg",
  },
  {
    id: "jugo-de-naranja",
    name: "Jugo de naranja natural",
    section: "bebidas-frias",
    price: "$ 4.900",
    priceNum: 4900,
    description:
      "Exprimido recién hecho 100% de fruta natural sin conservantes.",
    image: "/assets/Two_Food_Photograhers-40-b680fce9.jpg",
  },
  {
    id: "agua",
    name: "Agua mineral",
    section: "bebidas-frias",
    price: "$ 3.200",
    priceNum: 3200,
    description: "Agua mineral natural sin gas en botella individual (500 ml).",
    image: "/assets/Two_Food_Photograhers-164-ea3c4ce6.jpg",
  },
  {
    id: "agua-con-gas",
    name: "Agua con gas",
    section: "bebidas-frias",
    price: "$ 3.200",
    priceNum: 3200,
    description:
      "Agua mineral natural gasificada con burbuja fina y refrescante (500 ml).",
    image: "/assets/Two_Food_Photograhers-164-ea3c4ce6.jpg",
  },
  {
    id: "gaseosa-lata",
    name: "Gaseosa lata",
    section: "bebidas-frias",
    price: "$ 3.600",
    priceNum: 3600,
    description: "Línea clásica y sin azúcar en lata fría (354 ml).",
    image: "/assets/Two_Food_Photograhers-164-ea3c4ce6.jpg",
  },
  {
    id: "smoothie-frutos",
    name: "Smoothie frutos rojos",
    section: "bebidas-frias",
    price: "$ 5.600",
    priceNum: 5600,
    description:
      "Batido helado y espeso de frutillas, arándanos y moras naturales.",
    image: "/assets/Two_Food_Photograhers-40-b680fce9.jpg",
  },
  {
    id: "smoothie-con-leche",
    name: "Smoothie con leche",
    section: "bebidas-frias",
    price: "$ 5.800",
    priceNum: 5800,
    description:
      "Smoothie cremoso de frutas de estación batidas con base de leche entera o vegetal.",
    image: "/assets/Two_Food_Photograhers-40-b680fce9.jpg",
  },

  // 03. TORTAS (consultar disponibilidad)
  {
    id: "chocotorta",
    name: "Chocotorta",
    section: "tortas",
    price: "$ 9.700",
    priceNum: 9700,
    description:
      "El clásico argentino con galletitas de chocolate, dulce de leche repostero y queso crema suave.",
    image: "/assets/IMG_2112-5485255f.jpg",
  },
  {
    id: "mousse-chocolate-blanco-negro",
    name: "Mousse Chocolate blanco y negro",
    section: "tortas",
    price: "$ 9.500",
    priceNum: 9500,
    description:
      "Doble capa aireada y sedosa de chocolate semiamargo y chocolate blanco belga sobre base crocante.",
    image: "/assets/Untitled_design_29-2b38c165.png",
  },
  {
    id: "mousse-chocolate-ganache-almendras",
    name: "Mousse chocolate con ganache y almendras",
    section: "tortas",
    price: "$ 9.300",
    priceNum: 9300,
    description:
      "Mousse de chocolate intenso coronado con ganache brillante, toffee y praliné de almendras tostadas.",
    image: "/assets/Bernice-BrownButterCake-03-5f85108d.jpg",
  },
  {
    id: "tiramisu",
    name: "Tiramisú",
    section: "tortas",
    price: "$ 8.500",
    priceNum: 8500,
    description:
      "Vainillas caseras embebidas en café de especialidad, crema suave de mascarpone y lluvia de cacao amargo.",
    image: "/assets/Bernice-5-ac43ad49.jpg",
  },
  {
    id: "lemon-pie",
    name: "Lemon pie",
    section: "tortas",
    price: "$ 9.500",
    priceNum: 9500,
    description:
      "Masa sablé crocante a la manteca, curd de limón bien ácido y cremoso, terminado con merengue italiano flameado.",
    image: "/assets/LemonPoppyseed-01b-84e928d5.jpg",
  },
  {
    id: "crumble-manzana",
    name: "Crumble de manzana",
    section: "tortas",
    price: "$ 9.500",
    priceNum: 9500,
    description:
      "Manzanas verdes tiernas aromatizadas con canela bajo una generosa capa de crumble dorado de manteca y avena.",
    image: "/assets/Bernice-4-c39f6a96.jpg",
  },
  {
    id: "rogelito",
    name: "Rogelito",
    section: "tortas",
    price: "$ 7.200",
    priceNum: 7200,
    description:
      "Múltiples capas finas y crocantes de masa rogel casera intercaladas con puro dulce de leche y merengue suizo.",
    image: "/assets/1-41cb09f4.png",
  },
  {
    id: "cheesecake-frutos-rojos",
    name: "Cheesecake con frutos rojos",
    section: "tortas",
    price: "$ 9.200",
    priceNum: 9200,
    description:
      "Cheesecake horneado estilo New York, textura untuosa y cobertura de confitura casera de frutos rojos patagónicos.",
    image: "/assets/celebrationscake2-cfb37e02.jpg",
  },
  {
    id: "cheesecake-pistachos",
    name: "Cheesecake de pistachos",
    section: "tortas",
    price: "$ 12.300",
    priceNum: 12300,
    description:
      "Nuestra creación insignia: cheesecake horneado infusionado con pasta de pistachos puros y pistachos crocantes.",
    image: "/assets/BERNICE_HeroCakeImage-a5d690cb.jpg",
  },
  {
    id: "key-lime-pie",
    name: "Porción key lime pie",
    section: "tortas",
    price: "$ 10.500",
    priceNum: 10500,
    description:
      "Crema agridulce y sedosa de limas naturales sobre base crocante, decorada con toques de crema batida y ralladura.",
    image: "/assets/LemonPoppyseed-01b-84e928d5.jpg",
  },
  {
    id: "torta-matilda",
    name: "Porción torta matilda",
    section: "tortas",
    price: "$ 15.000",
    priceNum: 15000,
    description:
      "Bizcochuelo súper húmedo y denso de puro chocolate, relleno y bañado con fudge fundente de chocolate al 70%.",
    image: "/assets/IMG_2112-5485255f.jpg",
  },

  // 04. DULCES
  {
    id: "budin-limon-chia",
    name: "Porción budín de limón y chía",
    section: "dulces",
    price: "$ 5.600",
    priceNum: 5600,
    description:
      "Miga tierna y perfumada con ralladura de limón fresco, semillas de chía y baño de glasé cristalino.",
    image: "/assets/LemonPoppyseed-02b-749c13d4.jpg",
  },
  {
    id: "budin-chocolate-chips",
    name: "Porción budín de chocolate con chips",
    section: "dulces",
    price: "$ 5.600",
    priceNum: 5600,
    description:
      "Budín esponjoso de chocolate semiamargo salpicado con abundantes chips de chocolate derretidos en boca.",
    image: "/assets/Bernice-BrownButterCake-04-04e903ce.jpg",
  },
  {
    id: "alfajor-chocolate-banado",
    name: "Alfajor de chocolate bañado",
    section: "dulces",
    price: "$ 5.700",
    priceNum: 5700,
    description:
      "Masa de cacao suave rellena con dulce de leche repostero y baño crocante de chocolate semiamargo.",
    image: "/assets/double-dark-chocolate-cookie-1-dfde8235.jpg",
  },
  {
    id: "alfajor-almendras-ddl",
    name: "Alfajor de almendras con dulce de leche",
    section: "dulces",
    price: "$ 5.800",
    priceNum: 5800,
    description:
      "Tapas crocantes a base de harina de almendras seleccionadas, relleno con generoso dulce de leche artesanal.",
    image: "/assets/Bernice-14-ba16b457.jpg",
  },
  {
    id: "alfajor-sable",
    name: "Alfajor sablé",
    section: "dulces",
    price: "$ 3.200",
    priceNum: 3200,
    description:
      "Masa sablé mantecosa y delicada que se desarma en el paladar, unida por dulce de leche repostero.",
    image: "/assets/white-dark-chocolate-chunk-cookie-1-ec351628.jpg",
  },
  {
    id: "alfajor-maicena",
    name: "Alfajor de maicena con dulce de leche",
    section: "dulces",
    price: "$ 3.600",
    priceNum: 3600,
    description:
      "El favorito de siempre: masa suave de almidón de maíz, dulce de leche abundante y bordes rebozados en coco.",
    image: "/assets/Two_Food_Photograhers-168-ed4a1332.jpg",
  },
  {
    id: "scon-naranja-chips",
    name: "Scon de naranja con chips de chocolate",
    section: "dulces",
    price: "$ 4.700",
    priceNum: 4700,
    description:
      "Scon dulce horneado con ralladura fresca de naranja y chips de chocolate semiamargo.",
    image: "/assets/chocolate-chunk-walnut-cookie-1-e668b5e7.jpg",
  },
  {
    id: "medialuna-manteca",
    name: "Medialuna de manteca",
    section: "dulces",
    price: "$ 1.600",
    priceNum: 1600,
    description:
      "Medialuna de hojaldre artesanal dorada, esponjosa y perfumada con almíbar suave.",
    image: "/assets/Two_Food_Photograhers-168-ed4a1332.jpg",
  },
  {
    id: "croissant",
    name: "Croissant clásico",
    section: "dulces",
    price: "$ 5.000",
    priceNum: 5000,
    description:
      "Croissant clásico laminado con manteca pura, corteza crujiente y miga aireada.",
    image: "/assets/Two_Food_Photograhers-184-d4199d36.jpg",
  },
  {
    id: "croissant-con-pastelera",
    name: "Croissant con pastelera",
    section: "dulces",
    price: "$ 5.200",
    priceNum: 5200,
    description:
      "Croissant hojaldrado relleno y terminado con suave crema pastelera perfumada con vainilla.",
    image: "/assets/Two_Food_Photograhers-184-d4199d36.jpg",
  },
  {
    id: "roll-canela",
    name: "Roll de canela",
    section: "dulces",
    price: "$ 6.100",
    priceNum: 6100,
    description:
      "Masa tierna enrollada con especias aromáticas, canela dulce y frosting suave de vainilla.",
    image: "/assets/Two_Food_Photograhers-6-386762fa.jpg",
  },
  {
    id: "danesa",
    name: "Factura danesa",
    section: "dulces",
    price: "$ 6.400",
    priceNum: 6400,
    description:
      "Hojaldre danés delicado con opciones de crema pastelera, frutas de estación o dulce de leche (consultar rellenos).",
    image: "/assets/Two_Food_Photograhers-160-4ca3b953.jpg",
  },
  {
    id: "cuadrado-brownie-nuez",
    name: "Cuadrado brownie con nuez",
    section: "dulces",
    price: "$ 11.500",
    priceNum: 11500,
    description:
      "Brownie húmedo y fudge de chocolate con crocantes trozos de nueces mariposa.",
    image: "/assets/chocolate-chunk-walnut-cookie-1-e668b5e7.jpg",
  },
  {
    id: "cuadrado-carrot-cake",
    name: "Cuadrado de carrot cake",
    section: "dulces",
    price: "$ 8.200",
    priceNum: 8200,
    description:
      "Bizcochuelo especiado de zanahoria fresca y nueces con capa cremosa de frosting de queso crema.",
    image: "/assets/Bernice-4-c39f6a96.jpg",
  },
  {
    id: "cuadrado-coco-ddl",
    name: "Cuadrado de coco con ddl",
    section: "dulces",
    price: "$ 11.500",
    priceNum: 11500,
    description:
      "Base crocante sablé, generosa capa de dulce de leche repostero y cubierta dorada de coco rallado.",
    image: "/assets/birthday-cookie-1-f9af14fc.jpg",
  },
  {
    id: "cuadrado-pasta-frola-membrillo",
    name: "Cuadrado de pasta frola membrillo",
    section: "dulces",
    price: "$ 7.400",
    priceNum: 7400,
    description:
      "Masa tierna mantecosa con dulce de membrillo casero brillante y enrejado tradicional.",
    image: "/assets/peanut-butter-jam-cookie-1-0090c70d.jpg",
  },
  {
    id: "cuadrado-pasta-frola-batata",
    name: "Cuadrado de pasta frola batata",
    section: "dulces",
    price: "$ 7.000",
    priceNum: 7000,
    description:
      "El clásico de la merienda con dulce de batata suave y masa dorada a la manteca.",
    image: "/assets/salted-caramel-pecan-cookie-1-b56a6dd3.jpg",
  },
  {
    id: "cuadrado-ricota",
    name: "Cuadrado ricota",
    section: "dulces",
    price: "$ 10.100",
    priceNum: 10100,
    description:
      "Relleno cremoso de ricota fresca con notas sutiles de vainilla y ralladura de limón.",
    image: "/assets/1-41cb09f4.png",
  },

  // 05. SALADOS
  {
    id: "scon-queso-dip",
    name: "Scon de queso con dip",
    section: "salados",
    price: "$ 7.800",
    priceNum: 7800,
    description:
      "Scon salado recién horneado con queso reggianito dorado, acompañado de dip cremoso con ciboulette fresca.",
    image: "/assets/Two_Food_Photograhers-50-697f1568.jpg",
  },
  {
    id: "medialuna-rellena-jyq",
    name: "Medialuna rellena con jamón y queso",
    section: "salados",
    price: "$ 3.100",
    priceNum: 3100,
    description:
      "Medialuna hojaldrada tibia rellena de jamón cocido seleccionado y queso derretido a la plancha.",
    image: "/assets/Two_Food_Photograhers-11-1d0d0897.jpg",
  },
  {
    id: "croissant-rellena-jyq",
    name: "Croissant rellena con jamón y queso",
    section: "salados",
    price: "$ 7.300",
    priceNum: 7300,
    description:
      "Croissant francés laminado, tostado y relleno con jamón natural y queso gratinado.",
    image: "/assets/Two_Food_Photograhers-184-d4199d36.jpg",
  },
  {
    id: "tostadas-dip-mermelada-queso",
    name: "Tostadas con dip de mermelada y queso",
    section: "salados",
    price: "$ 8.000",
    priceNum: 8000,
    description:
      "Rodajas crujientes de pan artesanal acompañadas con queso crema fresco y mermelada casera.",
    image: "/assets/Two_Food_Photograhers-50-697f1568.jpg",
  },
  {
    id: "tostada-palta-huevo-cherry",
    name: "Tostada con palta, huevo y cherry",
    section: "salados",
    price: "$ 9.300",
    priceNum: 9300,
    description:
      "Rebanada gruesa de pan de masa madre con palta fresca cremosa, huevos revueltos al punto y cherries salteados.",
    image: "/assets/Two_Food_Photograhers-50-697f1568.jpg",
  },
  {
    id: "tostado-arabe-jyq",
    name: "Tostado pan árabe con jamón y queso",
    section: "salados",
    price: "$ 8.600",
    priceNum: 8600,
    description:
      "Pan árabe extra fino tostado bien crocante con jamón cocido seleccionado y queso derretido.",
    image: "/assets/Two_Food_Photograhers-11-1d0d0897.jpg",
  },
  {
    id: "tostado-arabe-qyt",
    name: "Tostado pan árabe con queso y tomate",
    section: "salados",
    price: "$ 8.600",
    priceNum: 8600,
    description:
      "Tostado liviano en pan árabe crujiente con queso fundido, rodajas de tomate y orégano fresco.",
    image: "/assets/Two_Food_Photograhers-11-1d0d0897.jpg",
  },
  {
    id: "tostado-campo-jyq",
    name: "Tostado pan de campo con jamón y queso",
    section: "salados",
    price: "$ 9.000",
    priceNum: 9000,
    description:
      "Generosas rebanadas de pan de campo artesanal tostadas a la chapa con jamón cocido y queso fundido.",
    image: "/assets/Two_Food_Photograhers-50-697f1568.jpg",
  },
  {
    id: "tostado-campo-qyt",
    name: "Tostado pan de campo con queso y tomate",
    section: "salados",
    price: "$ 9.000",
    priceNum: 9000,
    description:
      "Pan de campo crujiente con queso derretido, tomates frescos, aceite de oliva virgen extra y hierbas.",
    image: "/assets/Two_Food_Photograhers-50-697f1568.jpg",
  },
  {
    id: "tostado-chipa-especial",
    name: "Tostado de chipá especial",
    section: "salados",
    price: "$ 12.000",
    priceNum: 12000,
    badge: "NEW!",
    description:
      "Auténtico pan de chipá tostado a la plancha. Opciones: jamón y queso, o queso con tomate y pesto casero de albahaca.",
    image: "/assets/Two_Food_Photograhers-50-697f1568.jpg",
  },
  {
    id: "fosforito-jyq",
    name: "Fosforito con jamón y queso",
    section: "salados",
    price: "$ 5.000",
    priceNum: 5000,
    description:
      "Bocado clásico de hojaldre agridulce glaseado relleno con jamón cocido natural y queso de máquina fundido.",
    image: "/assets/Two_Food_Photograhers-184-d4199d36.jpg",
  },
];

export const MENU_ITEMS: MenuItem[] = DEMO_MENU_ITEMS.map((item) => ({
  ...item,
  ...MENU_PHOTOS[item.id],
}));
