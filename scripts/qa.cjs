const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const {
  chromium,
} = require("C:/Users/ezequ/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const base =
  process.argv[2] || process.env.QA_BASE_URL || "http://127.0.0.1:4321";
const out = path.join(__dirname, "../test-results");
fs.mkdirSync(out, { recursive: true });
let browser, admin, baseline;
const errors = [],
  badResponses = [],
  checks = [];
async function track(page) {
  page.on("pageerror", (e) =>
    errors.push({ page: page.url(), error: e.message }),
  );
  page.on("response", (r) => {
    if (r.status() >= 500)
      badResponses.push({ url: r.url(), status: r.status() });
  });
}
async function api(context, route, method = "GET", body) {
  const response = await context.request.fetch(base + "/api/" + route, {
    method,
    headers: { origin: base },
    ...(body ? { data: body } : {}),
  });
  return { response, data: await response.json() };
}
(async () => {
  browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  await track(page);
  await page.goto(base, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(out, "home-desktop.png") });
  const catalog = (await api(context, "catalog")).data;
  assert.equal(catalog.branches.length, 2);
  assert.equal(catalog.settings.whatsapp, "5491168641122");
  checks.push("Sucursal y WhatsApp configurados");
  for (const route of [
    "/catalogo",
    "/nosotros",
    "/sucursales",
    "/productos/" + catalog.products[0].slug,
  ]) {
    await page.goto(base + route, { waitUntil: "networkidle" });
    assert.equal(await page.locator("main h1").count(), 1);
  }
  await page.goto(base + "/catalogo", { waitUntil: "networkidle" });
  await page
    .getByRole("button", {
      name: "Agregar " + catalog.products[0].name,
      exact: true,
    })
    .click();
  await page.getByLabel("Tu nombre", { exact: true }).fill("Prueba automática");
  const future = new Date();
  future.setDate(future.getDate() + 4);
  while (future.getDay() === 0) future.setDate(future.getDate() + 1);
  const date = future.toLocaleDateString("en-CA");
  await page.getByLabel("Fecha solicitada", { exact: true }).fill(date);
  await page.getByLabel("Hora solicitada", { exact: true }).fill("12:00");
  await page
    .getByRole("button", { name: "Entrega a domicilio", exact: true })
    .click();
  await page
    .getByLabel("Dirección de entrega", { exact: true })
    .fill("Dirección de prueba 123");
  await page
    .getByRole("button", {
      name: "Preparar consulta por WhatsApp",
      exact: true,
    })
    .click();
  const whatsapp = page.getByRole("link", { name: /Abrir WhatsApp/ });
  await whatsapp.waitFor();
  const url = new URL(await whatsapp.getAttribute("href"));
  assert.equal(url.pathname, "/5491168641122");
  assert.match(url.searchParams.get("text"), /Dirección de prueba 123/);
  checks.push("Pedido validado y enlace WhatsApp preparado sin enviarlo");
  await page.screenshot({ path: path.join(out, "pedido.png") });
  await page.keyboard.press("Escape");
  assert.equal(
    (await context.request.get(base + "/api/admin/content")).status(),
    401,
  );
  assert.equal(
    (
      await context.request.post(base + "/api/auth/login", {
        headers: { origin: "https://otro-sitio.invalid" },
        data: { email: "x", password: "x" },
      })
    ).status(),
    403,
  );
  assert.ok(
    [403, 404].includes(
      (await context.request.get(base + "/data/primer-acceso.txt")).status(),
    ),
  );
  checks.push(
    "Panel privado, origen validado y credenciales fuera del directorio público",
  );
  // Read local test credentials without printing or embedding them in reports.
  const access = fs.readFileSync(
    path.join(__dirname, "../data/primer-acceso.txt"),
    "utf8",
  );
  const email = access.match(/Usuario: (.+)/)[1].trim(),
    password = access.match(/Contraseña: (.+)/)[1].trim();
  admin = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const panel = await admin.newPage();
  await track(panel);
  await panel.goto(base + "/admin", { waitUntil: "networkidle" });
  await panel.screenshot({ path: path.join(out, "login.png") });
  await panel.getByLabel("Correo", { exact: true }).fill(email);
  await panel.getByLabel("Contraseña", { exact: true }).fill(password);
  await panel.getByRole("button", { name: /Ingresar al panel/ }).click();
  await panel.getByRole("heading", { name: "Resumen", exact: true }).waitFor();
  await panel.screenshot({ path: path.join(out, "panel-resumen.png") });
  baseline = (await api(admin, "admin/content")).data.draft;
  await panel.getByRole("button", { name: /Productos$/ }).click();
  await panel.locator(".admin-list > button").first().click();
  const price = panel.locator(".variant-editor .money-input input").first();
  await price.fill("9876");
  await panel
    .getByRole("button", { name: "Guardar borrador", exact: true })
    .click();
  await panel
    .getByText("Borrador guardado. Para verlo en la web, publicá los cambios.")
    .waitFor();
  const publishedBefore = (await api(admin, "catalog")).data;
  assert.equal(
    publishedBefore.products[0].variants[0].price,
    baseline.products[0].variants[0].price,
  );
  await panel
    .getByRole("button", { name: "Publicar cambios ↗", exact: true })
    .click();
  await panel
    .getByRole("button", { name: "Sí, guardar y publicar", exact: true })
    .click();
  await panel.getByText("Cambios publicados. Ya se ven en la web.").waitFor();
  const publishedAfter = (await api(admin, "catalog")).data;
  assert.equal(publishedAfter.products[0].variants[0].price, 987600);
  checks.push("Borrador aislado y precio publicado actualizado");
  await panel.screenshot({ path: path.join(out, "panel-producto.png") });
  const stale = await api(admin, "admin/content", "PUT", {
    content: baseline,
    expectedRevision: baseline.revision,
  });
  assert.equal(stale.response.status(), 409);
  checks.push("Edición concurrente protegida");
  const svg = await admin.request.post(base + "/api/admin/uploads", {
    headers: { origin: base },
    multipart: {
      file: {
        name: "prueba.svg",
        mimeType: "image/svg+xml",
        buffer: Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
        ),
      },
    },
  });
  assert.equal(svg.status(), 400);
  const imageFile = path.join(
    __dirname,
    "../public",
    catalog.products[0].image,
  );
  const upload = await admin.request.post(base + "/api/admin/uploads", {
    headers: { origin: base },
    multipart: {
      file: {
        name: "prueba.jpg",
        mimeType: "image/jpeg",
        buffer: fs.readFileSync(imageFile),
      },
    },
  });
  assert.equal(upload.status(), 200);
  const media = await upload.json();
  assert.equal((await context.request.get(base + media.url)).status(), 200);
  checks.push("Fotos subidas, servidas y SVG rechazado");
  for (const section of [
    "Portada",
    "Sucursales",
    "Configuración",
    "Historial",
    "Usuarios",
    "Ayuda",
  ]) {
    await panel
      .getByRole("button", { name: new RegExp(section + "$") })
      .click();
    await panel.waitForTimeout(80);
  }
  await panel.getByRole("button", { name: /Sucursales$/ }).click();
  await panel.locator(".admin-list > button").first().click();
  await panel.screenshot({ path: path.join(out, "panel-sucursal.png") });
  const staffEmail = "prueba-permisos@brunette.local";
  const staffPassword = "Prueba-permisos-" + Date.now();
  let staffUser = (await api(admin, "admin/users")).data.users.find(
    (u) => u.email === staffEmail,
  );
  if (staffUser)
    await api(admin, "admin/users", "PATCH", {
      id: staffUser.id,
      active: true,
      password: staffPassword,
    });
  else {
    const created = await api(admin, "admin/users", "POST", {
      name: "Prueba de permisos",
      email: staffEmail,
      password: staffPassword,
      role: "editor",
    });
    assert.equal(created.response.status(), 201);
    staffUser = { id: created.data.id };
  }
  const staff = await browser.newContext();
  assert.equal(
    (
      await api(staff, "auth/login", "POST", {
        email: staffEmail,
        password: staffPassword,
      })
    ).response.status(),
    200,
  );
  assert.equal((await api(staff, "admin/users")).response.status(), 403);
  await api(admin, "admin/users", "PATCH", { id: staffUser.id, active: false });
  assert.equal((await api(staff, "admin/content")).response.status(), 401);
  await staff.close();
  checks.push("Permisos de personal, cambio de clave y revocación de acceso");
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const mp = await mobile.newPage();
  await track(mp);
  await mp.goto(base, { waitUntil: "networkidle" });
  await mp.screenshot({ path: path.join(out, "home-mobile.png") });
  assert.equal(
    await mp.evaluate(() => document.documentElement.scrollWidth),
    390,
  );
  await mp.getByRole("button", { name: "Abrir menú", exact: true }).click();
  await mp
    .getByRole("navigation", { name: "Menú móvil", exact: true })
    .getByRole("link", { name: "Cookies", exact: true })
    .click();
  await mp.waitForURL(/\/catalogo/);
  await mp.screenshot({ path: path.join(out, "catalogo-mobile.png") });
  const mobileAdmin = await browser.newContext({
    viewport: { width: 390, height: 844 },
    storageState: await admin.storageState(),
  });
  const ma = await mobileAdmin.newPage();
  await track(ma);
  await ma.goto(base + "/admin", { waitUntil: "networkidle" });
  await ma.screenshot({ path: path.join(out, "panel-mobile.png") });
  assert.equal(
    await ma.evaluate(() => document.documentElement.scrollWidth),
    390,
  );
  await ma.getByLabel("Sección del panel").selectOption("Sucursales");
  await ma.locator(".admin-list > button").first().click();
  assert.equal(
    await ma.evaluate(() => document.documentElement.scrollWidth),
    390,
  );
  await ma.screenshot({ path: path.join(out, "panel-horarios-mobile.png") });
  checks.push("Web, panel y edición de horarios adaptados a móvil");
  if (errors.length || badResponses.length)
    throw new Error(
      "Errores en navegador: " + JSON.stringify({ errors, badResponses }),
    );
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (admin && baseline) {
      try {
        const latest = (await api(admin, "admin/content")).data.draft;
        const saved = await api(admin, "admin/content", "PUT", {
          content: { ...baseline, revision: latest.revision },
          expectedRevision: latest.revision,
        });
        await api(admin, "admin/publish", "POST", {
          expectedRevision: saved.data.draft.revision,
        });
      } catch (e) {
        console.error("No se pudo recuperar la demo original:", e.message);
        process.exitCode = 1;
      }
    }
    fs.writeFileSync(
      path.join(out, "report.json"),
      JSON.stringify(
        { checks, errors, badResponses, success: !process.exitCode },
        null,
        2,
      ),
    );
    console.log(
      JSON.stringify(
        { checks, errors, badResponses, success: !process.exitCode },
        null,
        2,
      ),
    );
    await browser?.close();
  });
