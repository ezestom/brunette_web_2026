import { z } from "astro/zod";

const text = (max = 300) => z.string().max(max);
const id = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/, "Usá letras, números y guiones.");
const price = z.number().int().min(0).max(100_000_000_000).nullable();
const phone = text(30)
  .transform((v) => v.replace(/\D/g, ""))
  .refine(
    (v) => v === "" || /^\d{8,15}$/.test(v),
    "Ingresá el número completo con código de país.",
  );
const url = text(1000).refine(
  (v) => !v || (/^https?:\/\//.test(v) && URL.canParse(v)),
  "Ingresá un enlace que empiece con https://.",
);
const image = text(500).refine(
  (v) => !v || /^\/(?:assets|media)\/[a-zA-Z0-9_.-]+$/.test(v),
  "Subí una imagen desde el panel.",
);
const socialAsset = text(1000).refine(
  (value) =>
    /^\/(?:assets|media|social_media_photos|social_media_videos)\/[a-zA-Z0-9_-][a-zA-Z0-9_.-]*$/.test(
      value,
    ) ||
    (/^https:\/\//.test(value) && URL.canParse(value)),
  "Usá un archivo de medios local o un enlace https://.",
);
const hours = z
  .array(
    z
      .object({
        day: z.number().int().min(0).max(6),
        closed: z.boolean(),
        open: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        close: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
      })
      .refine(
        (v) => v.closed || v.open < v.close,
        "La hora de cierre debe ser posterior a la apertura.",
      ),
  )
  .max(7)
  .refine(
    (v) => new Set(v.map((d) => d.day)).size === v.length,
    "No repitas días.",
  );
const lead = z.number().int().min(0).max(8760).nullable();
export const contentSchema = z
  .object({
    schemaVersion: z.literal(1),
    revision: text(100),
    settings: z.object({
      name: text(100).min(1),
      tagline: text(150),
      description: text(1500),
      whatsapp: phone,
      instagram: url,
      address: text(250),
      mapUrl: url,
      currency: z.enum(["ARS", "USD", "UYU"]),
      timezone: text(100).refine((v) => {
        try {
          new Intl.DateTimeFormat("es", { timeZone: v });
          return true;
        } catch {
          return false;
        }
      }, "Zona horaria no válida."),
      openingHours: hours,
      pickupEnabled: z.boolean(),
      deliveryEnabled: z.boolean(),
      deliveryZone: text(1000),
      deliveryFee: price,
      minimumOrder: price,
      defaultLeadTimeHours: lead,
      closedDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(365),
      orderNotice: text(1200),
      logo: image,
      colorPrimary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      colorBackground: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      colorAccent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    }),
    home: z.object({
      contactTitle: text(150).default("Contactanos"),
      contactText: text(1000).default(""),
      contactImage: image.default("/assets/Two_Food_Photograhers-74100a5d.jpg"),
      gallery: z.array(image).max(24).default([]),
      socialMedia: z
        .array(
          z.object({
            type: z.enum(["image", "video"]),
            src: socialAsset,
            poster: socialAsset.optional(),
            alt: text(300).optional(),
            href: url.optional(),
          }),
        )
        .max(18)
        .optional(),
      heroTitle: text(150).min(1),
      heroSubtitle: text(500),
      heroImage: image,
      introTitle: text(200),
      introText: text(1500),
      storyTitle: text(200),
      storyText: text(3000),
      storyImage: image,
      announcement: text(250),
      showAnnouncement: z.boolean(),
      previewMode: z.boolean(),
    }),
    categories: z
      .array(
        z.object({
          id,
          name: text(100).min(1),
          description: text(500),
          image,
          active: z.boolean(),
        }),
      )
      .min(1)
      .max(50),
    products: z
      .array(
        z.object({
          id,
          slug: z
            .string()
            .min(1)
            .max(120)
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
          name: text(150).min(1),
          description: text(5000),
          category: id,
          image,
          imageAlt: text(200),
          gallery: z.array(image).max(12),
          availability: z.enum(["available", "soldOut", "onRequest"]),
          fulfillment: z.enum(["ready", "preorder"]),
          leadTimeHours: lead,
          featured: z.boolean(),
          active: z.boolean(),
          isDemo: z.boolean(),
          allergens: z.array(text(100)).max(30),
          ingredients: z.array(text(100)).max(12).default([]),
          variants: z
            .array(
              z.object({
                id,
                name: text(100).min(1),
                price,
                available: z.boolean(),
              }),
            )
            .min(1)
            .max(30),
          order: z.number().int().min(0).max(10000),
        }),
      )
      .max(1000),
    branches: z
      .array(
        z.object({
          id,
          name: text(100).min(1),
          address: text(250),
          whatsapp: phone,
          mapUrl: url,
          openingHours: hours,
          pickupEnabled: z.boolean(),
          deliveryEnabled: z.boolean(),
          deliveryZone: text(1000),
          deliveryFee: price,
          active: z.boolean(),
          isDemo: z.boolean(),
        }),
      )
      .max(20),
  })
  .strict()
  .superRefine((v, ctx) => {
    for (const field of ["categories", "products", "branches"] as const) {
      const ids = v[field].map((x) => x.id);
      if (new Set(ids).size !== ids.length)
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: "Hay identificadores repetidos.",
        });
    }
    if (new Set(v.products.map((p) => p.slug)).size !== v.products.length)
      ctx.addIssue({
        code: "custom",
        path: ["products"],
        message: "Hay enlaces de producto repetidos.",
      });
    for (const [i, p] of v.products.entries()) {
      if (p.active && !p.image)
        ctx.addIssue({
          code: "custom",
          path: ["products", i, "image"],
          message:
            "Cargá una foto principal o desactivá el producto antes de guardar.",
        });
      if (!v.categories.some((c) => c.id === p.category))
        ctx.addIssue({
          code: "custom",
          path: ["products", i, "category"],
          message: "Elegí una categoría existente.",
        });
      if (new Set(p.variants.map((x) => x.id)).size !== p.variants.length)
        ctx.addIssue({
          code: "custom",
          path: ["products", i, "variants"],
          message: "Las opciones deben tener identificadores diferentes.",
        });
    }
    if (!v.home.previewMode) {
      if (!v.settings.whatsapp)
        ctx.addIssue({
          code: "custom",
          path: ["settings", "whatsapp"],
          message: "Configurá WhatsApp antes de salir del modo de prueba.",
        });
      if (!v.branches.some((b) => b.active))
        ctx.addIssue({
          code: "custom",
          path: ["branches"],
          message: "Activá al menos una sucursal.",
        });
      if (
        v.products.some((p) => p.active && p.isDemo) ||
        v.branches.some((b) => b.active && b.isDemo)
      )
        ctx.addIssue({
          code: "custom",
          path: ["home", "previewMode"],
          message:
            "Revisá y desmarcá los productos y horarios de ejemplo antes de desactivar el modo de prueba.",
        });
    }
  });

