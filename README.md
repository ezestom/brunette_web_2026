# Brunette · web y panel del equipo

Versión local de prueba con **Astro 7, React 19, Tailwind CSS 4, TypeScript y
SQLite**. El clon de referencia sigue intacto en `../bernice-frontend`.

## Abrir ahora

```powershell
npm run dev
```

- Web: http://127.0.0.1:4321/
- Panel: http://127.0.0.1:4321/admin
- Primer acceso: `data/primer-acceso.txt`. La contraseña es aleatoria y se genera
  una sola vez en la instalación local. Cambiala desde **Ayuda**.

También podés ejecutar `iniciar.cmd`. Requiere Node.js 24.15 o posterior.
La instalación actual ya tiene las dependencias; en otra computadora, usar
`npm ci` antes de iniciar.

## Datos incorporados

Se tomaron de la información entregada:

- Café Brunette — Llavallol 4202.
- Mostrador Brunette — Asunción 4185.
- WhatsApp general: +54 9 11 6864-1122.
- Instagram: https://www.instagram.com/brunette.mostradordeantojos/.

Los dos locales usan el WhatsApp general hasta cargar uno específico. **Las
fotos, los productos, los precios, los horarios y las condiciones de entrega son
ejemplos**. La web lo indica y los mensajes preparados se identifican como
pruebas. La paleta verde y clara toma como referencia la imagen de la marca.

## Qué puede editar el equipo

Cada campo tiene su explicación dentro del panel. No se editan archivos de
código ni se usan importes en centavos: se cargan precios en pesos normales.

| Sección       | Para qué sirve                                                                                                              |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Productos     | Nombre, descripción, fotos, categoría, tamaños, precios, disponibilidad, anticipación, alérgenos, destacados y visibilidad. |
| Categorías    | Agrupar el catálogo y editar las fotos y descripciones de cada grupo.                                                       |
| Portada       | Foto principal, bienvenida, historia, galería, título y foto de Contacto, novedades y modo de prueba para mensajes.         |
| Sucursales    | Dirección, mapa, WhatsApp, días y horarios, retiro y entregas de cada local.                                                |
| Configuración | Nombre, logo, colores, contacto general, moneda, anticipación, pedido mínimo y fechas sin pedidos.                          |
| Historial     | Recuperar versiones anteriores como borrador y consultar la actividad.                                                      |
| Usuarios      | Administración crea, desactiva y reactiva accesos o cambia claves del equipo.                                               |
| Ayuda         | Instrucciones para las tareas habituales y cambio de contraseña personal.                                                   |

Las cuentas de **edición** pueden actualizar y publicar el contenido. Solo las
cuentas de **administración** gestionan otros accesos. Las pruebas dejaron una
cuenta de comprobación desactivada, sin acceso a la instalación.

## Borrador → publicación

1. Editar lo necesario.
2. **Guardar borrador** para conservar el trabajo sin cambiar la web.
3. **Publicar cambios** y revisar la confirmación.
4. Abrir la web para comprobar el resultado.

Si otra persona guardó antes, el panel rechaza la versión desactualizada para
evitar sobrescribir su trabajo. Los cambios visibles salen de la base de datos
en cada solicitud; no hace falta recompilar la web para cambiar un precio.
El historial permite recuperar una versión sin publicarla automáticamente.

## Cómo se hacen los pedidos

El cliente agrega productos, elige sucursal y modalidad, indica fecha, hora,
nombre y, para entrega, dirección. La web vuelve a consultar el catálogo
publicado antes de preparar WhatsApp y comprueba:

- Productos visibles y presentaciones disponibles.
- Precios vigentes; si cambiaron, pide revisar el nuevo total.
- Modalidades habilitadas por negocio y sucursal.
- Horarios, días cerrados y anticipación de cada producto.
- Pedido mínimo y costo de entrega, si están definidos.

Después muestra un enlace para **abrir WhatsApp** con el mensaje preparado.
El cliente decide enviarlo. **No se envían mensajes automáticamente, no se
cobra y no se reserva stock**. El local confirma disponibilidad, entrega y pago.
Las zonas de entrega son informativas; su cobertura se coordina por WhatsApp.

