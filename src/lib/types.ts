export type Availability = "available" | "soldOut" | "onRequest";
export type Fulfillment = "ready" | "preorder";
export interface ProductVariant {
  id: string;
  name: string;
  price: number | null;
  available: boolean;
}
export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  image: string;
  imageAlt: string;
  gallery: string[];
  availability: Availability;
  fulfillment: Fulfillment;
  leadTimeHours: number | null;
  featured: boolean;
  active: boolean;
  isDemo: boolean;
  allergens: string[];
  ingredients?: string[];
  variants: ProductVariant[];
  order: number;
}
export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  active: boolean;
}
export interface OpeningDay {
  day: number;
  closed: boolean;
  open: string;
  close: string;
}
export interface Branch {
  id: string;
  name: string;
  address: string;
  whatsapp: string;
  mapUrl: string;
  openingHours: OpeningDay[];
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryZone: string;
  deliveryFee: number | null;
  active: boolean;
  isDemo: boolean;
}
export interface BusinessSettings {
  name: string;
  tagline: string;
  description: string;
  whatsapp: string;
  instagram: string;
  address: string;
  mapUrl: string;
  currency: "ARS" | "USD" | "UYU";
  timezone: string;
  openingHours: OpeningDay[];
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryZone: string;
  deliveryFee: number | null;
  minimumOrder: number | null;
  defaultLeadTimeHours: number | null;
  closedDates: string[];
  orderNotice: string;
  logo: string;
  colorPrimary: string;
  colorBackground: string;
  colorAccent: string;
}
export interface HomeContent {
  contactTitle?: string;
  contactText?: string;
  contactImage?: string;
  gallery?: string[];
  /** Direct video/image assets for the alternating social carousel. */
  socialMedia?: {
    type: "image" | "video";
    src: string;
    poster?: string;
    alt?: string;
    href?: string;
  }[];
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  introTitle: string;
  introText: string;
  storyTitle: string;
  storyText: string;
  storyImage: string;
  announcement: string;
  showAnnouncement: boolean;
  previewMode: boolean;
}
export interface Content {
  schemaVersion: 1;
  revision: string;
  settings: BusinessSettings;
  home: HomeContent;
  categories: Category[];
  products: Product[];
  /** Public demo menu, separate from CMS catalog categories. */
  menuProducts?: Product[];
  branches: Branch[];
}
export interface CartLine {
  productId: string;
  variantId: string;
  quantity: number;
}
export interface OrderDetails {
  name: string;
  method: "pickup" | "delivery";
  requestedDate: string;
  requestedTime: string;
  address: string;
  notes: string;
  branchId: string;
}
