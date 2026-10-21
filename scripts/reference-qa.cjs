if (process.argv.includes("--motion-footer")) {
  require("./motion-footer-qa.cjs");
  return;
}
if (process.argv.includes("--brand")) {
  require("./brand-qa.cjs");
  return;
}
if (process.argv.includes("--fixes")) {
  require("./ui-fixes-qa.cjs");
  return;
}
if (process.argv.includes("--footer")) {
  require("./reference-footer-qa.cjs");
  return;
}
if (process.argv.includes("--mobile-debug")) {
  require("./reference-mobile-debug.cjs");
  return;
}
const {
  chromium,
} = require("C:/Users/ezequ/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const fs = require("node:fs"),
  assert = require("node:assert/strict");
const base = process.env.QA_BASE_URL || "http://127.0.0.1:4321";
const out = "test-results";
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
  });
  const errors = [],
    bad = [],
    checks = [];
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400) bad.push({ url: r.url(), status: r.status() });
    });
    async function home() {
      await page.goto(base, { waitUntil: "networkidle" });
      await page.waitForTimeout(2200);
    }
    await home();
    const initial = await page.evaluate(() => ({
      ready: document.documentElement.dataset.referenceMotion,
      triggers: window.ScrollTrigger.getAll().length,
      font: getComputedStyle(document.querySelector(".Hero_Heading"))
        .fontFamily,
      weight: getComputedStyle(document.querySelector(".Hero_Heading"))
        .fontWeight,
      marquee: [...document.querySelectorAll(".Marquee_Content")].map(
        (e) => getComputedStyle(e).animationDuration,
      ),
      arches: getComputedStyle(document.querySelector(".Arches_Display_Inner"))
        .animationDuration,
      overflow: document.documentElement.scrollWidth - innerWidth,
    }));
    assert.equal(initial.ready, "ready");
    assert.ok(initial.triggers > 30);
    assert.match(initial.font, /Apfel/);
    assert.equal(initial.weight, "700");
    assert.equal(initial.arches, "40s");
    assert.equal(initial.overflow, 0);
    checks.push("Motor GSAP/ScrollTrigger, fuente y duraciones originales");
    await page.screenshot({ path: out + "/reference-desktop.png" });
    const before = await page
      .locator(".Hero_Back_Img img")
      .evaluate((e) => getComputedStyle(e).transform);
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(250);
    assert.notEqual(
      await page
        .locator(".Hero_Back_Img img")
        .evaluate((e) => getComputedStyle(e).transform),
      before,
    );
    checks.push("Parallax de portada y ampliación vinculados al scroll");
    for (const [name, selector] of [
      ["featured", ".Collection_Display_Section"],
      ["arches", ".Arches_Display_Section"],
      ["browser", ".Collections_Browser_Section"],
      ["cta", ".Collections_CTA_Section"],
    ]) {
      await page.locator(selector).scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: out + "/reference-" + name + ".png" });
    }
    await page
      .locator(".Collection_Display_Item .Product_Item_Image")
      .first()
      .scrollIntoViewIfNeeded();
    await page
      .locator(".Collection_Display_Item .Product_Item_Image")
      .first()
      .hover();
    await page.waitForTimeout(900);
    assert.equal(
      await page
        .locator(".Collection_Display_Item .Product_Item_Second_Image")
        .first()
        .evaluate((e) => getComputedStyle(e).opacity),
      "1",
    );
    assert.ok(
      (await page
        .locator(".Collection_Display_Item .Product_Item_Ingredient")
        .count()) > 0,
    );
    await page.screenshot({ path: out + "/reference-product-hover.png" });
    checks.push("Segunda foto y etiquetas animadas al pasar el mouse");
    await page.locator(".Collection_Browser_Tabs").scrollIntoViewIfNeeded();
    await page.getByRole("tab", { name: "Tortas", exact: true }).click();
    await page.waitForTimeout(2300);
    assert.equal(
      await page
        .getByRole("tab", { name: "Tortas", exact: true })
        .getAttribute("aria-selected"),
      "true",
    );
    assert.equal(
      await page
        .locator(".Collection_Browser_Products_Container.Open")
        .getAttribute("data-id"),
      "tortas",
    );
    await page
      .getByRole("button", { name: "Página siguiente de Tortas", exact: true })
      .click();
    await page.waitForTimeout(2300);
    assert.equal(
      await page
        .locator(
          ".Collection_Browser_Products_Container.Open .Collection_Browser_Product_Page.Open",
        )
        .getAttribute("data-page"),
      "1",
    );
    checks.push(
      "Cambio de categoría y paginación con salida/entrada originales",
    );
    await page.evaluate(() => window.scrollTo(0, 0));
    await page
      .getByRole("button", { name: "Buscar productos", exact: true })
      .click();
    await page
      .getByRole("searchbox", { name: "Buscar productos", exact: true })
      .fill("cumpleaños");
    await page.locator("#site-search button[type=submit]").click();
    await page.waitForURL(/\/catalogo\?q=/);
    assert.ok((await page.locator(".Product_Item").count()) >= 1);
    checks.push("Búsqueda desde la cabecera");
    await page.locator(".Product_Item button[type=submit]").first().click();
    await page.locator(".cart-dialog[open]").waitFor();
    assert.equal(
      await page.evaluate(() =>
        document.documentElement.classList.contains("has-modal"),
      ),
      true,
    );
    await page
      .getByRole("button", { name: "Cerrar pedido", exact: true })
      .click();
    await page.waitForTimeout(900);
    assert.equal(await page.locator(".cart-dialog[open]").count(), 0);
    assert.equal(
      await page.evaluate(() =>
        document.documentElement.classList.contains("has-modal"),
      ),
      false,
    );
    checks.push(
      "Carrito React y bloqueo del fondo sincronizados al abrir/cerrar",
    );
    const catalog = await (
      await page.request.get(base + "/api/catalog")
    ).json();
    await page.goto(base + "/productos/" + catalog.products[0].slug, {
      waitUntil: "networkidle",
    });
    await page.waitForTimeout(1300);
    await page.getByRole("button", { name: "Ver foto 2", exact: true }).click();
    await page.waitForTimeout(1100);
    assert.equal(
      await page
        .getByRole("button", { name: "Ver foto 2", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    await page.screenshot({ path: out + "/reference-detail.png" });
    checks.push("Galería circular de producto y contenido actual del CMS");
    await page.setViewportSize({ width: 390, height: 844 });
    await home();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth),
      390,
    );
    assert.ok(
      await page
        .locator(".Hero_Heading .Word")
        .evaluateAll((words) =>
          words.every((w) => w.getBoundingClientRect().right <= innerWidth + 1),
        ),
    );
    await page.screenshot({ path: out + "/reference-mobile.png" });
    await page.getByRole("button", { name: "Abrir menú", exact: true }).click();
    await page.waitForTimeout(1300);
    await page.screenshot({ path: out + "/reference-menu-mobile.png" });
    assert.equal(
      await page.locator(".Menu_Drawer").evaluate((e) => e.open),
      true,
    );
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1300);
    assert.equal(
      await page.locator(".Menu_Drawer").evaluate((e) => e.open),
      false,
    );
    checks.push("Texto sin recortes y menú radial con teclado en móvil");
    for (const route of [
      "/catalogo",
      "/nosotros",
      "/sucursales",
      "/contacto",
      "/productos/" + catalog.products[0].slug,
    ]) {
      await page.goto(base + route, { waitUntil: "networkidle" });
      await page.waitForTimeout(400);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth),
        390,
        route,
      );
      assert.equal(await page.locator("main h1").count(), 1);
    }
    const reduced = await browser.newPage({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    });
    await reduced.goto(base, { waitUntil: "networkidle" });
    await reduced.waitForTimeout(500);
    assert.equal(
      await reduced
        .locator(".Arches_Display_Inner")
        .evaluate((e) => getComputedStyle(e).animationName),
      "none",
    );
    assert.ok(await reduced.locator(".Hero_Heading").isVisible());
    checks.push("Movimiento reducido respetado y páginas sin desbordes");
    assert.deepEqual(errors, []);
    assert.deepEqual(bad, []);
    fs.writeFileSync(
      out + "/reference-report.json",
      JSON.stringify({ success: true, checks, initial, errors, bad }, null, 2),
    );
    console.log(JSON.stringify({ success: true, checks, errors, bad }));
  } catch (e) {
    fs.writeFileSync(
      out + "/reference-report.json",
      JSON.stringify(
        { success: false, error: e.message, errors, bad, checks },
        null,
        2,
      ),
    );
    throw e;
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