## Fotos y datos

Las fotos cargadas se validan y se convierten a WebP, con tamaño máximo de
2000 × 2000, para evitar publicar directamente archivos demasiado pesados.
El panel permite JPG, PNG y WebP de hasta 8 MB y rechaza SVG.

- Base de datos: `data/brunette.sqlite`.
- Fotos cargadas: `data/uploads/`.
- Datos iniciales de ejemplo: `content/demo.json`.

`demo.json` se importa solo al crear una base nueva. Cambiarlo después no
reemplaza el contenido del panel. La carpeta `data` está fuera de los archivos
públicos y excluida de Git.

## Copias de seguridad

```powershell
npm run backup
```

Crea una copia consistente de SQLite y de las fotos en `backups/FECHA/`, incluso
con el servidor funcionando. Guardá una copia fuera del servidor. Los backups
son privados: contienen cuentas y datos de la instalación.

Para recuperar una instalación: detener el servidor, conservar la carpeta de
datos actual, preparar una carpeta de datos nueva con `brunette.sqlite` y
`uploads` del mismo backup y apuntar `BRUNETTE_DATA_DIR` a ella. Volver a iniciar
y comprobar la web y el panel antes de seguir trabajando.

La descarga del panel **Historial → Descargar copia del contenido** es un JSON
de textos y productos; no reemplaza el backup completo de base y fotos.

## Comprobar

```powershell
npm test
npm run build
```

Las pruebas cubren precios, horarios, anticipación, publicación, conflictos y
autenticación. `scripts/qa.cjs` agrega pruebas de navegador con el Playwright y
Chrome del equipo de desarrollo, sin enviar pedidos reales. Las capturas y el
reporte quedan en `test-results/`.

## Llevarla a hosting

Necesita un proceso Node.js y **disco persistente** para SQLite y las imágenes.
Esta versión está preparada para una instancia de servidor. No se debe poner
la carpeta `data` dentro de `public`, ni usar un hosting solo de HTML estático.

1. Instalar dependencias con `npm ci`.
2. Configurar `.env` a partir de `.env.example`, en especial la carpeta de datos
   y `BRUNETTE_SITE_URL`, con el dominio definitivo.
3. Generar con `npm run build` y, en una instalación nueva, ejecutar
   `npm run admin:create`.
4. Iniciar con `npm start` y conectar el dominio mediante HTTPS y un proxy.
5. Configurar backups externos y comprobar acceso, edición, publicación y fotos.

El comando de inicio usa `127.0.0.1` por defecto. `HOST` y `PORT` permiten
adaptarlo al proveedor. En producción no se crean cuentas por visitar una URL;
el primer acceso se genera con el comando administrativo.
El dominio configurado se incluye en los dominios permitidos de Astro para
validar las solicitudes del panel. Si cambia el dominio, volver a compilar.

## Antes de entregar a Brunette

El diseño y el movimiento se trasladaron del clon de Bernice. El mapa de componentes,
los tiempos de animación y las decisiones de adaptación están en
[research/REFERENCE-FIDELITY.md](research/REFERENCE-FIDELITY.md).
Las fotos del carrusel de arcos se cambian en **Portada**; la segunda foto y las
etiquetas al pasar por cada producto se editan en **Productos**. Guardar y publicar
también se aplica a estos cambios.

Reemplazar el catálogo y las fotos de referencia; confirmar horarios,
anticipaciones, precios, cobertura y teléfonos de cada sucursal; cargar el logo;
revisar las cuentas del equipo y desactivar el modo de prueba. La web está
preparada para hacer esos cambios desde el panel.

## Carta de demostración

La carta de venta usa `src/data/menu.ts` y las fotos ilustrativas de
`src/data/menu-photos.ts`. La foto, el nombre y el botón de cada artículo abren
`/productos/carta-<id>` con la misma ficha del catálogo. La vista de mostrador
también abre esas fichas. Cantidad, precios, carrito y preparación de WhatsApp
comparten la lógica del catálogo; navegar por la carta no abre WhatsApp.

