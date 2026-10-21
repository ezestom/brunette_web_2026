import { useState } from "react";
import type { Product, Category } from "../lib/types";
import { money } from "../lib/order";
import { addToCart } from "../lib/cart-store";
import { ArrowIcon } from "./Icons";
export default function Catalog({
  products,
  categories,
  currency,
  initialCategory = "all",
}: {
  products: Product[];
  categories: Category[];
  currency: string;
  initialCategory?: string;
}) {
  const [category, setCategory] = useState(initialCategory),
    [query, setQuery] = useState("");
  const visible = products.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      p.name.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es")),
  );
  return (
    <div className="catalog-shell">
      <div className="catalog-tools">
        <div
          className="filter-pills"
          role="group"
          aria-label="Filtrar por categoría"
        >
          <button
            className={category === "all" ? "selected" : ""}
            onClick={() => setCategory("all")}
          >
            Todos los antojos
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={category === c.id ? "selected" : ""}
              onClick={() => setCategory(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
        <label className="search-field">
          <span className="sr-only">Buscar productos</span>
          <input
            type="search"
            placeholder="¿Qué se te antoja?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span aria-hidden="true">⌕</span>
        </label>
      </div>
      <p className="result-count" aria-live="polite">
        {visible.length} antojos para elegir
      </p>
      <div className="product-grid">
        {visible.map((p) => (
          <article className="product-card" key={p.id}>
            <a className="product-photo" href={"/productos/" + p.slug}>
              <img
                src={p.image}
                alt={p.imageAlt || p.name}
                width="600"
                height="750"
                loading="lazy"
              />
              <span className="product-tag">
                {p.availability === "soldOut"
                  ? "Agotado"
                  : p.fulfillment === "preorder"
                    ? "Por encargo"
                    : "Del mostrador"}
              </span>
              <span className="photo-arrow">
                <ArrowIcon />
              </span>
            </a>
            <div className="product-info">
              <a href={"/productos/" + p.slug}>
                <h3>{p.name}</h3>
              </a>
              <p>
                {p.variants.length > 1 ? "Desde " : ""}
                {money(p.variants[0]?.price ?? null, currency)}
              </p>
            </div>
            <div className="product-bottom">
              <span>
                {p.fulfillment === "preorder"
                  ? p.leadTimeHours
                    ? `${p.leadTimeHours} h de anticipación`
                    : "Anticipación a confirmar"
                  : "Consultá disponibilidad"}
              </span>
              {p.variants.length > 1 ? (
                <a
                  href={"/productos/" + p.slug}
                  className="round-action"
                  aria-label={"Elegir " + p.name}
                >
                  <ArrowIcon />
                </a>
              ) : (
                <button
                  className="round-action"
                  disabled={
                    p.availability === "soldOut" || !p.variants[0]?.available
                  }
                  aria-label={"Agregar " + p.name}
                  onClick={() => addToCart(p.id, p.variants[0].id)}
                >
                  +
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      {!visible.length && (
        <div className="empty-state">
          <h3>No encontramos ese antojo.</h3>
          <p>Probá con otro nombre o elegí otra categoría.</p>
          <button
            className="pill"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
          >
            Ver todo
          </button>
        </div>
      )}
    </div>
  );
}
