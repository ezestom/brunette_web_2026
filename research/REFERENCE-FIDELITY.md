# Traslado del diseño de Bernice a Astro

Referencia pública: https://bernicebakery.com/. Fuente local: `../../bernice-frontend/public/` y `../../bernice-frontend/research/`. Revisión: 20 de octubre de 2026.

La primera versión de Astro había sustituido la composición y los movimientos por un diseño propio. Esta revisión recupera las secciones, clases, tipografías, SVG y hojas de estilo del clon. El contenido se obtiene del CMS; el carrito y la ficha interactiva usan React.

## Correspondencias

| Referencia conservada                                                              | Implementación                                                                                               |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Hero con foto oscurecida, título por palabras y botón con mordida                  | `ReferenceHome.astro` + `hero-663ebb97.css`                                                                  |
| Parallax de fondo 70%, imagen hasta 1.4 y radio inferior 5rem, escritorio >768px   | `reference-motion.ts`                                                                                        |
| Presentación en dos columnas, texto por líneas y dibujo flotante                   | DOM original de Title_Text en `ReferenceHome.astro`                                                          |
| Tres productos en tarjetas arqueadas y cuatro marquesinas diagonales               | `ReferenceProduct.astro`, CSS original de collection-display y marquee                                       |
| Segunda foto y etiquetas de ingredientes al pasar el mouse                         | Galería e ingredientes del producto; CSS original de product-item                                            |
| Galería continua de arcos de alturas alternadas, con dibujos intercalados          | `ReferenceArches.astro`; fotos editables del CMS                                                             |
| Categorías y paginación: salida girada, intercambio a 1.2 s, entrada escalonada    | `ReferenceBrowser.astro` + `reference-motion.ts`                                                             |
| Tarjetas que se desplazan horizontalmente                                          | `ReferenceServices.astro`; información del negocio en lugar de citas sobre otro comercio                     |
| Imagen arqueada, texto SVG que recorre su contorno y botón circular                | DOM original de Collections_CTA con campos de historia del CMS                                               |
| Menú fijo, cambio de color según sección, buscador desplegable y menú móvil radial | `Layout.astro`, CSS original de menú y `reference-navigation.ts`                                             |
| Cortinas SVG entre páginas, 1.2 s, navegación a 800 ms                             | SVG originales en `ReferenceCurtains.astro` y módulo de movimiento                                           |
| Footer descubierto desde abajo cuando cabe en la pantalla                          | Estructura Footer_Space/Wrapper y medición con ResizeObserver                                                |
| Partículas de tres migas, efecto al pulsar cantidades y animación del favicon      | `reference-motion.ts`, recursos locales                                                                      |
| Catálogo, fotos circulares de la ficha y cronología al hacer scroll                | CSS original de collection-page, product-page y timeline; contenido de Brunette                              |
| Contacto con campos redondeados y fotografía lateral con parallax                  | `contacto.astro`, `ContactForm.tsx` y CSS original de contact-form; también accesible desde `/pages/contact` |

Curva principal: `cubic-bezier(.28,.71,0,.98)`. Marquesinas: 20 s / 34 s en sentido inverso. Arcos y tarjetas continuas: 40 s. Palabras: expo.out, 1.5 s, retraso .3 s y stagger .5 s. Líneas: 1.2 s y stagger .3 s. Botones con expansión desde el mouse: 1.2 s.

## Decisiones de integración

