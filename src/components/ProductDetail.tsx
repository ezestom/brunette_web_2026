import { useEffect, useRef, useState } from "react";
import type { Product } from "../lib/types";
import { money } from "../lib/order";
import { addToCart } from "../lib/cart-store";
export default function ProductDetail({
  product,
  currency,
  formatLabel,
}: {
  product: Product;
  currency: string;
  formatLabel?: string;
}) {
  const [selected, setSelected] = useState(product.variants[0].id),
    [quantity, setQuantityState] = useState(1),
    [photo, setPhoto] = useState(product.image),
    [previous, setPrevious] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    busy = useRef(false);
  const variant = product.variants.find((v) => v.id === selected)!;
  const disabled = product.availability === "soldOut" || !variant.available;
  const photos = [...new Set([product.image, ...product.gallery])].filter(
    Boolean,
  );
  useEffect(() => () => clearTimeout(timer.current), []);
  function changePhoto(src: string) {
    if (busy.current || src === photo) return;
    const reduced = matchMedia("(prefers-reduced-motion:reduce)").matches;
    busy.current = true;
    setPrevious(photo);
    setPhoto(src);
    timer.current = setTimeout(
      () => {
        setPrevious("");
        busy.current = false;
      },
      reduced ? 0 : 1010,
    );
  }
  function ripple(e: React.MouseEvent<HTMLElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - box.left}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - box.top}px`);
  }
  return (
    <div className="Product_Top">
      <div className="Product_Media" data-react-gallery>
        <div className="Product_Main_Media Fluid">
          {photos.map((src) => (
            <div
              key={src}
              className={
                "Main_Image Fluid" +
                (src === photo || src === previous ? " Active" : "") +
                (src === previous ? " Deactive" : "")
              }
            >
              <img
                src={src}
                alt={product.imageAlt || product.name}
                width="900"
                height="1125"
                fetchPriority={src === product.image ? "high" : undefined}
              />
            </div>
          ))}
        </div>
        {photos.length > 1 && (
          <div className="Product_Other_Media">
            {photos.map((src, i) => (
              <button
                key={src}
                type="button"
                className={
                  "Additional_Image Fluid" + (photo === src ? " Active" : "")
                }
                onClick={() => changePhoto(src)}
                aria-label={"Ver foto " + (i + 1)}
                aria-pressed={photo === src}
              >
                <img src={src} alt="" width="100" height="125" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="Product_Infos">
        <div className="Wrapper">
          <h1 className="Product_Title">{product.name}</h1>
          <p className="Product_Format">
            {formatLabel ||
              (product.fulfillment === "preorder"
                ? "Hecho para tu ocasión"
                : "Del mostrador")}
          </p>
          <div className="Product_Form">
            <fieldset className="variant-options">
              {product.variants.length > 1 && (
                <>
                  <legend>Elegí tu presentación</legend>
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      aria-pressed={selected === v.id}
                      disabled={!v.available}
                      className={selected === v.id ? "selected" : ""}
                      onClick={() => setSelected(v.id)}
                    >
                      {v.name}
                      <span>{money(v.price, currency)}</span>
                    </button>
                  ))}
                </>
              )}
            </fieldset>
            <div className="Product_Form_Top">
              <span className="Product_Form_Label">Cantidad</span>
              <div className="Quantity_Selector">
                <button
                  type="button"
                  className="Minus_Button Quantity_Selector_Button"
                  onClick={() => setQuantityState(Math.max(1, quantity - 1))}
                  aria-label="Reducir cantidad"
                >
                  <span>−</span>
                </button>
                <output aria-live="polite" className="reference-quantity">
                  {quantity}
                </output>
                <button
                  type="button"
                  className="Plus_Button Quantity_Selector_Button"
                  onClick={() => setQuantityState(Math.min(99, quantity + 1))}
                  aria-label="Aumentar cantidad"
                >
                  <span>+</span>
                </button>
              </div>
            </div>
            <div className="Product_Form_Bottom">
              <span className="Product_Form_Price">
                {money(
                  variant.price === null ? null : variant.price * quantity,
                  currency,
                )}
              </span>
              <div
                className="Product_Item_Submit_Container Relative_To_Mouse"
                onMouseEnter={ripple}
                onMouseLeave={ripple}
              >
                <button
                  type="button"
                  className="Product_Item_Submit"
                  disabled={disabled}
                  onClick={() => addToCart(product.id, variant.id, quantity)}
                >
                  {disabled ? "Por ahora, agotado" : "Agregar a mi pedido"}
                </button>
              </div>
            </div>
          </div>
          {!!product.ingredients?.length && (
            <div className="Product_Ingredients">
              {product.ingredients.map((label) => (
                <span className="Ingredient_Pill" key={label}>
                  {label}
                </span>
              ))}
            </div>
          )}
          <div className="Product_Description">
            <p>{product.description}</p>
          </div>
          {product.isDemo && (
            <p className="sample-note">
              Producto, foto y precio de prueba. Pendientes de reemplazar por el
              catálogo real.
            </p>
          )}
          <div className="detail-facts">
            <p>↗ Retiro en sucursal o entrega a coordinar</p>
            <p>
              ◷{" "}
              {product.leadTimeHours
                ? `Pedilo con ${product.leadTimeHours} horas de anticipación`
                : "Disponibilidad a confirmar por WhatsApp"}
            </p>
            <p>
              ✳{" "}
              {product.allergens.length
                ? "Alérgenos informados: " + product.allergens.join(", ")
                : "Consultanos por ingredientes y alérgenos antes de pedir."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
