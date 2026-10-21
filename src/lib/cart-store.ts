import { useSyncExternalStore } from "react";
import type { CartLine } from "./types";
const KEY = "brunette-cart-v1";
const empty: CartLine[] = [];
let items: CartLine[] = empty,
  ready = false;
const listeners = new Set<() => void>();
function initialize() {
  if (ready || typeof window === "undefined") return;
  ready = true;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (Array.isArray(saved))
      items = saved
        .filter(
          (i) =>
            typeof i.productId === "string" &&
            typeof i.variantId === "string" &&
            Number.isInteger(i.quantity) &&
            i.quantity > 0 &&
            i.quantity <= 99,
        )
        .slice(0, 100);
  } catch {}
}
function emit() {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
  listeners.forEach((fn) => fn());
}
function subscribe(fn: () => void) {
  initialize();
  listeners.add(fn);
  const sync = (e: StorageEvent) => {
    if (e.key === KEY) {
      ready = false;
      initialize();
      listeners.forEach((f) => f());
    }
  };
  window.addEventListener("storage", sync);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", sync);
  };
}
export function useCart() {
  return useSyncExternalStore(
    subscribe,
    () => {
      initialize();
      return items;
    },
    () => empty,
  );
}
export function addToCart(productId: string, variantId: string, quantity = 1) {
  initialize();
  const existing = items.find(
    (i) => i.productId === productId && i.variantId === variantId,
  );
  items = existing
    ? items.map((i) =>
        i === existing
          ? { ...i, quantity: Math.min(99, i.quantity + quantity) }
          : i,
      )
    : [
        ...items,
        { productId, variantId, quantity: Math.max(1, Math.min(99, quantity)) },
      ];
  emit();
  window.dispatchEvent(new Event("brunette:cart-open"));
}
export function setQuantity(
  productId: string,
  variantId: string,
  quantity: number,
) {
  initialize();
  items =
    quantity <= 0
      ? items.filter(
          (i) => i.productId !== productId || i.variantId !== variantId,
        )
      : items.map((i) =>
          i.productId === productId && i.variantId === variantId
            ? {
                ...i,
                quantity: Math.min(99, Math.max(1, Math.floor(quantity) || 1)),
              }
            : i,
        );
  emit();
}
export function clearCart() {
  items = [];
  emit();
}
