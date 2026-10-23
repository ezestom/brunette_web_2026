const {
  chromium,
} = require("C:/Users/ezequ/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");

(async () => {
  const base = process.env.QA_BASE_URL || "http://127.0.0.1:4323";
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  const external = [],
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (/^https?:/.test(request.url()) && !request.url().startsWith(base + "/"))
      external.push(request.url());
  });
  fs.mkdirSync("test-results", { recursive: true });
  try {
    const response = await page.goto(base, { waitUntil: "networkidle" });
    assert.equal(response.status(), 200);
    assert.match(response.headers()["x-robots-tag"], /noindex/);
    assert.equal(await page.locator('a[href="/admin"]').count(), 0);
    await page.screenshot({ path: "test-results/presentation-home.png" });
    const catalogResponse = await page.request.get(base + "/api/catalog");
    const catalog = await catalogResponse.json();
    assert.equal(catalog.home.previewMode, true);
    assert.ok(catalog.menuProducts.length > 40);
    for (const path of ["/admin", "/api/admin/content", "/api/auth/me"]) {
      assert.equal((await page.request.get(base + path)).status(), 404, path);
    }
    for (const path of ["/data/brunette.sqlite", "/backups/test"]) {
      assert.ok(
        [403, 404].includes((await page.request.get(base + path)).status()),
        path,
      );
    }
    assert.equal(
      (
        await page.request.post(base + "/api/auth/login", {
          data: { email: "demo@example.test", password: "demo" },
        })
      ).status(),
      404,
    );
    await page.goto(base + "/productos/carta-croissant", {
      waitUntil: "networkidle",
    });
    await page
      .getByRole("button", { name: "Agregar a mi pedido", exact: true })
      .click();
    await page.locator(".cart-dialog[open]").waitFor();
    assert.match(
      await page.locator(".cart-items").innerText(),
      /Croissant clásico/,
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector("dialog[open]"));
    await page.goto(base + "/contacto", { waitUntil: "networkidle" });
    await page.route("https://formsubmit.co/ajax/**", (route) =>
      route.fulfill({
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        json: { success: true },
      }),
    );
    await page.locator('[name="firstName"]').fill("Demo");
    await page.locator('[name="email"]').fill("demo@example.test");
    await page
      .locator('[name="message"]')
      .fill("Consulta de prueba para presentación");
    await page
      .getByRole("button", { name: "Enviar mensaje", exact: true })
      .click();
    await page.locator('[data-sileo-toast][data-state="success"]').waitFor();
    assert.equal(await page.locator(".contact-ready").count(), 0);
    await page.waitForURL(base + "/");
    await page.screenshot({ path: "test-results/presentation-contact.png" });
    assert.ok(
      external.length > 0 &&
        external.every((url) => url.startsWith("https://formsubmit.co/ajax/")),
      "Only the mocked email provider may be requested",
    );
    assert.deepEqual(errors, []);
    console.log(
      "Independent presentation verified: public pages, local catalog API, cart, read-only admin and email contact (mocked). No Render requests.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
