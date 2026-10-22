import type {
  Product,
  CartLine,
  Content,
  OrderDetails,
  Branch,
} from "./types.ts";

export function money(value: number | null, currency = "ARS") {
  return value === null
    ? "A confirmar"
    : new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value / 100);
}
export function orderProducts(content: Content): Product[] {
  return [...content.products, ...(content.menuProducts || [])];
}
export function quoteCart(lines: CartLine[], products: Product[]) {
  const missing: string[] = [],
    blocked: string[] = [];
  const items = lines.flatMap((line) => {
    const product = products.find((p) => p.id === line.productId && p.active);
    const variant = product?.variants.find((v) => v.id === line.variantId);
    if (!product || !variant) {
      missing.push(line.productId);
      return [];
    }
    if (product.availability === "soldOut" || !variant.available)
      blocked.push(product.name);
    const quantity = Math.max(
      1,
      Math.min(99, Math.floor(Number(line.quantity) || 1)),
    );
    return [
      {
        product,
        variant,
        quantity,
        unitPrice: variant.price,
        totalPrice: variant.price === null ? null : variant.price * quantity,
      },
    ];
  });
  return {
    items,
    missing,
    blocked,
    subtotal: items.some((i) => i.totalPrice === null)
      ? null
      : items.reduce((sum, i) => sum + (i.totalPrice || 0), 0),
    leadTimeHours: Math.max(
      0,
      ...items.map((i) => i.product.leadTimeHours || 0),
    ),
  };
}
export function dateInZone(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}
function zonedTimestamp(date: string, time: string, timeZone: string) {
  const requested = Date.parse(`${date}T${time}:00Z`);
  if (!Number.isFinite(requested)) return NaN;
  let guess = requested;
  for (let i = 0; i < 3; i++) {
    const local = dateInZone(new Date(guess), timeZone);
    const wall = Date.parse(`${local.date}T${local.time}:00Z`);
    guess += requested - wall;
  }
  const verified = dateInZone(new Date(guess), timeZone);
  return verified.date === date && verified.time === time ? guess : NaN;
}
export function validateOrder(
  details: OrderDetails,
  content: Content,
  lines: CartLine[],
  now = new Date(),
) {
  const errors: string[] = [];
  const quote = quoteCart(lines, orderProducts(content));
  const branch = content.branches.find(
    (b) => b.id === details.branchId && b.active,
  );
  if (!quote.items.length) errors.push("Agregá al menos un producto.");
  if (quote.missing.length)
    errors.push(
      "Un producto ya no está disponible en el catálogo. Quitalo de la lista.",
    );
  if (quote.blocked.length)
    errors.push(`Estos productos están agotados: ${quote.blocked.join(", ")}.`);
  if (!details.name.trim()) errors.push("Escribí tu nombre.");
  if (!branch) errors.push("Elegí una sucursal.");
  if (
    details.method === "pickup" &&
    (!content.settings.pickupEnabled || !branch?.pickupEnabled)
  )
    errors.push("El retiro no está disponible en esta sucursal.");
  if (
    details.method === "delivery" &&
    (!content.settings.deliveryEnabled || !branch?.deliveryEnabled)
  )
    errors.push("La entrega no está disponible en esta sucursal.");
  if (details.method === "delivery" && !details.address.trim())
    errors.push("Escribí la dirección de entrega.");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(details.requestedDate) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(details.requestedTime)
  )
    errors.push("Elegí una fecha y una hora.");
  else {
    const stamp = zonedTimestamp(
      details.requestedDate,
      details.requestedTime,
      content.settings.timezone,
    );
    const lead = Math.max(
      ...quote.items.map(
        (i) =>
          i.product.leadTimeHours ?? content.settings.defaultLeadTimeHours ?? 0,
      ),
      0,
    );
    if (!Number.isFinite(stamp))
      errors.push("La fecha o la hora no son válidas.");
    else if (stamp < now.getTime() + lead * 3600000)
      errors.push(
        lead
          ? `Este pedido necesita al menos ${lead} horas de anticipación.`
          : "Elegí una fecha y una hora futuras.",
      );
    const day = new Date(`${details.requestedDate}T12:00:00Z`).getUTCDay();
    const hours = branch?.openingHours.find((h) => h.day === day);
    if (branch?.openingHours.length && (!hours || hours.closed))
      errors.push("La sucursal está cerrada ese día. Elegí otra fecha.");
    else if (
      hours &&
      (details.requestedTime < hours.open ||
        details.requestedTime >= hours.close)
    )
      errors.push(`Elegí un horario entre ${hours.open} y ${hours.close}.`);
    if (content.settings.closedDates.includes(details.requestedDate))
      errors.push("No tomamos pedidos para esa fecha.");
  }
  if (
    content.settings.minimumOrder !== null &&
    quote.subtotal !== null &&
    quote.subtotal < content.settings.minimumOrder
  )
    errors.push(
      `El pedido mínimo es ${money(content.settings.minimumOrder, content.settings.currency)}.`,
    );
  return { errors, quote, branch };
}
export function whatsappLink(
  content: Content,
  details: OrderDetails,
  lines: CartLine[],
) {
  const branch = content.branches.find((b) => b.id === details.branchId) as
    Branch | undefined;
  const number = (branch?.whatsapp || content.settings.whatsapp).replace(
    /\D/g,
    "",
  );
  if (!/^\d{8,15}$/.test(number))
    throw new Error("Todavía no se configuró el WhatsApp de esta sucursal.");
  const quote = quoteCart(lines, orderProducts(content));
  const fee =
    details.method === "delivery"
      ? (branch?.deliveryFee ?? content.settings.deliveryFee)
      : 0;
  const final =
    quote.subtotal === null || fee === null ? null : quote.subtotal + fee;
  const parts = [
    `¡Hola ${content.settings.name}! Quiero consultar este pedido${content.home.previewMode ? " DE PRUEBA" : ""}:`,
    "",
    ...quote.items.map(
      (i) =>
        `• ${i.quantity} × ${i.product.name}${i.variant.name !== "Presentación estándar" ? " — " + i.variant.name : ""} · ${money(i.totalPrice, content.settings.currency)}`,
    ),
    "",
    `Productos: ${money(quote.subtotal, content.settings.currency)}`,
    ...(details.method === "delivery"
      ? [`Entrega: ${money(fee, content.settings.currency)}`]
      : []),
    `Total estimado: ${money(final, content.settings.currency)}`,
    "",
    `Nombre: ${details.name.trim()}`,
    `Sucursal: ${branch?.name || ""}`,
    `Modalidad: ${details.method === "pickup" ? "Retiro en el local" : "Entrega a domicilio"}`,
    `Fecha solicitada: ${details.requestedDate.split("-").reverse().join("/")} a las ${details.requestedTime}`,
    ...(details.method === "delivery"
      ? [`Dirección: ${details.address.trim()}`]
      : []),
    ...(details.notes.trim() ? [`Notas: ${details.notes.trim()}`] : []),
    "",
    content.settings.orderNotice,
  ];
  return `https://wa.me/${number}?text=${encodeURIComponent(parts.join("\n"))}`;
}