- Identidad, colores y textos proceden de la configuración de Brunette. La longitud de estos textos cambia los saltos de línea respecto al original. Las palabras del hero se ajustan si exceden el ancho disponible, midiendo el texto en mayúsculas como se presenta en pantalla.
- El bloque de newsletter presenta el contacto por WhatsApp. No se muestra un formulario de suscripción sin un servicio que lo procese.
- No se publican testimonios, nombres de empleados ni historia de Bernice como si fueran de Brunette.
- El pedido conserva validación de precios y disponibilidad actuales, sucursales, anticipación y preparación de WhatsApp. El envío requiere la acción del cliente.
- La rueda usa el mismo Lenis local de Bernice, con interpolación 0.1 y un único reloj GSAP sincronizado con ScrollTrigger. Los parallax siguen esa posición sin una segunda interpolación. El tacto conserva el desplazamiento nativo. La preferencia de movimiento reducido desactiva Lenis, incluso si cambia durante la sesión. Los diálogos detienen Lenis y bloquean el fondo; su contenido conserva scroll nativo mediante `data-lenis-prevent`. Los menús permiten teclado y Escape, y el enlace al contenido mueve también el foco.
- El footer queda fijo detrás del bloque de WhatsApp y se descubre desde abajo al hacer scroll. En escritorio usa tres filas dentro de la altura visible bajo la cabecera de 100px: enlaces, logo flexible y créditos. El logo ajusta su tamaño proporcionalmente al espacio restante, sin compresión vertical. Solo las ventanas excepcionalmente bajas, móvil y movimiento reducido siguen el flujo normal.
- GSAP, ScrollTrigger, CSS, fuentes e imágenes se sirven localmente. No se carga código comercial de la plataforma de referencia.
- Se retiró la franja de prueba y su desplazamiento fijo de 28px. La cabecera ocupa 100px, queda en `top:0` y cambia de color según la sección visible, con estado inicial renderizado por Astro.
- Pedido y Contacto muestran un mensaje preparado, permiten copiarlo y generan un enlace `wa.me` con el número configurado. No necesitan un servicio de correo ni una API de WhatsApp, y no envían automáticamente mensajes.
- La captura estática no prueba por sí sola tiempos ni interacción. Las pruebas de navegador verifican estados antes/después de scroll, hover, cambio de pestañas, fotos y apertura/cierre.

## Campos que usa el equipo

- **Portada → Galería de arcos en movimiento:** reemplazar o quitar las nueve imágenes de ejemplo. La repetición continua se genera automáticamente.
- **Productos → Fotos adicionales:** la primera foto distinta de la principal se usa al pasar el mouse por la tarjeta. Las demás están disponibles en la ficha.
- **Productos → Ingredientes destacados:** etiquetas decorativas al pasar el mouse. Se editan por separado de los alérgenos informados.
- **Portada → Presentación e historia:** textos animados, texto alrededor de la imagen y página de historia.
- **Portada → Página de contacto:** título, texto opcional y foto lateral. El destinatario es **Configuración → WhatsApp general**.
- **Configuración:** logo, colores, contacto y reglas generales. **Sucursales:** direcciones, horarios y condiciones por local.
- Guardar borrador y publicar siguen siendo acciones independientes.

## Verificación reproducible

`npm run build`, `npm test`, `node scripts/reference-qa.cjs`, `node scripts/reference-qa.cjs --fixes` y `node scripts/qa.cjs` con el servidor local iniciado. Los reportes y capturas se escriben en `test-results/`. Las comprobaciones cubren pantallas de 1914×916, 1440×1000 y 390×844, movimiento reducido, rueda real sobre la página y el pedido, mensajes preparados, Contacto, administración y pedido. No se afirma igualdad de cada píxel ni cobertura de todas las combinaciones posibles de contenido.

La evidencia REA de la referencia se conserva en el proyecto original: `research/rea-evidence.json`, con el índice y las limitaciones en `research/RECONSTRUCTION.md`.

Scroll (22 de octubre de 2026): `node scripts/scroll-qa.cjs` comprueba interpolación de rueda, reversa, foco del enlace al contenido, bloqueo del fondo, scroll interno del pedido, gesto táctil, movimiento reducido y footer en 1900×918, 1440×900, 1366×768, 1024×600 y 390×844. Verifica que el footer conserve su posición mientras la cortina superior se desplaza, con capturas al 25%, 65% y 100% de la revelación. Requiere el servidor en 4321 (o `QA_BASE_URL`) y al menos un producto disponible para probar el pedido. Capturas en `test-results/scroll-*.png` y `test-results/footer-curtain-*.png`.
