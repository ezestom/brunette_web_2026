import type { Content, Product, Category, Branch } from "../../lib/types";
import {
  TextField,
  ListField,
  NumberField,
  MoneyField,
  Toggle,
  Field,
  ImageField,
  HoursEditor,
} from "./Fields";
type Props = { content: Content; onChange: (content: Content) => void };

export function ProductEditor({
  product,
  categories,
  onChange,
}: {
  product: Product;
  categories: Category[];
  onChange: (p: Product) => void;
}) {
  const set = <K extends keyof Product>(key: K, value: Product[K]) =>
    onChange({ ...product, [key]: value });
  return (
    <div className="editor-stack">
      <div className="editor-section">
        <h3>Lo que verá el cliente</h3>
        <TextField
          label="Nombre del producto"
          help="Usá un nombre corto y fácil de reconocer. Ejemplo: Cookie de chocolate."
          value={product.name}
          onChange={(v) => set("name", v)}
        />
        <TextField
          label="Descripción"
          help="Contá qué incluye, para cuántas personas rinde y qué lo hace especial. Evitá prometer ingredientes o condiciones sin confirmar."
          value={product.description}
          onChange={(v) => set("description", v)}
          area
        />
        <Field
          label="Categoría"
          help="Define en qué grupo aparece el producto. Las categorías se editan desde el menú Categorías."
        >
          <select
            value={product.category}
            onChange={(e) => set("category", e.target.value)}
            aria-label="Categoría del producto"
          >
            {categories.map((c) => (
              <option value={c.id} key={c.id}>
                {c.name}
                {!c.active ? " (oculta)" : ""}
              </option>
            ))}
          </select>
        </Field>
        <ImageField
          label="Foto principal"
          help="Se usa en el catálogo y en la ficha. Recomendamos una foto vertical, con el producto centrado y buena luz."
          value={product.image}
          onChange={(v) =>
            onChange({
              ...product,
              image: v,
              gallery: product.gallery.length <= 1 ? [v] : product.gallery,
            })
          }
        />
        <TextField
          label="Descripción de la foto"
          help="Describí brevemente la imagen para personas que usan lectores de pantalla. Ejemplo: Torta de chocolate con frutillas."
          value={product.imageAlt}
          onChange={(v) => set("imageAlt", v)}
        />
        <div className="admin-gallery">
          <h4>Fotos adicionales</h4>
          <p className="admin-help">
            Opcional. Mostrá otros ángulos o el interior del producto. Podés
            cargar hasta 12 imágenes.
          </p>
          {product.gallery.map((src, i) => (
            <ImageField
              key={i}
              label={"Foto " + (i + 1)}
              help="Para quitar esta foto, usá Quitar imagen."
              value={src}
              onChange={(v) =>
                set(
                  "gallery",
                  v
                    ? product.gallery.map((s, j) => (i === j ? v : s))
                    : product.gallery.filter((_, j) => i !== j),
                )
              }
            />
          ))}
          {product.gallery.length < 12 && (
            <button
              type="button"
              className="admin-button secondary"
              onClick={() => set("gallery", [...product.gallery, ""])}
            >
              + Agregar foto
            </button>
          )}
        </div>
      </div>
      <div className="editor-section">
        <h3>Presentaciones y precios</h3>
        <p className="admin-help">
          Cada presentación puede tener su precio. Para un solo tamaño, dejá una
          sola opción. Los precios se ingresan en pesos, sin separador de miles;
          el panel se ocupa del formato.
        </p>
        {product.variants.map((v, i) => (
          <div key={v.id} className="variant-editor">
            <TextField
              label="Nombre de la presentación"
              help="Ejemplos: Individual, Caja de 6, Chica o Grande."
              value={v.name}
              onChange={(name) =>
                set(
                  "variants",
                  product.variants.map((x, j) =>
                    j === i ? { ...x, name } : x,
                  ),
                )
              }
            />
            <MoneyField
              label="Precio"
              help="Ingresá el precio completo. Si queda vacío, la web mostrará A confirmar."
              value={v.price}
              onChange={(price) =>
                set(
                  "variants",
                  product.variants.map((x, j) =>
                    j === i ? { ...x, price } : x,
                  ),
                )
              }
            />
            <Toggle
              label="Presentación disponible"
              help="Desactivala si solo esta opción está agotada. Las otras seguirán disponibles."
              value={v.available}
              onChange={(available) =>
                set(
                  "variants",
                  product.variants.map((x, j) =>
                    j === i ? { ...x, available } : x,
                  ),
                )
              }
            />
            {product.variants.length > 1 && (
              <button
                className="admin-text-button danger"
                type="button"
                onClick={() =>
                  set(
                    "variants",
                    product.variants.filter((_, j) => j !== i),
                  )
                }
              >
                Quitar presentación
              </button>
            )}
          </div>
        ))}
        {product.variants.length < 30 && (
          <button
            className="admin-button secondary"
            type="button"
            onClick={() =>
              set("variants", [
                ...product.variants,
                {
                  id: crypto.randomUUID(),
                  name: "Nueva presentación",
                  price: null,
                  available: true,
                },
              ])
            }
          >
            + Agregar presentación
          </button>
        )}
      </div>
      <div className="editor-section">
        <h3>Disponibilidad y pedidos</h3>
        <Field
          label="Estado del producto"
          help="Disponible: permite sumarlo al pedido. Agotado: se muestra, pero no se puede pedir. A consultar: permite preparar una consulta sin garantizar disponibilidad."
        >
          <select
            aria-label="Estado del producto"
            value={product.availability}
            onChange={(e) =>
              set("availability", e.target.value as Product["availability"])
            }
          >
            <option value="available">Disponible</option>
            <option value="soldOut">Agotado por ahora</option>
            <option value="onRequest">A consultar</option>
          </select>
        </Field>
        <Field
          label="Tipo de preparación"
          help="Del mostrador identifica productos habituales. Por encargo identifica preparaciones que necesitan anticipación."
        >
          <select
            aria-label="Tipo de preparación"
            value={product.fulfillment}
            onChange={(e) =>
              set("fulfillment", e.target.value as Product["fulfillment"])
            }
          >
            <option value="ready">Del mostrador</option>
            <option value="preorder">Por encargo</option>
          </select>
        </Field>
        <NumberField
          label="Anticipación mínima, en horas"
          help="0 permite consultar para hoy. 24 significa un día; 48, dos días. Si queda vacío, usa la anticipación general del negocio."
          value={product.leadTimeHours}
          onChange={(v) => set("leadTimeHours", v)}
        />
        <ListField
          label="Ingredientes destacados"
          help="Separalos con comas. Aparecen como etiquetas animadas al pasar por la foto. Ejemplo: chocolate, caramelo. Esto no reemplaza la información de alérgenos."
          value={product.ingredients || []}
          onChange={(v) => set("ingredients", v)}
        />
        <ListField
          label="Alérgenos informados"
          help="Separalos con comas. Ejemplo: leche, huevo, trigo. Cargá solo información confirmada por el equipo de elaboración."
          value={product.allergens}
          onChange={(v) => set("allergens", v)}
        />
        <NumberField
          label="Orden en el catálogo"
          help="Los números más bajos aparecen primero. No cambia el precio ni la disponibilidad."
          value={product.order}
          onChange={(v) => set("order", v ?? 0)}
        />
        <Toggle
          label="Destacar en la portada"
          help="Los productos destacados aparecen en Los favoritos del mostrador, hasta tres productos."
          value={product.featured}
          onChange={(v) => set("featured", v)}
        />
        <Toggle
          label="Mostrar este producto en la web"
          help="Desactivalo para archivarlo temporalmente. Se conserva en el panel y podés volver a activarlo."
          value={product.active}
          onChange={(v) => set("active", v)}
        />
        <Toggle
          label="Es un producto de prueba"
          help="Dejá esta opción activa mientras la foto, la descripción o el precio sean ejemplos. Desactivala cuando hayas revisado los datos reales."
          value={product.isDemo}
          onChange={(v) => set("isDemo", v)}
        />
      </div>
    </div>
  );
}
export function HomeEditor({ content, onChange }: Props) {
  const set = <K extends keyof Content["home"]>(
    key: K,
    value: Content["home"][K],
  ) => onChange({ ...content, home: { ...content.home, [key]: value } });
  const h = content.home;
  return (
    <div className="editor-stack">
      <div className="editor-section">
        <h3>La primera impresión</h3>
        <TextField
          label="Título principal"
          help="Es el texto grande sobre la foto de portada. Usá una frase breve, de hasta seis o siete palabras."
          value={h.heroTitle}
          onChange={(v) => set("heroTitle", v)}
        />
        <TextField
          label="Texto de bienvenida"
          help="Una o dos frases para explicar qué ofrece Brunette y cómo pedir."
          value={h.heroSubtitle}
          onChange={(v) => set("heroSubtitle", v)}
          area
        />
        <ImageField
          label="Foto de portada"
          help="Recomendamos una foto horizontal de al menos 1600 píxeles de ancho. El texto se superpone: evitá poner información importante en los bordes."
          value={h.heroImage}
          onChange={(v) => set("heroImage", v)}
        />
      </div>
      <div className="editor-section">
        <h3>Presentación e historia</h3>
        <TextField
          label="Título de presentación"
          help="Aparece justo debajo de la portada. Es una frase que representa al negocio."
          value={h.introTitle}
          onChange={(v) => set("introTitle", v)}
        />
        <TextField
          label="Texto de presentación"
          help="Explicá en pocas líneas qué puede encontrar el cliente."
          value={h.introText}
          onChange={(v) => set("introText", v)}
          area
        />
        <TextField
          label="Título de nuestra historia"
          help="Se usa en la portada y en la página Nuestra historia."
          value={h.storyTitle}
          onChange={(v) => set("storyTitle", v)}
        />
        <TextField
          label="Nuestra historia"
          help="Contá cómo empezó Brunette, quiénes forman el equipo y qué quieren compartir. Los saltos de línea se conservan."
          value={h.storyText}
          onChange={(v) => set("storyText", v)}
          area
        />
        <ImageField
          label="Foto de nuestra historia"
          help="Una foto del equipo, del local o del mostrador. Funciona mejor una imagen vertical."
          value={h.storyImage}
          onChange={(v) => set("storyImage", v)}
        />
      </div>
      <div className="editor-section">
        <h3>Galería de arcos en movimiento</h3>
        <p className="admin-help">
          Estas fotos recorren la portada de forma continua. Reemplazá las
          imágenes de ejemplo por fotos del local, productos o equipo. Se
          repiten automáticamente para que no haya cortes. Si no cargás fotos,
          se usan las de los productos.
        </p>
        {(h.gallery || []).map((src, i) => (
          <ImageField
            key={i}
            label={"Imagen del carrusel " + (i + 1)}
            help="Una foto vertical o cuadrada, sin textos. Se recorta dentro de un arco."
            value={src}
            onChange={(v) =>
              set(
                "gallery",
                v
                  ? (h.gallery || []).map((item, j) => (i === j ? v : item))
                  : (h.gallery || []).filter((_, j) => i !== j),
              )
            }
          />
        ))}
        {(h.gallery || []).length < 24 && (
          <button
            type="button"
            className="admin-button secondary"
            onClick={() => set("gallery", [...(h.gallery || []), ""])}
          >
            + Agregar imagen al carrusel
          </button>
        )}
      </div>
      <div className="editor-section">
        <h3>Página de contacto</h3>
        <TextField
          label="Título de contacto"
          help="Se muestra encima del formulario de la página Contacto."
          value={h.contactTitle ?? "Contactanos"}
          onChange={(v) => set("contactTitle", v)}
        />
        <TextField
          label="Texto de contacto"
          help="Opcional. Podés aclarar para qué consultas sirve el formulario. El mensaje se prepara para el WhatsApp general de Configuración."
          value={h.contactText || ""}
          onChange={(v) => set("contactText", v)}
          area
        />
        <ImageField
          label="Foto de contacto"
          help="Imagen vertical del local, mostrador o equipo. Aparece a la derecha del formulario con movimiento al hacer scroll."
          value={h.contactImage ?? "/assets/Two_Food_Photograhers-74100a5d.jpg"}
          onChange={(v) => set("contactImage", v)}
        />
      </div>
      <div className="editor-section">
        <h3>Avisos</h3>
        <Toggle
          label="Mostrar la franja de novedades"
          help="Muestra el mensaje de novedades en el bloque de contacto, antes del pie de página."
          value={h.showAnnouncement}
          onChange={(v) => set("showAnnouncement", v)}
        />
        <TextField
          label="Mensaje de la franja"
          help="Evitá mensajes largos. Si la promoción tiene vencimiento, acordate de quitarla cuando termine."
          value={h.announcement}
          onChange={(v) => set("announcement", v)}
        />
        <Toggle
          label="Modo de prueba"
          help="Marca los mensajes de pedidos por WhatsApp como pruebas, sin mostrar una franja en la web. Para desactivarlo, revisá primero todos los productos y sucursales de ejemplo."
          value={h.previewMode}
          onChange={(v) => set("previewMode", v)}
        />
      </div>
    </div>
  );
}
export function BusinessEditor({ content, onChange }: Props) {
  const s = content.settings;
  const set = <K extends keyof typeof s>(key: K, value: (typeof s)[K]) =>
    onChange({ ...content, settings: { ...s, [key]: value } });
  return (
    <div className="editor-stack">
      <div className="editor-section">
        <h3>Identidad y contacto</h3>
        <TextField
          label="Nombre del negocio"
          help="Se muestra en la cabecera, el pie y los mensajes de WhatsApp."
          value={s.name}
          onChange={(v) => set("name", v)}
        />
        <TextField
          label="Frase de la marca"
          help="Una descripción breve, como Mostrador de antojos."
          value={s.tagline}
          onChange={(v) => set("tagline", v)}
        />
        <TextField
          label="Descripción del negocio"
          help="Resumen que ayuda a presentar la web al compartirla y en los buscadores."
          value={s.description}
          onChange={(v) => set("description", v)}
          area
        />
        <TextField
          label="WhatsApp general"
          help="Número completo con código de país. Ejemplo argentino: 5491168641122. Se usa cuando una sucursal no tiene su propio número."
          value={s.whatsapp}
          onChange={(v) => set("whatsapp", v)}
          type="tel"
        />
        <TextField
          label="Enlace de Instagram"
          help="Pegá el enlace completo del perfil, empezando con https://."
          value={s.instagram}
          onChange={(v) => set("instagram", v)}
          type="url"
        />
        <ImageField
          label="Logo"
          help="Subí el logo en JPG, PNG o WebP, con fondo o transparente. Se conserva su proporción. Si lo quitás, se muestra el nombre del negocio."
          value={s.logo}
          onChange={(v) => set("logo", v)}
        />
        <div className="admin-three">
          {(["colorPrimary", "colorBackground", "colorAccent"] as const).map(
            (key, i) => (
              <Field
                key={key}
                label={
                  ["Color principal", "Fondo de la web", "Color de acento"][i]
                }
                help={
                  [
                    "Cabecera, textos y pie de página. Elegí un tono oscuro.",
                    "Elegí un tono claro para que los textos se lean bien.",
                    "Se usa en botones y detalles destacados.",
                  ][i]
                }
              >
                <input
                  type="color"
                  aria-label={
                    ["Color principal", "Fondo de la web", "Color de acento"][i]
                  }
                  value={s[key]}
                  onChange={(e) => set(key, e.target.value)}
                />
              </Field>
            ),
          )}
        </div>
      </div>
      <div className="editor-section">
        <h3>Reglas generales de pedidos</h3>
        <Toggle
          label="Permitir retiro en sucursal"
          help="Habilita el retiro en toda la web. Cada sucursal también debe tener esta opción activa."
          value={s.pickupEnabled}
          onChange={(v) => set("pickupEnabled", v)}
        />
        <Toggle
          label="Permitir entregas a domicilio"
          help="Habilita la entrega en toda la web. Las zonas y condiciones se configuran por sucursal."
          value={s.deliveryEnabled}
          onChange={(v) => set("deliveryEnabled", v)}
        />
        <MoneyField
          label="Pedido mínimo"
          help="Dejalo vacío si no hay mínimo. La web lo comprobará antes de preparar el mensaje."
          value={s.minimumOrder}
          onChange={(v) => set("minimumOrder", v)}
        />
        <MoneyField
          label="Costo general de entrega"
          help="Se usa si la sucursal no tiene una tarifa propia. 0 significa sin cargo; vacío significa a confirmar."
          value={s.deliveryFee}
          onChange={(v) => set("deliveryFee", v)}
        />
        <NumberField
          label="Anticipación general, en horas"
          help="Se aplica a los productos sin una anticipación propia. 24 equivale a un día. 0 permite consultar para el mismo día."
          value={s.defaultLeadTimeHours}
          onChange={(v) => set("defaultLeadTimeHours", v)}
        />
        <TextField
          label="Mensaje de confirmación"
          help="Se muestra al cliente y se agrega al mensaje de WhatsApp. Aclarar que el pedido se confirma por el local ayuda a evitar confusiones."
          value={s.orderNotice}
          onChange={(v) => set("orderNotice", v)}
          area
        />
        <ListField
          label="Fechas sin pedidos"
          help="Separá fechas con comas, en formato año-mes-día. Ejemplo: 2026-12-25, 2027-01-01. Esas fechas no podrán elegirse para pedidos."
          value={s.closedDates}
          onChange={(v) => set("closedDates", v)}
        />
        <Field
          label="Moneda"
          help="Cambia el símbolo y formato. No convierte los precios: si cambiás la moneda, revisá todos los importes."
        >
          <select
            aria-label="Moneda"
            value={s.currency}
            onChange={(e) =>
              set("currency", e.target.value as typeof s.currency)
            }
          >
            <option value="ARS">Pesos argentinos (ARS)</option>
            <option value="UYU">Pesos uruguayos (UYU)</option>
            <option value="USD">Dólares (USD)</option>
          </select>
        </Field>
        <Field
          label="Zona horaria del negocio"
          help="Se usa para calcular la fecha actual y la anticipación de los pedidos. Para Buenos Aires, dejá Argentina."
        >
          <select
            aria-label="Zona horaria del negocio"
            value={s.timezone}
            onChange={(e) => set("timezone", e.target.value)}
          >
            <option value="America/Argentina/Buenos_Aires">
              Argentina · Buenos Aires
            </option>
            <option value="America/Montevideo">Uruguay · Montevideo</option>
            <option value="America/Bogota">Colombia · Bogotá</option>
          </select>
        </Field>
      </div>
    </div>
  );
}
export function BranchEditor({
  branch,
  onChange,
}: {
  branch: Branch;
  onChange: (b: Branch) => void;
}) {
  const set = <K extends keyof Branch>(key: K, value: Branch[K]) =>
    onChange({ ...branch, [key]: value });
  return (
    <div className="editor-stack">
      <div className="editor-section">
        <h3>Datos de la sucursal</h3>
        <TextField
          label="Nombre de la sucursal"
          help="Ayuda al cliente a distinguir el local. Ejemplos: Café Brunette o Mostrador Brunette."
          value={branch.name}
          onChange={(v) => set("name", v)}
        />
        <TextField
          label="Dirección"
          help="Incluí calle, número, localidad y cualquier indicación útil para retirar el pedido."
          value={branch.address}
          onChange={(v) => set("address", v)}
        />
        <TextField
          label="Enlace del mapa"
          help="Pegá el enlace de Google Maps de esta sucursal. Si queda vacío, el botón buscará la dirección escrita."
          value={branch.mapUrl}
          onChange={(v) => set("mapUrl", v)}
          type="url"
        />
        <TextField
          label="WhatsApp de esta sucursal"
          help="Número completo con código de país. Si lo dejás vacío, los pedidos irán al WhatsApp general."
          value={branch.whatsapp}
          onChange={(v) => set("whatsapp", v)}
          type="tel"
        />
        <HoursEditor
          value={branch.openingHours}
          onChange={(v) => set("openingHours", v)}
        />
      </div>
      <div className="editor-section">
        <h3>Retiro y entregas</h3>
        <Toggle
          label="Permitir retiro en este local"
          help="El cliente podrá elegir esta sucursal para retirar. Debe estar habilitado también en Configuración."
          value={branch.pickupEnabled}
          onChange={(v) => set("pickupEnabled", v)}
        />
        <Toggle
          label="Permitir entregas desde este local"
          help="El cliente podrá pedir una entrega, que el equipo confirmará por WhatsApp."
          value={branch.deliveryEnabled}
          onChange={(v) => set("deliveryEnabled", v)}
        />
        <TextField
          label="Zona y condiciones de entrega"
          help="Describí los barrios, el radio o las condiciones. Es una explicación para el cliente; la cobertura final se confirma por WhatsApp."
          value={branch.deliveryZone}
          onChange={(v) => set("deliveryZone", v)}
          area
        />
        <MoneyField
          label="Costo de entrega de esta sucursal"
          help="0 significa sin cargo. Si queda vacío, usa la tarifa general. Si ambas están vacías, se muestra A confirmar."
          value={branch.deliveryFee}
          onChange={(v) => set("deliveryFee", v)}
        />
        <Toggle
          label="Mostrar esta sucursal"
          help="Desactivala si el local cierra temporalmente. No se borran sus datos."
          value={branch.active}
          onChange={(v) => set("active", v)}
        />
        <Toggle
          label="Horarios y condiciones de prueba"
          help="Desactivala cuando hayas confirmado los horarios y la información comercial de este local."
          value={branch.isDemo}
          onChange={(v) => set("isDemo", v)}
        />
      </div>
    </div>
  );
}
export function CategoryEditor({
  category,
  onChange,
}: {
  category: Category;
  onChange: (c: Category) => void;
}) {
  return (
    <div className="editor-section">
      <TextField
        label="Nombre de la categoría"
        help="Agrupa productos en el catálogo. Ejemplos: Tortas, Cookies o Desayunos."
        value={category.name}
        onChange={(name) => onChange({ ...category, name })}
      />
      <TextField
        label="Descripción breve"
        help="Se muestra en las tarjetas de categoría de la portada."
        value={category.description}
        onChange={(description) => onChange({ ...category, description })}
      />
      <ImageField
        label="Foto de la categoría"
        help="Elegí una foto que represente bien al grupo. Recomendamos una imagen vertical."
        value={category.image}
        onChange={(image) => onChange({ ...category, image })}
      />
      <Toggle
        label="Mostrar esta categoría"
        help="Si la ocultás, también se ocultan sus productos de la web. Todo se conserva en el panel."
        value={category.active}
        onChange={(active) => onChange({ ...category, active })}
      />
    </div>
  );
}
