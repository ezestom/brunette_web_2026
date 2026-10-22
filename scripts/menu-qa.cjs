const {
  chromium,
} = require("C:/Users/ezequ/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  const bad = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) bad.push(response.url());
  });
  const base = process.env.QA_BASE_URL || "http://127.0.0.1:4321";
  fs.mkdirSync("test-results", { recursive: true });
  try {
    await page.goto(base + "/carta", { waitUntil: "networkidle" });
    const cards = page.locator(".carta-card-item");
    assert.ok((await cards.count()) > 40);
    assert.equal(await page.locator('.carta-page a[href*="wa.me"]').count(), 0);
    const imageLink = cards.first().locator(".Product_Item_Image");
    assert.equal(
      await imageLink.getAttribute("href"),
      "/productos/carta-ristretto",
    );
    await page.screenshot({ path: "test-results/menu-desktop.png" });
    await imageLink.click();
    await page.waitForURL("**/productos/carta-ristretto");
    await page
      .getByRole("heading", { name: "Ristretto", exact: true })
      .waitFor();
    await page.waitForTimeout(1500);
    assert.ok(await page.locator(".Product_Description").innerText());
    assert.ok(await page.locator(".sample-note").innerText());
    assert.equal(
      await page.locator(".back-link").getAttribute("href"),
      "/carta?seccion=bebidas-calientes",
    );
    assert.equal(
      await page
        .locator(".Product_Main_Media img")
        .first()
        .evaluate((image) => image.complete && image.naturalWidth > 0),
      true,
    );
    await page.getByRole("button", { name: "Ver foto 2", exact: true }).click();
    assert.equal(
      await page
        .getByRole("button", { name: "Ver foto 2", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    await page.waitForTimeout(1100);
    await page
      .getByRole("button", { name: "Aumentar cantidad", exact: true })
      .click();
    assert.equal(await page.locator(".reference-quantity").innerText(), "2");
    assert.match(
      await page.locator(".Product_Form_Price").innerText(),
      /6.400/,
    );
    await page.screenshot({ path: "test-results/menu-product-desktop.png" });
    await page
      .getByRole("button", { name: "Agregar a mi pedido", exact: true })
      .click();
    await page.locator(".cart-dialog[open]").waitFor();
    assert.equal(
      await page.locator(".cart-line h3").first().innerText(),
      "Ristretto",
    );
    assert.match(
      await page.locator(".cart-line strong").first().innerText(),
      /6.400/,
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector("dialog[open]"));

    await page.goto(base + "/carta?seccion=dulces", {
      waitUntil: "networkidle",
    });
    await page.getByRole("button", { name: "Ver formato mostrador" }).click();
    await page
      .locator(
        '.carta-board-row[data-board-item="croissant"] .carta-row-price-btn',
      )
      .click();
    await page.waitForURL("**/productos/carta-croissant");
    await page
      .getByRole("heading", { name: "Croissant clásico", exact: true })
      .waitFor();
    const response = await page.request.get(base + "/api/catalog");
    const data = await response.json();
    assert.ok(
      data.menuProducts.some((product) => product.id === "carta-croissant"),
    );
    assert.equal(
      data.products.some((product) => product.id === "carta-croissant"),
      false,
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + "/carta?seccion=bebidas-frias", {
      waitUntil: "networkidle",
    });
    await page
      .locator(".carta-card-item:visible .Product_Item_Submit")
      .first()
      .click();
    await page.waitForURL("**/productos/carta-iced-coffee");
    await page
      .getByRole("heading", { name: "Iced coffee", exact: true })
      .waitFor();
    await page.waitForTimeout(1400);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.screenshot({
      path: "test-results/menu-product-mobile.png",
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Agregar a mi pedido", exact: true })
      .click();
    await page.locator(".cart-dialog[open]").waitFor();
    assert.ok(
      (await page.locator(".cart-items").innerText()).includes("Iced coffee"),
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(bad, []);
    console.log(
      "Menu grid, list, product details, photos, quantity, shared cart and mobile verified.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
