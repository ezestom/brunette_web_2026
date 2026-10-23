import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getCartaItems } from "../src/lib/carta.ts";

const content = JSON.parse(
  readFileSync(new URL("../content/presentation.json", import.meta.url)),
);

test("the complete carta includes catalog products with their original detail URLs and beverages last", () => {
  const items = getCartaItems(content);
  for (const product of content.products.filter((p) => p.active)) {
    assert.equal(
      items.filter((item) => item.href === `/productos/${product.slug}`).length,
      1,
    );
  }
  assert.equal(items[0].section, "cookies");
  const drinks = items.findIndex((item) => item.section.startsWith("bebidas-"));
  assert.ok(drinks > 0);
  assert.ok(
    items.slice(drinks).every((item) => item.section.startsWith("bebidas-")),
  );
  assert.equal(new Set(items.map((item) => item.href)).size, items.length);
});

test("the live carta only shows active catalog products and keeps unknown prices", () => {
  const live = structuredClone(content);
  live.home.previewMode = false;
  live.products[0].active = false;
  live.products[1].variants[0].price = null;
  const items = getCartaItems(live);
  assert.equal(items.length, live.products.filter((p) => p.active).length);
  assert.ok(
    !items.some((item) => item.href === `/productos/${live.products[0].slug}`),
  );
  assert.match(
    items.find((item) => item.href === `/productos/${live.products[1].slug}`)
      .price,
    /confirmar/i,
  );
});
