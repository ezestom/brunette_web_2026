import test from "node:test";
import assert from "node:assert/strict";
import { MENU_ITEMS, menuProduct, menuProductHref } from "../src/data/menu.ts";
import { orderProducts, quoteCart, whatsappLink } from "../src/lib/order.ts";
import { readFileSync } from "node:fs";

test("every menu item has a unique detail URL and a demo product with exact cents", () => {
  const ids = new Set();
  for (const item of MENU_ITEMS) {
    const product = menuProduct(item);
    assert.ok(!ids.has(product.id));
    ids.add(product.id);
    assert.equal(menuProductHref(item), `/productos/${product.slug}`);
    assert.equal(product.variants[0].price, item.priceNum * 100);
    assert.equal(product.description, item.description);
    assert.equal(product.isDemo, true);
    assert.equal(product.image, item.image);
  }
});

test("menu and catalog products share one cart and retain item details in WhatsApp", () => {
  const content = JSON.parse(
    readFileSync(new URL("../content/demo.json", import.meta.url)),
  );
  const product = menuProduct(MENU_ITEMS[0]);
  content.menuProducts = [product];
  const lines = [
    { productId: product.id, variantId: product.variants[0].id, quantity: 2 },
  ];
  const quote = quoteCart(lines, orderProducts(content));
  assert.deepEqual(quote.missing, []);
  assert.equal(quote.subtotal, MENU_ITEMS[0].priceNum * 200);
  const message = decodeURIComponent(
    whatsappLink(
      content,
      {
        name: "Demo",
        method: "pickup",
        branchId: content.branches[0].id,
        requestedDate: "2026-10-24",
        requestedTime: "12:00",
        address: "",
        notes: "",
      },
      lines,
    ),
  );
  assert.ok(message.includes(product.name));
});