Estos artículos son de prueba y se incluyen solamente mientras **Modo de prueba**
está activo. La carta estática no se edita desde el panel de productos: al preparar
la entrega real hay que reemplazar esta fuente por el contenido confirmado del
cliente y conectarla a la edición del panel. El catálogo existente sí conserva
su edición habitual en el panel.

Las 24 fotografías nuevas se sirven como WebP locales desde
`public/assets/menu-demo/`. Fuentes y licencia en
[research/MENU-PHOTO-SOURCES.md](research/MENU-PHOTO-SOURCES.md).
`node scripts/import-menu-photos.mjs` permite volver a descargarlas;
también acepta nombres concretos, por ejemplo `espresso water`.

Verificación: `npm test`, `npm run build` y `node scripts/menu-qa.cjs` con el
servidor iniciado. La prueba de navegador cubre ambas vistas, detalle, galería,
cantidad, carrito, API pública y móvil. Capturas en `test-results/menu-*.png`.

## Demo independiente en Vercel

Hay dos destinos dentro del mismo proyecto:

| Destino | Compilación | Contenido y edición |
| --- | --- | --- |
| Render | `npm run build` y `npm start` | SQLite, fotos cargadas y panel completos. |
| Vercel | `npm run build:vercel` | Copia pública de presentación, independiente de Render, sin panel ni escrituras. |

Para actualizar la copia de presentación desde el contenido **publicado local**:

```powershell
npm run demo:export
```

El comando genera `content/presentation.json` y copia únicamente las imágenes
cargadas que ese contenido utiliza a `public/presentation-media/`. No exporta
usuarios, contraseñas, borradores, sesiones ni la base de datos. Estos archivos
públicos se versionan junto con el código. El modo de prueba se conserva activo.
Las modificaciones posteriores del panel de Render no se sincronizan con la demo;
hay que actualizar la copia y desplegar de nuevo cuando se quiera mostrarlas.

En Vercel, importar el repositorio en el proyecto `brunette-web-2026`, con:

- Framework: **Astro**.
- Carpeta raíz: la raíz del repositorio.
- Node.js: **24.x**.
- Build Command: `npm run build:vercel` (ya declarado en `vercel.json`).
- Output Directory: dejar la configuración automática del adaptador.
- No hace falta una URL de Render ni credenciales de la base de datos.

En **Settings → Environments → Production → Branch Tracking**, Vercel sigue
`codex/vercel-presentation`. Render conserva su configuración y su rama habitual.
Para actualizar la demo, subir los cambios a `codex/vercel-presentation`; subirlos
solo a `main` no actualiza este destino. Para desplegar una rama que ya existe,
usar **Deployments → Create Deployment**, seleccionar esa rama y confirmar
**Deploy to Production**.

Un despliegue marcado **Ready** solo confirma que terminó la compilación. Si el
dominio muestra el 404 de Vercel, comprobar también la rama y el commit en
**Overview → Source**: la demo necesita esta configuración del adaptador de
Vercel y el comando `build:vercel`, que no estaban en el commit `4e5f769` de `main`.

La compilación incorpora el modo de presentación en el paquete del servidor;
no depende de definir una variable adicional durante la ejecución en Vercel.
Las fichas, filtros, carta, carrito y preparación de WhatsApp funcionan con la
API de catálogo local de la demo. Contacto prepara una consulta de prueba y no
envía correos reales. El panel y sus APIs están desactivados en este destino.
Las páginas llevan `noindex` para no indexar la presentación como sitio real.

Para probar localmente: `npm run demo:dev`. El servidor toma el siguiente puerto
libre a partir de 4321. `node scripts/presentation-qa.cjs` usa 4323 por defecto;
`QA_BASE_URL` permite elegir otro puerto. La prueba comprueba que no haya
solicitudes a Render ni a servicios externos de correo.

`npm run build:vercel` verifica que el paquete desplegable no contenga bases de
datos, archivos de acceso ni `.env`. Después se puede comprobar la función ya
compilada con `node scripts/vercel-runtime-qa.mjs`. La dependencia de rutas del
adaptador fija `path-to-regexp` 6.3.0 mediante `overrides` para usar la versión
corregida dentro de la misma versión mayor.

# brunette_web_2026
