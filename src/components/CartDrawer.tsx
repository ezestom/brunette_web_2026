import { useEffect, useRef, useState } from "react";
import type { Content, OrderDetails } from "../lib/types";
import { useCart, setQuantity } from "../lib/cart-store";
import {
  quoteCart,
  orderProducts,
  money,
  dateInZone,
  validateOrder,
  whatsappLink,
} from "../lib/order";
import { BagIcon, CloseIcon, ArrowIcon } from "./Icons";
import { syncDialogScroll } from "../lib/dialog-scroll";
import WhatsAppMessage from "./WhatsAppMessage";

export default function CartDrawer({ content }: { content: Content }) {
  const lines = useCart(),
    dialog = useRef<HTMLDialogElement>(null);
  const [current, setCurrent] = useState(content),
    [errors, setErrors] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [prepared, setPrepared] = useState("");
  const [details, setDetails] = useState<OrderDetails>({
    name: "",
    branchId: content.branches[0]?.id || "",
    method: "pickup",
    requestedDate: "",
    requestedTime: "",
    address: "",
    notes: "",
  });
  const quote = quoteCart(lines, orderProducts(current)),
    branch = current.branches.find((b) => b.id === details.branchId);
  const count = lines.reduce((sum, i) => sum + i.quantity, 0);
  const currency = current.settings.currency;
  const fee =
    details.method === "delivery"
      ? (branch?.deliveryFee ?? current.settings.deliveryFee)
      : 0;
  const total =
    quote.subtotal === null || fee === null ? null : quote.subtotal + fee;
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  function open() {
    clearTimeout(closeTimer.current);
    dialog.current?.classList.remove("closing");
    dialog.current?.showModal();
    syncDialogScroll();
    document.dispatchEvent(
      new CustomEvent("brunette:drawer", { detail: { open: true } }),
    );
  }
  function close() {
    if (!dialog.current?.open) return;
    dialog.current.classList.add("closing");
    closeTimer.current = setTimeout(
      () => {
        dialog.current?.close();
        dialog.current?.classList.remove("closing");
      },
      matchMedia("(prefers-reduced-motion:reduce)").matches ? 0 : 800,
    );
  }
  useEffect(() => () => clearTimeout(closeTimer.current), []);
  useEffect(() => {
    const el = dialog.current;
    const closed = () => {
      syncDialogScroll();
      document.dispatchEvent(
        new CustomEvent("brunette:drawer", { detail: { open: false } }),
      );
    };
    el?.addEventListener("close", closed);
    return () => el?.removeEventListener("close", closed);
  }, []);
  useEffect(() => {
    window.addEventListener("brunette:cart-open", open);
    return () => window.removeEventListener("brunette:cart-open", open);
  }, []);
  useEffect(() => {
    setPrepared("");
  }, [lines, details]);
  function field<K extends keyof OrderDetails>(key: K, value: OrderDetails[K]) {
    setDetails((d) => ({ ...d, [key]: value }));
  }
  async function prepare(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors([]);
    setPrepared("");
    setBusy(true);
    try {
      const response = await fetch("/api/catalog", { cache: "no-store" });
      if (!response.ok)
        throw new Error(
          "No pudimos comprobar la disponibilidad. Intentá otra vez.",
        );
      const fresh: Content = await response.json();
      const previous = quoteCart(lines, orderProducts(current)),
        updated = quoteCart(lines, orderProducts(fresh));
      setCurrent(fresh);
      const validation = validateOrder(details, fresh, lines);
      if (validation.errors.length) {
        setErrors(validation.errors);
        return;
      }
      const updatedFee =
        details.method === "delivery"
          ? (validation.branch?.deliveryFee ?? fresh.settings.deliveryFee)
          : 0;
      if (previous.subtotal !== updated.subtotal || fee !== updatedFee) {
        setErrors([
          "Hubo una actualización de precios. Revisá el nuevo total y volvé a continuar.",
        ]);
        return;
      }
      setPrepared(whatsappLink(fresh, details, lines));
    } catch (error) {
      setErrors([
        error instanceof Error
          ? error.message
          : "No pudimos preparar la consulta.",
      ]);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        className="header-cart"
        onClick={open}
        aria-label={`Abrir mi pedido, ${count} productos`}
      >
        <BagIcon />
        {count > 0 && <span className="cart-count">{count}</span>}
      </button>
      <dialog
        ref={dialog}
        className="cart-dialog"
        data-lenis-prevent=""
        aria-labelledby="cart-title"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          if (e.target === dialog.current) close();
        }}
      >
        <div className="drawer-header">
          <div>
            <p className="eyebrow">Un buen plan</p>
            <h2 id="cart-title">
              Tu pedido<span>({count})</span>
            </h2>
          </div>
          <button
            className="icon-button"
            aria-label="Cerrar pedido"
            onClick={close}
          >
            <CloseIcon />
          </button>
        </div>
        <div className="drawer-scroll" data-lenis-prevent>
          {!lines.length ? (
            <div className="empty-state">
              <span className="empty-star">✳</span>
              <h3>Todavía hay lugar para un antojo.</h3>
              <p>Elegí tus favoritos de la carta y coordinamos por WhatsApp.</p>
              <button
                className="pill primary"
                onClick={() => {
                  dialog.current?.close();
                  location.href = "/carta";
                }}
              >
                Explorar la carta
                <ArrowIcon />
              </button>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {quote.items.map(
                  ({ product, variant, quantity, totalPrice }) => (
                    <div className="cart-line" key={product.id + variant.id}>
                      <a href={"/productos/" + product.slug}>
                        <img
                          src={product.image}
                          alt={product.name}
                          width="100"
                          height="125"
                        />
                      </a>
                      <div>
                        <h3>{product.name}</h3>
                        <p>
                          {variant.name !== "Presentación estándar"
                            ? variant.name
                            : ""}
                        </p>
                        <strong>{money(totalPrice, currency)}</strong>
                        <div className="cart-line-controls">
                          <div className="quantity-control small">
                            <button
                              aria-label={
                                "Quitar una unidad de " + product.name
                              }
                              onClick={() =>
                                setQuantity(
                                  product.id,
                                  variant.id,
                                  quantity - 1,
                                )
                              }
                            >
                              −
                            </button>
                            <output>{quantity}</output>
                            <button
                              aria-label={"Sumar una unidad de " + product.name}
                              onClick={() =>
                                setQuantity(
                                  product.id,
                                  variant.id,
                                  quantity + 1,
                                )
                              }
                            >
                              +
                            </button>
                          </div>
                          <button
                            className="text-button"
                            onClick={() =>
                              setQuantity(product.id, variant.id, 0)
                            }
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
              {!!quote.missing.length && (
                <div className="form-alert">
                  Hay productos que ya no están en el catálogo.{" "}
                  <button
                    type="button"
                    className="text-button"
                    onClick={() =>
                      lines
                        .filter((i) => quote.missing.includes(i.productId))
                        .forEach((i) =>
                          setQuantity(i.productId, i.variantId, 0),
                        )
                    }
                  >
                    Quitarlos del pedido
                  </button>
                </div>
              )}
              <form onSubmit={prepare} className="checkout-form">
                <div className="form-section-heading">
                  <span>01</span>
                  <h3>¿Dónde lo coordinamos?</h3>
                </div>
                <label>
                  Sucursal
                  <select
                    value={details.branchId}
                    onChange={(e) => field("branchId", e.target.value)}
                    required
                  >
                    {current.branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} · {b.address}
                      </option>
                    ))}
                  </select>
                  <small>
                    {branch?.address}
                    {branch?.isDemo ? " · Horarios de prueba" : ""}
                  </small>
                </label>
                <div
                  className="method-tabs"
                  role="group"
                  aria-label="Modalidad del pedido"
                >
                  {current.settings.pickupEnabled && branch?.pickupEnabled && (
                    <button
                      type="button"
                      className={details.method === "pickup" ? "selected" : ""}
                      onClick={() => field("method", "pickup")}
                    >
                      Retiro en local
                    </button>
                  )}
                  {current.settings.deliveryEnabled &&
                    branch?.deliveryEnabled && (
                      <button
                        type="button"
                        className={
                          details.method === "delivery" ? "selected" : ""
                        }
                        onClick={() => field("method", "delivery")}
                      >
                        Entrega a domicilio
                      </button>
                    )}
                </div>
                {details.method === "delivery" && (
                  <>
                    <label>
                      Dirección de entrega
                      <input
                        value={details.address}
                        onChange={(e) => field("address", e.target.value)}
                        autoComplete="street-address"
                        maxLength={250}
                        required
                        placeholder="Calle, número y departamento"
                      />
                    </label>
                    <p className="field-help">
                      {branch?.deliveryZone ||
                        current.settings.deliveryZone ||
                        "Confirmaremos por WhatsApp si llegamos a tu dirección."}
                    </p>
                  </>
                )}
                <div className="form-section-heading">
                  <span>02</span>
                  <h3>Un día y una hora</h3>
                </div>
                <div className="form-two">
                  <label>
                    Fecha solicitada
                    <input
                      type="date"
                      required
                      min={
                        dateInZone(new Date(), current.settings.timezone).date
                      }
                      value={details.requestedDate}
                      onChange={(e) => field("requestedDate", e.target.value)}
                    />
                  </label>
                  <label>
                    Hora solicitada
                    <input
                      type="time"
                      required
                      value={details.requestedTime}
                      onChange={(e) => field("requestedTime", e.target.value)}
                    />
                  </label>
                </div>
                <p className="field-help">
                  {quote.leadTimeHours
                    ? `Este pedido incluye preparaciones con ${quote.leadTimeHours} horas de anticipación.`
                    : "Los productos del día están sujetos a disponibilidad."}{" "}
                  El horario queda pendiente de confirmación.
                </p>
                <div className="form-section-heading">
                  <span>03</span>
                  <h3>Los últimos detalles</h3>
                </div>
                <label>
                  Tu nombre
                  <input
                    value={details.name}
                    onChange={(e) => field("name", e.target.value)}
                    autoComplete="given-name"
                    required
                    maxLength={100}
                    placeholder="¿Cómo te llamás?"
                  />
                </label>
                <label>
                  ¿Algo que debamos saber?{" "}
                  <span className="optional">Opcional</span>
                  <textarea
                    value={details.notes}
                    onChange={(e) => field("notes", e.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder="Ocasión especial, consultas o indicaciones…"
                  />
                </label>
                <div className="cart-totals">
                  <p>
                    <span>Productos</span>
                    <span>{money(quote.subtotal, currency)}</span>
                  </p>
                  {details.method === "delivery" && (
                    <p>
                      <span>Entrega</span>
                      <span>{money(fee, currency)}</span>
                    </p>
                  )}
                  <p className="grand-total">
                    <span>Total estimado</span>
                    <span>{money(total, currency)}</span>
                  </p>
                </div>
                {!!errors.length && (
                  <div className="form-alert" role="alert">
                    <ul>
                      {errors.map((error) => (
                        <li key={error}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {prepared ? (
                  <WhatsAppMessage
                    url={prepared}
                    title="Tu pedido está listo."
                    linkText="Abrir WhatsApp para enviar el pedido"
                  />
                ) : (
                  <button
                    className="pill primary full"
                    type="submit"
                    disabled={busy}
                  >
                    {busy
                      ? "Comprobando disponibilidad…"
                      : "Preparar consulta por WhatsApp"}
                    <ArrowIcon />
                  </button>
                )}
                <p className="checkout-note">{current.settings.orderNotice}</p>
              </form>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
