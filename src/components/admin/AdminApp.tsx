import { useEffect, useState } from "react";
import type { Content, Product, Branch, Category } from "../../lib/types";
import {
  ProductEditor,
  HomeEditor,
  BusinessEditor,
  BranchEditor,
  CategoryEditor,
} from "./ContentEditors";
import { money } from "../../lib/order";
type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor";
  active: boolean;
};
type Tab =
  | "Resumen"
  | "Productos"
  | "Categorías"
  | "Portada"
  | "Sucursales"
  | "Configuración"
  | "Historial"
  | "Usuarios"
  | "Ayuda";
const tabs: Tab[] = [
  "Resumen",
  "Productos",
  "Categorías",
  "Portada",
  "Sucursales",
  "Configuración",
  "Historial",
  "Usuarios",
  "Ayuda",
];
const symbols = ["◫", "◉", "▦", "▧", "⌖", "⚙", "◷", "♙", "?"];
export default function AdminApp({
  initialUser,
}: {
  initialUser: User | null;
}) {
  const [user, setUser] = useState(initialUser),
    [draft, setDraft] = useState<Content | null>(null),
    [published, setPublished] = useState("");
  const [tab, setTab] = useState<Tab>("Resumen"),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [confirmPublish, setConfirmPublish] = useState(false);
  const [productId, setProductId] = useState(""),
    [branchId, setBranchId] = useState(""),
    [categoryId, setCategoryId] = useState(""),
    [query, setQuery] = useState("");
  async function api(path: string, options: RequestInit = {}) {
    const response = await fetch("/api/" + path, {
      ...options,
      headers: {
        ...(typeof options.body === "string"
          ? { "Content-Type": "application/json" }
          : {}),
        ...options.headers,
      },
    });
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 401 && path !== "auth/login") setUser(null);
      throw new Error(result.error || "No se pudo completar la acción.");
    }
    return result;
  }
  async function load() {
    setError("");
    try {
      const result = await api("admin/content");
      setDraft(result.draft);
      setPublished(result.publishedRevision);
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el panel.");
    }
  }
  useEffect(() => {
    if (user) void load();
  }, [user?.id]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function change(content: Content) {
    setDraft(content);
    setDirty(true);
    setMessage("");
    setPreparedOff();
  }
  function setPreparedOff() {
    setConfirmPublish(false);
  }
  async function save() {
    if (!draft) return null;
    const result = await api("admin/content", {
      method: "PUT",
      body: JSON.stringify({
        content: draft,
        expectedRevision: draft.revision,
      }),
    });
    setDraft(result.draft);
    setDirty(false);
    return result.draft as Content;
  }
  async function handleSave() {
    setBusy(true);
    setError("");
    try {
      await save();
      setMessage(
        "Borrador guardado. Para verlo en la web, publicá los cambios.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }
  async function handlePublish() {
    setBusy(true);
    setError("");
    try {
      const content = dirty ? await save() : draft;
      if (!content) return;
      const result = await api("admin/publish", {
        method: "POST",
        body: JSON.stringify({ expectedRevision: content.revision }),
      });
      setPublished(result.content.revision);
      setConfirmPublish(false);
      setMessage("Cambios publicados. Ya se ven en la web.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo publicar.");
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    if (
      dirty &&
      !confirm("Tenés cambios sin guardar. ¿Querés salir igualmente?")
    )
      return;
    await api("auth/logout", { method: "POST" });
    setUser(null);
    setDraft(null);
    setDirty(false);
  }
  function patchProduct(p: Product) {
    if (draft)
      change({
        ...draft,
        products: draft.products.map((x) => (x.id === p.id ? p : x)),
      });
  }
  function addProduct() {
    if (!draft) return;
    const id = crypto.randomUUID();
    const p: Product = {
      id,
      name: "Nuevo antojo",
      slug: "antojo-" + id.slice(0, 8),
      description: "",
      category: draft.categories[0].id,
      image: "",
      imageAlt: "",
      gallery: [],
      availability: "onRequest",
      fulfillment: "ready",
      leadTimeHours: null,
      featured: false,
      active: false,
      isDemo: false,
      allergens: [],
      variants: [
        {
          id: crypto.randomUUID(),
          name: "Presentación estándar",
          price: null,
          available: true,
        },
      ],
      order: draft.products.length,
    };
    change({ ...draft, products: [...draft.products, p] });
    setProductId(id);
  }
  function addBranch() {
    if (!draft) return;
    const id = crypto.randomUUID();
    const branch: Branch = {
      id,
      name: "Nueva sucursal",
      address: "",
      whatsapp: "",
      mapUrl: "",
      openingHours: [],
      pickupEnabled: true,
      deliveryEnabled: false,
      deliveryZone: "",
      deliveryFee: null,
      active: false,
      isDemo: true,
    };
    change({ ...draft, branches: [...draft.branches, branch] });
    setBranchId(id);
  }
  function addCategory() {
    if (!draft) return;
    const id = "categoria-" + crypto.randomUUID().slice(0, 8);
    const c: Category = {
      id,
      name: "Nueva categoría",
      description: "",
      image: "",
      active: false,
    };
    change({ ...draft, categories: [...draft.categories, c] });
    setCategoryId(id);
  }
  if (!user)
    return (
      <Login
        error={error}
        onLogin={async (email, password) => {
          setError("");
          try {
            const result = await api("auth/login", {
              method: "POST",
              body: JSON.stringify({ email, password }),
            });
            setUser(result.user);
          } catch (e) {
            setError(e instanceof Error ? e.message : "No se pudo ingresar.");
          }
        }}
      />
    );
  const selectedProduct = draft?.products.find((p) => p.id === productId),
    selectedBranch = draft?.branches.find((b) => b.id === branchId),
    selectedCategory = draft?.categories.find((c) => c.id === categoryId);
  const pending = draft
    ? draft.products.filter((p) => p.active && p.isDemo).length +
      draft.branches.filter((b) => b.active && b.isDemo).length
    : 0;
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a href="/admin" className="admin-wordmark">
          brunette<span>El espacio del equipo</span>
        </a>
        <nav aria-label="Secciones del panel">
          {tabs
            .filter((t) => t !== "Usuarios" || user.role === "admin")
            .map((t) => (
              <button
                key={t}
                className={tab === t ? "active" : ""}
                onClick={() => {
                  setTab(t);
                  setMessage("");
                  setError("");
                }}
              >
                <span aria-hidden="true">{symbols[tabs.indexOf(t)]}</span>
                {t}
              </button>
            ))}
        </nav>
        <label className="admin-mobile-nav">
          <span>Sección del panel</span>
          <select
            value={tab}
            onChange={(e) => {
              setTab(e.target.value as Tab);
              setMessage("");
              setError("");
            }}
          >
            {tabs
              .filter((t) => t !== "Usuarios" || user.role === "admin")
              .map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
          </select>
        </label>
        <div className="sidebar-bottom">
          <a href="/" target="_blank" rel="noreferrer">
            Ver la web ↗
          </a>
          <div className="user-chip">
            <span>{user.name.charAt(0).toUpperCase()}</span>
            <div>
              <strong>{user.name}</strong>
              <small>
                {user.role === "admin"
                  ? "Administración"
                  : "Edición de contenido"}
              </small>
            </div>
          </div>
          <button onClick={signOut}>Cerrar sesión</button>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <p>Panel de contenidos</p>
            <h1>{tab}</h1>
          </div>
          <div className="admin-top-actions">
            <span className={"save-status " + (dirty ? "unsaved" : "")}>
              {dirty
                ? "● Sin guardar"
                : draft?.revision === published
                  ? "● Publicado"
                  : "● Borrador guardado"}
            </span>
            <button
              className="admin-button secondary"
              disabled={busy || !dirty}
              onClick={handleSave}
            >
              {busy ? "Un momento…" : "Guardar borrador"}
            </button>
            <button
              className="admin-button"
              disabled={
                busy || !draft || (!dirty && draft.revision === published)
              }
              onClick={() => setConfirmPublish(true)}
            >
              Publicar cambios ↗
            </button>
          </div>
        </header>
        <div className="admin-body">
          {message && (
            <div className="admin-success" role="status">
              {message}
              <a href="/" target="_blank" rel="noreferrer">
                Ver la web ↗
              </a>
            </div>
          )}
          {error && (
            <div className="admin-error-box" role="alert">
              <p>{error}</p>
              <button
                className="admin-text-button"
                onClick={() => {
                  if (
                    !dirty ||
                    confirm(
                      "Se perderán los cambios sin guardar. ¿Recargar el borrador?",
                    )
                  )
                    void load();
                }}
              >
                Recargar borrador
              </button>
            </div>
          )}
          {confirmPublish && (
            <div className="publish-confirm" role="alert">
              <h3>¿Publicamos estos cambios?</h3>
              <p>
                Se actualizarán los productos, precios y textos visibles en la
                web. La versión anterior quedará guardada en Historial.
              </p>
              <div>
                <button
                  className="admin-button"
                  onClick={handlePublish}
                  disabled={busy}
                >
                  {busy ? "Publicando…" : "Sí, guardar y publicar"}
                </button>
                <button
                  className="admin-button secondary"
                  onClick={() => setConfirmPublish(false)}
                  disabled={busy}
                >
                  Seguir revisando
                </button>
              </div>
            </div>
          )}
          {!draft ? (
            <div className="admin-loading">Preparando tu espacio…</div>
          ) : (
            <>
              {tab === "Resumen" && (
                <>
                  <div className="admin-welcome">
                    <p className="admin-eyebrow">Todo en su lugar</p>
                    <h2>
                      Hola, {user.name.split(" ")[0]}.<br />
                      ¿Qué se antoja hoy?
                    </h2>
                    <p>
                      Actualizá el mostrador, guardá tu borrador y publicá
                      cuando esté listo.
                    </p>
                    <span aria-hidden="true">✳</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3 mb-8">
                    <Stat
                      label="Productos visibles"
                      value={draft.products.filter((p) => p.active).length}
                      note="Listos para encontrar en la web"
                    />
                    <Stat
                      label="Agotados"
                      value={
                        draft.products.filter(
                          (p) => p.active && p.availability === "soldOut",
                        ).length
                      }
                      note="Se muestran, pero no se pueden pedir"
                    />
                    <Stat
                      label="Sucursales activas"
                      value={draft.branches.filter((b) => b.active).length}
                      note="Con horarios y condiciones propias"
                    />
                  </div>
                  <div className="admin-two">
                    <div className="editor-section">
                      <h3>Lo que podés hacer</h3>
                      <button
                        className="quick-action"
                        onClick={() => {
                          setTab("Productos");
                          setProductId(draft.products[0]?.id || "");
                        }}
                      >
                        Cambiar un precio<span aria-hidden="true">↗</span>
                      </button>
                      <button
                        className="quick-action"
                        onClick={() => setTab("Productos")}
                      >
                        Marcar un producto como agotado
                        <span aria-hidden="true">↗</span>
                      </button>
                      <button
                        className="quick-action"
                        onClick={() => setTab("Sucursales")}
                      >
                        Actualizar horarios<span aria-hidden="true">↗</span>
                      </button>
                      <button
                        className="quick-action"
                        onClick={() => setTab("Portada")}
                      >
                        Cambiar la foto de portada
                        <span aria-hidden="true">↗</span>
                      </button>
                    </div>
                    <div className="editor-section">
                      <h3>Antes de mostrarla al público</h3>
                      <p className="admin-help">
                        La web está{" "}
                        {draft.home.previewMode
                          ? "en modo de prueba"
                          : "fuera del modo de prueba"}
                        . Hay {pending} productos o sucursales activos con datos
                        de ejemplo.
                      </p>
                      <ol className="admin-checklist">
                        <li>
                          Reemplazá las fotos y descripciones de referencia.
                        </li>
                        <li>Confirmá precios y disponibilidad.</li>
                        <li>
                          Revisá horarios, zonas de entrega y teléfonos de cada
                          sucursal.
                        </li>
                        <li>
                          Quitá la marca de prueba de los datos revisados.
                        </li>
                        <li>
                          Desactivá el modo de prueba en Portada y publicá.
                        </li>
                      </ol>
                    </div>
                  </div>
                </>
              )}
              {tab === "Productos" && (
                <>
                  <div className="admin-section-intro">
                    <div>
                      <h2>El mostrador</h2>
                      <p>
                        Una sola ficha actualiza el precio y la información en
                        toda la web.
                      </p>
                    </div>
                    <button className="admin-button" onClick={addProduct}>
                      + Nuevo producto
                    </button>
                  </div>
                  <div className="admin-split">
                    <div className="admin-list">
                      <input
                        aria-label="Buscar en productos"
                        placeholder="Buscar un producto…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                      {draft.products
                        .filter((p) =>
                          p.name.toLowerCase().includes(query.toLowerCase()),
                        )
                        .map((p) => (
                          <button
                            key={p.id}
                            className={productId === p.id ? "selected" : ""}
                            onClick={() => setProductId(p.id)}
                          >
                            {p.image ? (
                              <img src={p.image} alt="" />
                            ) : (
                              <span className="list-placeholder">✳</span>
                            )}
                            <span>
                              <strong>{p.name}</strong>
                              <small>
                                {money(
                                  p.variants[0]?.price ?? null,
                                  draft.settings.currency,
                                )}{" "}
                                ·{" "}
                                {!p.active
                                  ? "Oculto"
                                  : p.availability === "soldOut"
                                    ? "Agotado"
                                    : p.isDemo
                                      ? "De prueba"
                                      : "Visible"}
                              </small>
                            </span>
                          </button>
                        ))}
                    </div>
                    <div>
                      {selectedProduct ? (
                        <ProductEditor
                          product={selectedProduct}
                          categories={draft.categories}
                          onChange={patchProduct}
                        />
                      ) : (
                        <EditorEmpty
                          title="Elegí un producto"
                          text="Seleccioná una ficha de la lista o agregá un nuevo antojo."
                        />
                      )}
                    </div>
                  </div>
                </>
              )}
              {tab === "Categorías" && (
                <>
                  <div className="admin-section-intro">
                    <div>
                      <h2>Cada antojo, en su lugar</h2>
                      <p>
                        Organizá el catálogo en grupos fáciles de encontrar.
                      </p>
                    </div>
                    <button className="admin-button" onClick={addCategory}>
                      + Nueva categoría
                    </button>
                  </div>
                  <div className="admin-split">
                    <div className="admin-list">
                      {draft.categories.map((c) => (
                        <button
                          key={c.id}
                          className={categoryId === c.id ? "selected" : ""}
                          onClick={() => setCategoryId(c.id)}
                        >
                          <span>
                            <strong>{c.name}</strong>
                            <small>
                              {
                                draft.products.filter(
                                  (p) => p.category === c.id,
                                ).length
                              }{" "}
                              productos · {c.active ? "Visible" : "Oculta"}
                            </small>
                          </span>
                        </button>
                      ))}
                    </div>
                    {selectedCategory ? (
                      <CategoryEditor
                        category={selectedCategory}
                        onChange={(c) =>
                          change({
                            ...draft,
                            categories: draft.categories.map((x) =>
                              x.id === c.id ? c : x,
                            ),
                          })
                        }
                      />
                    ) : (
                      <EditorEmpty
                        title="Elegí una categoría"
                        text="Podés cambiar el nombre, la foto y su visibilidad."
                      />
                    )}
                  </div>
                </>
              )}
              {tab === "Portada" && (
                <>
                  <SectionIntro
                    title="La bienvenida de Brunette"
                    text="Fotos, mensajes e historia. Cada campo indica dónde aparecerá."
                  />
                  <HomeEditor content={draft} onChange={change} />
                </>
              )}
              {tab === "Configuración" && (
                <>
                  <SectionIntro
                    title="El negocio, a tu manera"
                    text="Identidad, contacto y reglas generales de pedidos."
                  />
                  <BusinessEditor content={draft} onChange={change} />
                </>
              )}
              {tab === "Sucursales" && (
                <>
                  <div className="admin-section-intro">
                    <div>
                      <h2>Una ficha por local</h2>
                      <p>
                        Cada sucursal puede tener su WhatsApp, sus horarios y
                        sus entregas.
                      </p>
                    </div>
                    <button className="admin-button" onClick={addBranch}>
                      + Nueva sucursal
                    </button>
                  </div>
                  <div className="admin-split">
                    <div className="admin-list">
                      {draft.branches.map((b) => (
                        <button
                          key={b.id}
                          className={branchId === b.id ? "selected" : ""}
                          onClick={() => setBranchId(b.id)}
                        >
                          <span>
                            <strong>{b.name}</strong>
                            <small>
                              {b.address || "Dirección pendiente"} ·{" "}
                              {b.active ? "Visible" : "Oculta"}
                            </small>
                          </span>
                        </button>
                      ))}
                    </div>
                    {selectedBranch ? (
                      <BranchEditor
                        branch={selectedBranch}
                        onChange={(b) =>
                          change({
                            ...draft,
                            branches: draft.branches.map((x) =>
                              x.id === b.id ? b : x,
                            ),
                          })
                        }
                      />
                    ) : (
                      <EditorEmpty
                        title="Elegí una sucursal"
                        text="Revisá datos, horarios, retiro y condiciones de entrega."
                      />
                    )}
                  </div>
                </>
              )}
              {tab === "Historial" && (
                <HistoryPanel
                  api={api}
                  draft={draft}
                  onRestore={(content) => {
                    setDraft(content);
                    setDirty(false);
                    setMessage(
                      "Versión recuperada como borrador. Revisala y publicá para actualizar la web.",
                    );
                  }}
                  dirty={dirty}
                />
              )}
              {tab === "Usuarios" && user.role === "admin" && (
                <UsersPanel api={api} user={user} />
              )}
              {tab === "Ayuda" && (
                <HelpPanel
                  api={api}
                  onPasswordChange={() => {
                    setUser(null);
                    setDraft(null);
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Login({
  error,
  onLogin,
}: {
  error: string;
  onLogin: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div className="admin-login">
      <div className="login-story">
        <a href="/" className="admin-wordmark">
          brunette<span>Mostrador de antojos</span>
        </a>
        <div>
          <p>
            Hecho con cariño.
            <br />
            Cuidado por tu equipo.
          </p>
          <span>✳</span>
        </div>
        <small>Productos, fotos y precios. Todo en un solo lugar.</small>
      </div>
      <div className="login-form-wrap">
        <a href="/" className="login-back">
          ← Volver a la web
        </a>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await onLogin(email, password);
            } finally {
              setBusy(false);
            }
          }}
        >
          <p className="admin-eyebrow">El espacio del equipo</p>
          <h1>
            Qué bueno
            <br />
            verte por acá.
          </h1>
          <p>Ingresá para actualizar el contenido de Brunette.</p>
          <label>
            Correo
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && (
            <div className="admin-error-box" role="alert">
              {error}
            </div>
          )}
          <button className="admin-button" disabled={busy} type="submit">
            {busy ? "Ingresando…" : "Ingresar al panel"}
            <span aria-hidden="true">↗</span>
          </button>
          <small>
            Si no tenés acceso, pedíselo a la persona administradora del
            negocio.
          </small>
        </form>
      </div>
    </div>
  );
}
function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note: string;
}) {
  return (
    <div className="admin-stat">
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
function SectionIntro({ title, text }: { title: string; text: string }) {
  return (
    <div className="admin-section-intro">
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </div>
  );
}
function EditorEmpty({ title, text }: { title: string; text: string }) {
  return (
    <div className="admin-editor-empty">
      <span>✳</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
type API = (path: string, options?: RequestInit) => Promise<any>;
function HistoryPanel({
  api,
  draft,
  onRestore,
  dirty,
}: {
  api: API;
  draft: Content;
  onRestore: (c: Content) => void;
  dirty: boolean;
}) {
  const [versions, setVersions] = useState<
      { id: string; created: string; author: string }[]
    >([]),
    [activity, setActivity] = useState<
      { action: string; author: string; created: string }[]
    >([]),
    [error, setError] = useState("");
  useEffect(() => {
    api("admin/history")
      .then((data) => {
        setVersions(data.versions);
        setActivity(data.activity);
      })
      .catch((e) => setError(e.message));
  }, []);
  async function restore(id: string) {
    if (
      !confirm(
        dirty
          ? "Se reemplazarán los cambios sin guardar por esta versión. ¿Continuar?"
          : "Se recuperará esta versión como borrador. La web no cambiará hasta que publiques. ¿Continuar?",
      )
    )
      return;
    try {
      const result = await api("admin/restore", {
        method: "POST",
        body: JSON.stringify({ id, expectedRevision: draft.revision }),
      });
      onRestore(result.draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo recuperar.");
    }
  }
  return (
    <>
      <SectionIntro
        title="Siempre podés volver"
        text="Cada publicación conserva la versión anterior. Recuperar una versión crea un borrador para revisar antes de publicar."
      />
      {error && <div className="admin-error-box">{error}</div>}
      <div className="admin-two">
        <div className="editor-section">
          <h3>Versiones anteriores</h3>
          {!versions.length && (
            <p className="admin-help">
              Cuando publiques por primera vez, aparecerá acá la versión
              anterior.
            </p>
          )}
          {versions.map((v) => (
            <div className="history-row" key={v.id}>
              <div>
                <strong>{new Date(v.created).toLocaleString("es-AR")}</strong>
                <small>Guardada al publicar por {v.author}</small>
              </div>
              <button
                className="admin-button secondary"
                onClick={() => restore(v.id)}
              >
                Recuperar
              </button>
            </div>
          ))}
          <a href="/api/admin/export" className="admin-button secondary mt-5">
            Descargar copia del contenido ↓
          </a>
          <p className="admin-help mt-3">
            Incluye los textos, precios y referencias de imágenes. Las fotos y
            los accesos se respaldan por separado.
          </p>
        </div>
        <div className="editor-section">
          <h3>Actividad del equipo</h3>
          {activity.map((a, i) => (
            <div className="activity-row" key={i}>
              <span>●</span>
              <div>
                <strong>{a.action}</strong>
                <small>
                  {a.author} · {new Date(a.created).toLocaleString("es-AR")}
                </small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
function UsersPanel({ api, user }: { api: API; user: User }) {
  const [items, setItems] = useState<User[]>([]),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [role, setRole] = useState("editor");
  const load = () => api("admin/users").then((r) => setItems(r.users));
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);
  return (
    <>
      <SectionIntro
        title="Un acceso para cada persona"
        text="Usar cuentas individuales permite saber quién publicó cada cambio. Solo administración puede crear y desactivar accesos."
      />
      {error && <div className="admin-error-box">{error}</div>}
      {message && <div className="admin-success">{message}</div>}
      <div className="admin-two">
        <div className="editor-section">
          <h3>Accesos del equipo</h3>
          {items.map((item) => (
            <div className="history-row" key={item.id}>
              <div>
                <strong>
                  {item.name}
                  {item.id === user.id ? " (vos)" : ""}
                </strong>
                <small>
                  {item.email} ·{" "}
                  {item.role === "admin" ? "Administración" : "Edición"} ·{" "}
                  {item.active ? "Activo" : "Desactivado"}
                </small>
              </div>
              {item.id !== user.id && (
                <div className="user-actions">
                  <button
                    className="admin-text-button"
                    type="button"
                    onClick={async () => {
                      const password = prompt(
                        "Nueva contraseña para " +
                          item.name +
                          " (al menos 12 caracteres):",
                      );
                      if (!password) return;
                      try {
                        await api("admin/users", {
                          method: "PATCH",
                          body: JSON.stringify({ id: item.id, password }),
                        });
                        setMessage(
                          "Contraseña actualizada. Compartila por un medio privado.",
                        );
                      } catch (e) {
                        setError(
                          e instanceof Error
                            ? e.message
                            : "No se pudo cambiar la contraseña.",
                        );
                      }
                    }}
                  >
                    Cambiar clave
                  </button>
                  <button
                    className="admin-text-button"
                    onClick={async () => {
                      try {
                        await api("admin/users", {
                          method: "PATCH",
                          body: JSON.stringify({
                            id: item.id,
                            active: !item.active,
                          }),
                        });
                        await load();
                      } catch (e) {
                        setError(
                          e instanceof Error
                            ? e.message
                            : "No se pudo cambiar el acceso.",
                        );
                      }
                    }}
                  >
                    {item.active ? "Desactivar" : "Reactivar"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <form
          className="editor-section"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            try {
              await api("admin/users", {
                method: "POST",
                body: JSON.stringify({ name, email, password, role }),
              });
              setName("");
              setEmail("");
              setPassword("");
              setMessage(
                "Acceso creado. Compartí la contraseña por un medio privado.",
              );
              await load();
            } catch (e) {
              setError(e instanceof Error ? e.message : "No se pudo crear.");
            }
          }}
        >
          <h3>Agregar una persona</h3>
          <label>
            Nombre
            <input
              value={name}
              required
              onChange={(e) => setName(e.target.value)}
            />
            <small>El nombre aparecerá en el historial.</small>
          </label>
          <label>
            Correo
            <input
              type="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
            <small>
              Se usa para iniciar sesión. Esta versión no envía invitaciones por
              correo.
            </small>
          </label>
          <label>
            Contraseña inicial
            <input
              type="password"
              value={password}
              required
              minLength={12}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <small>Usá al menos 12 caracteres y compartila en privado.</small>
          </label>
          <label>
            Permisos
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="editor">Edición de contenido</option>
              <option value="admin">Administración</option>
            </select>
            <small>
              Edición permite actualizar y publicar contenido. Administración
              también gestiona accesos.
            </small>
          </label>
          <button className="admin-button" type="submit">
            Crear acceso
          </button>
        </form>
      </div>
    </>
  );
}
function HelpPanel({
  api,
  onPasswordChange,
}: {
  api: API;
  onPasswordChange: () => void;
}) {
  const [current, setCurrent] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState("");
  return (
    <>
      <SectionIntro
        title="No hace falta saber de programación"
        text="Estos son los pasos más habituales del día a día."
      />
      <div className="admin-two">
        <div className="editor-section help-articles">
          {[
            [
              "Cambiar un precio",
              "Entrá en Productos, elegí la ficha y modificá el precio de la presentación. Guardá el borrador, revisá y publicá. Se actualiza en el catálogo, la ficha y los nuevos pedidos.",
            ],
            [
              "Un producto se agotó",
              "En Productos, elegí Agotado por ahora. Al publicar, seguirá visible pero no se podrá agregar al pedido. Cuando vuelva a haber, elegí Disponible.",
            ],
            [
              "Borrador y publicación",
              "Guardar borrador conserva el trabajo sin cambiar la web. Publicar cambios lo hace visible para los clientes. Si otra persona guardó antes, el panel te pedirá recargar para no pisar su trabajo.",
            ],
            [
              "Cambiar una foto",
              "Tocá Cambiar foto, elegí un JPG, PNG o WebP y esperá a que aparezca la vista previa. Después guardá y publicá.",
            ],
            [
              "Horarios y encargos",
              "Los horarios pertenecen a cada sucursal. La anticipación se configura por producto; si queda vacía, usa la regla general. La web comprueba ambas antes de preparar WhatsApp.",
            ],
            [
              "Qué pasa con un pedido",
              "La web arma una consulta. El cliente la revisa y decide enviarla en WhatsApp. El equipo confirma disponibilidad, precio final, entrega y pago. No se cobra ni se reserva automáticamente.",
            ],
            [
              "Recuperar algo anterior",
              "En Historial, elegí Recuperar. La versión vuelve como borrador. Revisala y publicá cuando estés conforme.",
            ],
          ].map(([title, text]) => (
            <details key={title}>
              <summary>{title}</summary>
              <p>{text}</p>
            </details>
          ))}
        </div>
        <form
          className="editor-section"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api("admin/password", {
                method: "POST",
                body: JSON.stringify({ currentPassword: current, password }),
              });
              onPasswordChange();
            } catch (e) {
              setError(e instanceof Error ? e.message : "No se pudo cambiar.");
            }
          }}
        >
          <h3>Cambiar mi contraseña</h3>
          <p className="admin-help">
            Al cambiarla, se cerrarán tus sesiones y vas a ingresar con la nueva
            clave.
          </p>
          <label>
            Contraseña actual
            <input
              type="password"
              required
              value={current}
              autoComplete="current-password"
              onChange={(e) => setCurrent(e.target.value)}
            />
          </label>
          <label>
            Nueva contraseña
            <input
              type="password"
              required
              minLength={12}
              value={password}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <small>
              Al menos 12 caracteres. No uses la misma clave que compartís con
              otras personas.
            </small>
          </label>
          {error && <p className="admin-error">{error}</p>}
          <button className="admin-button" type="submit">
            Cambiar contraseña
          </button>
        </form>
      </div>
    </>
  );
}
