import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  quoteCart,
  validateOrder,
  whatsappLink,
  money,
} from "../src/lib/order.ts";
const seed = JSON.parse(
  readFileSync(new URL("../content/demo.json", import.meta.url), "utf8"),
);
const now = new Date("2026-10-20T13:00:00Z");
const product = seed.products.find(
  (p) => p.fulfillment === "ready" && p.availability === "available",
);
const lines = [
  { productId: product.id, variantId: product.variants[0].id, quantity: 2 },
];
const details = {
  name: "Prueba",
  branchId: "cafe",
  method: "pickup",
  requestedDate: "2026-10-21",
  requestedTime: "12:00",
  address: "",
  notes: "",
};
test("calculates cents exactly and keeps unknown prices unknown", () => {
  const result = quoteCart(lines, seed.products);
  assert.equal(result.subtotal, product.variants[0].price * 2);
  const changed = structuredClone(seed);
  changed.products.find((p) => p.id === product.id).variants[0].price = null;
  assert.equal(quoteCart(lines, changed.products).subtotal, null);
  assert.match(money(123456, "ARS"), /1\.234,56/);
});
test("requires the active branch, current availability and valid hours", () => {
  assert.deepEqual(validateOrder(details, seed, lines, now).errors, []);
  assert.ok(
    validateOrder(
      { ...details, requestedDate: "2026-10-25" },
      seed,
      lines,
      now,
    ).errors.some((e) => e.includes("cerrada")),
  );
  assert.ok(
    validateOrder(
      { ...details, requestedTime: "20:00" },
      seed,
      lines,
      now,
    ).errors.some((e) => e.includes("horario")),
  );
  const changed = structuredClone(seed);
  changed.products.find((p) => p.id === product.id).availability = "soldOut";
  assert.ok(
    validateOrder(details, changed, lines, now).errors.some((e) =>
      e.includes("agotados"),
    ),
  );
  assert.ok(
    validateOrder(
      { ...details, branchId: "missing" },
      seed,
      lines,
      now,
    ).errors.some((e) => e.includes("sucursal")),
  );
});
test("checks lead time in business timezone rather than the server timezone", () => {
  const changed = structuredClone(seed);
  changed.products.find((p) => p.id === product.id).leadTimeHours = 48;
  assert.ok(
    validateOrder(details, changed, lines, now).errors.some((e) =>
      e.includes("48 horas"),
    ),
  );
  assert.deepEqual(
    validateOrder(
      { ...details, requestedDate: "2026-10-22" },
      changed,
      lines,
      now,
    ).errors,
    [],
  );
  assert.ok(
    validateOrder(
      { ...details, requestedDate: "2026-02-31" },
      seed,
      lines,
      now,
    ).errors.some((e) => e.includes("válidas")),
  );
});
test("delivery requires an address and respects the branch fee", () => {
  assert.ok(
    validateOrder(
      { ...details, method: "delivery" },
      seed,
      lines,
      now,
    ).errors.some((e) => e.includes("dirección")),
  );
  const changed = structuredClone(seed);
  changed.branches[0].deliveryFee = 150000;
  changed.branches[0].whatsapp = "5491100000000";
  const url = new URL(
    whatsappLink(
      changed,
      { ...details, method: "delivery", address: "Dirección de prueba" },
      lines,
    ),
  );
  assert.equal(url.hostname, "wa.me");
  assert.equal(url.pathname, "/5491100000000");
  const message = url.searchParams.get("text");
  assert.match(message, /Dirección de prueba/);
  assert.match(message, /Café Brunette/);
  assert.match(message, /DE PRUEBA/);
  assert.match(message, /no reserva/);
});
