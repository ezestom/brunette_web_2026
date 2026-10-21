const {
  chromium,
} = require("C:/Users/ezequ/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const assert = require("node:assert/strict"),
  fs = require("node:fs");
const base = process.env.QA_BASE_URL || "http://127.0.0.1:4321",
  out = "test-results";
fs.mkdirSync(out, { recursive: true });
let browser, page;
const checks = [],
  errors = [],
  bad = [],
  remote = [];
(async () => {
  browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1914, height: 916 },
  });
  page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) bad.push({ url: r.url(), status: r.status() });
  });
  page.on("request", (r) => {
    if (!r.url().startsWith(base) && !r.url().startsWith("data:"))
      remote.push(r.url());
  });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForTimeout(1600);
  assert.equal(await page.locator(".preview-bar").count(), 0);
  assert.equal(
    await page
      .locator("header")
      .evaluate((e) => Math.round(e.getBoundingClientRect().top)),
    0,
  );
  assert.equal(
    await page
      .locator(".Hero_Section")
      .evaluate((e) => Math.round(e.getBoundingClientRect().top)),
    0,
  );
  assert.equal(
    await page
      .locator("header")
      .evaluate((e) => e.classList.contains("Filled")),
    false,
  );
  assert.equal(await page.evaluate(() => typeof window.Lenis), "undefined");
  await page.screenshot({ path: out + "/fix-home-desktop.png" });
  await page.mouse.move(1000, 400);
  await page.mouse.wheel(0, 450);
  await page.waitForTimeout(150);
  const moved = await page.evaluate(() => scrollY);
  assert.ok(moved >= 430 && moved <= 470, `Rueda: ${moved}`);
  await page.waitForTimeout(350);
  assert.ok(Math.abs((await page.evaluate(() => scrollY)) - moved) <= 1);
  assert.equal(
    await page
      .locator("header")
      .evaluate((e) => e.classList.contains("Filled")),
    false,
  );
  checks.push(
    "Sin franja de prueba; portada comienza arriba y la rueda responde sin retraso",
  );
  await page.evaluate(() => scrollTo(0, innerHeight + 100));
  await page.waitForTimeout(500);
  assert.equal(
    await page
      .locator("header")
      .evaluate((e) => e.classList.contains("Filled")),
    true,
  );
  assert.equal(
    await page
      .locator("header")
      .evaluate((e) => Math.round(e.getBoundingClientRect().top)),
    0,
  );
  await page.screenshot({ path: out + "/fix-header-light-section.png" });
  checks.push(
    "Cabecera transparente sobre la portada y blanca sobre las secciones claras, sin hueco superior",
  );
  await page.goto(base + "/catalogo?categoria=cookies", {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(1600);
  await page.evaluate(() => scrollTo(0, 400));
  await page.waitForTimeout(400);
  assert.equal(
    await page
      .locator("header")
      .evaluate((e) => Math.round(e.getBoundingClientRect().top)),
    0,
  );
  await page.screenshot({ path: out + "/fix-catalog-header.png" });
  await page.locator(".Product_Item button[type=submit]").first().click();
  await page.locator(".cart-dialog[open]").waitFor();
  await page.waitForTimeout(900);
  const area = page.locator(".drawer-scroll"),
    before = await page.evaluate(() => scrollY),
    box = await area.boundingBox();
  assert.ok(await area.evaluate((e) => e.scrollHeight > e.clientHeight));
  await page.mouse.move(box.x + box.width / 2, box.y + 150);
  await page.mouse.wheel(0, 550);
  await page.waitForTimeout(250);
  assert.ok((await area.evaluate((e) => e.scrollTop)) > 300);
  assert.equal(await page.evaluate(() => scrollY), before);
  await page.mouse.wheel(0, -300);
  await page.waitForTimeout(200);
  assert.ok((await area.evaluate((e) => e.scrollTop)) < 400);
  checks.push(
    "Rueda dentro del pedido desplaza el formulario y mantiene el fondo quieto",
  );
  const future = new Date();
  future.setDate(future.getDate() + 4);
  while (future.getDay() === 0) future.setDate(future.getDate() + 1);
  await page
    .getByLabel("Fecha solicitada", { exact: true })
    .fill(future.toLocaleDateString("en-CA"));
  await page.getByLabel("Hora solicitada", { exact: true }).fill("12:00");
  await page.getByLabel("Tu nombre", { exact: true }).fill("Prueba de pedido");
  await page
    .getByRole("button", { name: "Entrega a domicilio", exact: true })
    .click();
  await page
    .getByLabel("Dirección de entrega", { exact: true })
    .fill("Dirección de ejemplo 123");
  await page
    .getByRole("button", {
      name: "Preparar consulta por WhatsApp",
      exact: true,
    })
    .click();
  const prepared = page.getByLabel("Mensaje preparado para WhatsApp", {
    exact: true,
  });
  await prepared.waitFor();
  const text = await prepared.inputValue();
  const link = page.getByRole("link", {
    name: "Abrir WhatsApp para enviar el pedido",
    exact: true,
  });
  const wa = new URL(await link.getAttribute("href"));
  assert.equal(wa.pathname, "/5491168641122");
  assert.equal(wa.searchParams.get("text"), text);
  assert.match(text, /Dirección de ejemplo 123/);
  assert.match(text, /Total estimado/);
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.__copiedMessage = text;
        },
      },
    }),
  );
  await page
    .getByRole("button", { name: "Copiar mensaje", exact: true })
    .click();
  assert.equal(await page.evaluate(() => window.__copiedMessage), text);
  await page.screenshot({ path: out + "/fix-order-whatsapp.png" });
  checks.push(
    "Pedido convertido en mensaje visible y copiable, con enlace WhatsApp correcto sin enviarlo",
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(900);
  assert.equal(await page.locator(".cart-dialog[open]").count(), 0);
  assert.equal(
    await page.evaluate(() =>
      document.documentElement.classList.contains("has-modal"),
    ),
    false,
  );
  await page.goto(base + "/contacto", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page
    .getByRole("heading", { name: "Contactanos", exact: true })
    .waitFor();
  assert.ok(
    await page
      .locator(".Contact_Form_Image img")
      .evaluate((e) => e.complete && e.naturalWidth > 0),
  );
  await page.screenshot({ path: out + "/fix-contact-desktop.png" });
  await page.getByLabel("Nombre", { exact: true }).fill("Ezequiel");
  await page.getByLabel("Apellido", { exact: true }).fill("Prueba");
  await page.getByLabel("Teléfono", { exact: true }).fill("+54 9 11 6864 1122");
  await page.getByLabel("Email", { exact: true }).fill("prueba@example.com");
  await page
    .getByLabel("Contanos qué necesitás", { exact: true })
    .fill(
      "Quiero consultar una torta para retirar.\n¿Cuánta anticipación necesita?",
    );
  await page
    .getByRole("button", { name: "Preparar mensaje", exact: true })
    .click();
  const contactText = await page
    .getByLabel("Mensaje preparado para WhatsApp", { exact: true })
    .inputValue();
  const contactURL = new URL(
    await page
      .getByRole("link", {
        name: "Abrir WhatsApp para enviar la consulta",
        exact: true,
      })
      .getAttribute("href"),
  );
  assert.equal(contactURL.searchParams.get("text"), contactText);
  assert.equal(contactURL.pathname, "/5491168641122");
  assert.match(contactText, /Ezequiel Prueba/);
  assert.match(contactText, /prueba@example.com/);
  await page
    .getByLabel("Contanos qué necesitás", { exact: true })
    .fill("Otra consulta");
  assert.equal(await page.locator(".whatsapp-ready").count(), 0);
  checks.push(
    "Contacto con diseño original, foto y formulario que prepara WhatsApp sin servicio externo",
  );
  await page.goto(base + "/pages/contact", { waitUntil: "networkidle" });
  assert.equal(new URL(page.url()).pathname, "/contacto");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth),
    390,
  );
  await page.screenshot({ path: out + "/fix-home-mobile.png" });
  await page.getByRole("button", { name: "Abrir menú", exact: true }).click();
  await page.waitForTimeout(1300);
  await page
    .getByRole("navigation", { name: "Menú móvil", exact: true })
    .getByRole("link", { name: "Contacto", exact: true })
    .click();
  await page.waitForURL("**/contacto");
  await page.waitForTimeout(1200);
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth),
    390,
  );
  await page.screenshot({ path: out + "/fix-contact-mobile.png" });
  await page.getByRole("button", { name: /Abrir mi pedido/ }).click();
  await page.waitForTimeout(900);
  const mobileArea = page.locator(".drawer-scroll"),
    mbox = await mobileArea.boundingBox();
  await page.mouse.move(mbox.x + mbox.width / 2, mbox.y + 150);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(250);
  assert.ok((await mobileArea.evaluate((e) => e.scrollTop)) > 300);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(900);
  checks.push(
    "Contacto accesible desde menú móvil y pedido desplazable a 390 px",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(bad, []);
  assert.deepEqual(remote, []);
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (process.exitCode && page)
      await page
        .screenshot({ path: out + "/ui-fixes-failure.png" })
        .catch(() => {});
    const report = { success: !process.exitCode, checks, errors, bad, remote };
    fs.writeFileSync(
      out + "/ui-fixes-report.json",
      JSON.stringify(report, null, 2),
    );
    console.log(JSON.stringify(report));
    await browser?.close();
  });
