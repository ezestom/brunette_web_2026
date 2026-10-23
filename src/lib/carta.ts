import { MENU_ITEMS, MENU_SECTIONS, menuProductHref } from "../data/menu.ts";
import { money } from "./order.ts";
import type { Content } from "./types.ts";

/** One public browsing list; each item keeps its existing product and cart identity. */
export function getCartaItems(content: Content) {
  const catalog = content.products
    .filter(
      (p) =>
        p.active &&
        content.categories.some((c) => c.id === p.category && c.active),
    )
    .map((p) => ({
      id: p.id,
      name: p.name,
      section: p.category,
      description: p.description,
      image: p.image,
      gallery: p.gallery,
      labels: p.ingredients || [],
      price: `${p.variants.length > 1 ? "Desde " : ""}${money(p.variants[0]?.price ?? null, content.settings.currency)}`,
      href: `/productos/${p.slug}`,
      badge: p.availability === "soldOut" ? "Agotado" : undefined,
    }));
  const demo = content.home.previewMode
    ? MENU_ITEMS.map((item) => ({
        ...item,
        gallery: item.gallery || [],
        labels: [MENU_SECTIONS.find((s) => s.id === item.section)!.name],
        href: menuProductHref(item),
      }))
    : [];
  const rank = new Map(
    MENU_SECTIONS.map((section, index) => [section.id as string, index]),
  );
  return [...catalog, ...demo].sort(
    (a, b) => (rank.get(a.section) ?? 0) - (rank.get(b.section) ?? 0),
  );
}