export function validateContent(input: unknown) {
  const result = contentSchema.safeParse(input);
  if (!result.success) {
    const labels: Record<string, string> = {
      settings: "Configuración",
      home: "Portada",
      products: "Productos",
      branches: "Sucursales",
      categories: "Categorías",
      name: "Nombre",
      price: "Precio",
      image: "Foto principal",
      imageAlt: "Descripción de la foto",
      description: "Descripción",
      slug: "Enlace del producto",
      whatsapp: "WhatsApp",
      instagram: "Instagram",
      mapUrl: "Enlace del mapa",
      openingHours: "Horarios",
      leadTimeHours: "Anticipación",
      defaultLeadTimeHours: "Anticipación general",
      closedDates: "Fechas sin pedidos",
      previewMode: "Modo de prueba",
      deliveryFee: "Costo de entrega",
      minimumOrder: "Pedido mínimo",
      heroTitle: "Título principal",
      heroImage: "Foto de portada",
    };
    throw new Error(
      result.error.issues
        .map((i) => {
          const path = i.path
            .map((p) =>
              typeof p === "number"
                ? String(p + 1)
                : labels[String(p)] || String(p),
            )
            .join(" · ");
          let message = i.message;
          if (i.code !== "custom" && !/[áéíóúñ¿]/i.test(message))
            message =
              i.code === "too_small"
                ? "Completá el campo o revisá que el valor no sea negativo."
                : i.code === "too_big"
                  ? "El valor supera el máximo permitido. Acortalo o reducí el importe."
                  : "Revisá el formato y el valor de este campo.";
          return `${path || "Contenido"}: ${message}`;
        })
        .slice(0, 12)
        .join("\n"),
    );
  }
  return result.data;
}
