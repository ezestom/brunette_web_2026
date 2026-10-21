import { readContent } from "./db.ts";

export function getContent() {
  return readContent("published");
}
export function getPublicContent() {
  const content = getContent();
  content.products = content.products
    .filter(
      (p) =>
        p.active &&
        content.categories.some((c) => c.id === p.category && c.active),
    )
    .sort((a, b) => a.order - b.order);
  content.categories = content.categories.filter((c) => c.active);
  content.branches = content.branches.filter((b) => b.active);
  return content;
}
