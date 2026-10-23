// Exercise the production Vercel artifact in an isolated browser, not the dev server.
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const http = require("node:http");
const { pathToFileURL } = require("node:url");
const {
  chromium,
} = require("C:/Users/ezequ/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

(async () => {
  const baseline = process.argv.includes("--baseline");
  const root = path.resolve(".vercel/output/functions/_render.func");
  const config = JSON.parse(
    await fs.readFile(path.join(root, ".vc-config.json"), "utf8"),
  );
  const handler = (
    await import(pathToFileURL(path.join(root, config.handler)).href)
  ).default;
  const staticRoot = path.resolve(".vercel/output/static");
  const mime = {
    ".js": "text/javascript",
    ".css": "text/css",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".webp": "image/webp",
  };
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const file = path.resolve(
        staticRoot,
        `.${decodeURIComponent(url.pathname)}`,
      );
      if (file.startsWith(staticRoot + path.sep)) {
        try {
          const bytes = await fs.readFile(file);
          res.setHeader(
            "Content-Type",
            mime[path.extname(file)] || "application/octet-stream",
          );
          res.end(bytes);
          return;
        } catch {}
      }
      const response = await handler.fetch(new Request(url));
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      res.writeHead(500);
      res.end(String(error));
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(() => {
      window.__perf = { canvasClears: 0, clearedPixels: 0, longTasks: [] };
      const clear = CanvasRenderingContext2D.prototype.clearRect;
      CanvasRenderingContext2D.prototype.clearRect = function (...args) {
        if (this.canvas.id === "js-front-canvas") {
          window.__perf.canvasClears++;
          window.__perf.clearedPixels += args[2] * args[3];
        }
        return clear.apply(this, args);
      };
      new PerformanceObserver((list) =>
        window.__perf.longTasks.push(
          ...list.getEntries().map((e) => e.duration),
        ),
      ).observe({ type: "longtask", buffered: true });
    });
    await page.goto(base + "/carta?seccion=cookies", {
      waitUntil: "networkidle",
    });
    await page.waitForTimeout(1500);
    const beforeIdle = await page.evaluate(() => ({ ...window.__perf }));
    await page.waitForTimeout(1000);
    const idle = await page.evaluate((before) => {
      const canvas = document.querySelector("#js-front-canvas");
      return {
        clears: window.__perf.canvasClears - before.canvasClears,
        pixels: window.__perf.clearedPixels - before.clearedPixels,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        viewportHeight: innerHeight,
      };
    }, beforeIdle);
    await page.evaluate(() => {
      window.__perf.longTasks = [];
    });
    const filters = [];
    for (const name of [
      "Todas",
      "Tortas",
      "Bebidas Frías",
      "Dulces",
      "Cookies",
      "Todas",
    ]) {
      const start = Date.now();
      await page.getByRole("button", { name, exact: true }).click();
      await page.evaluate(
        () =>
          new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r)),
          ),
      );
      filters.push({ name, ms: Date.now() - start });
    }
    await page
      .getByRole("searchbox", { name: "Buscar en la carta", exact: true })
      .fill("chocolate");
    await page.waitForFunction(() =>
      document
        .querySelector("#carta-result-count")
        .textContent.includes("chocolate"),
    );
    await page
      .getByRole("searchbox", { name: "Buscar en la carta", exact: true })
      .fill("");
    await page
      .getByRole("button", { name: "Ver formato mostrador", exact: true })
      .click();
    assert.equal(await page.locator("#carta-list-container").isVisible(), true);
    await page
      .getByRole("button", { name: "Ver con fotos", exact: true })
      .click();
    await page.mouse.wheel(0, 1000);
    await page.waitForTimeout(400);
    const longTasks = await page.evaluate(() => window.__perf.longTasks);
    const navigationStart = Date.now();
    await page
      .getByRole("link", {
        name: "Ver Cookie de chocolate y marshmallow",
        exact: true,
      })
      .click();
    await page.waitForURL("**/productos/smores-cookie-4oz");
    const navigationMs = Date.now() - navigationStart;
    await page
      .getByRole("button", { name: "Agregar a mi pedido", exact: true })
      .click();
    await page.locator(".cart-dialog[open]").waitFor();
    // Keep the bite interaction, but its canvas must go back to sleep afterward.
    await page.goto(base + "/catalogo?categoria=cookies", {
      waitUntil: "networkidle",
    });
    await page
      .getByRole("button", {
        name: "Aumentar cantidad de Cookie de chocolate y marshmallow",
        exact: true,
      })
      .click();
    await page.waitForTimeout(200);
    const activeClears = await page.evaluate(() => window.__perf.canvasClears);
    await page.waitForTimeout(1500);
    const settled = await page.evaluate(() => window.__perf.canvasClears);
    await page.waitForTimeout(1000);
    const settledClears = await page.evaluate(
      (count) => window.__perf.canvasClears - count,
      settled,
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + "/carta?seccion=cookies", {
      waitUntil: "networkidle",
    });
    const mobile = await page.evaluate(() => ({
      canvasHeight: document.querySelector("#js-front-canvas").height,
      viewportHeight: innerHeight,
      overflow: document.documentElement.scrollWidth > innerWidth,
      columns: getComputedStyle(
        document.querySelector(".carta-product-grid"),
      ).gridTemplateColumns.split(" ").length,
    }));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload({ waitUntil: "networkidle" });
    await page
      .getByRole("button", { name: "Bebidas Frías", exact: true })
      .click();
    const reducedClears = await page.evaluate(() => window.__perf.canvasClears);
    // A filtered page must still reveal the shared animated footer.
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base + "/carta", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Salados", exact: true }).click();
    const footerTitle = page.locator(".Newsletter_Container h2");
    await footerTitle.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const spans = [
        ...document.querySelectorAll(".Newsletter_Container h2 .Line > span"),
      ];
      return (
        spans.length > 0 &&
        spans.every(
          (span) =>
            Math.abs(new DOMMatrix(getComputedStyle(span).transform).m42) < 0.5,
        )
      );
    });
    assert.equal(
      await footerTitle.getAttribute("aria-label"),
      "Siempre hay lugar para un antojo",
    );
    await page.screenshot({ path: "test-results/carta-footer-fixed.png" });
    // Mock the provider: no real email is sent by this test.
    let emailConfirmed = false;
    let activationPending = false;
    let emailRequests = 0;
    await page.route("https://formsubmit.co/ajax/**", async (route) => {
      if (route.request().method() === "OPTIONS") {
        await route.fulfill({
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
        return;
      }
      emailRequests++;
      await route.fulfill({
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        json: {
          success: emailConfirmed,
          message: activationPending
            ? "Activation required"
            : emailConfirmed
              ? "Success"
              : "Rejected",
        },
      });
    });
    await page.goto(base + "/contacto", { waitUntil: "networkidle" });
    await page
      .getByRole("textbox", { name: "Nombre", exact: true })
      .fill("Demo");
    await page
      .getByRole("textbox", { name: "Email", exact: true })
      .fill("demo@example.test");
    await page
      .getByRole("textbox", { name: "Contanos qué necesitás", exact: true })
      .fill("Prueba automatizada de contacto");
    await page
      .getByRole("button", { name: "Enviar mensaje", exact: true })
      .click();
    await page.locator(".contact-alert").waitFor();
    assert.equal(
      await page.locator('[name="message"]').inputValue(),
      "Prueba automatizada de contacto",
    );
    assert.equal(await page.locator(".contact-ready").count(), 0);
    assert.equal(await page.locator("[data-sileo-toast]").count(), 1);
    const toastWidth = await page
      .locator("[data-sileo-svg]")
      .evaluate((el) => el.getBoundingClientRect().width);
    assert.ok(
      toastWidth > 300,
      "Toast artwork must not inherit the 24px icon size",
    );
    await page.screenshot({ path: "test-results/contact-email-error.png" });
    activationPending = true;
    await page
      .getByRole("button", { name: "Enviar mensaje", exact: true })
      .click();
    await page.waitForFunction(() =>
      document
        .querySelector(".contact-alert")
        ?.textContent.includes("Activate Form"),
    );
    await page.locator('[data-sileo-toast][data-state="warning"]').waitFor();
    assert.equal(await page.locator('[name="firstName"]').inputValue(), "Demo");
    activationPending = false;
    emailConfirmed = true;
    await page
      .getByRole("button", { name: "Enviar mensaje", exact: true })
      .click();
    await page.waitForFunction(
      () => document.querySelector('[name="firstName"]').value === "",
    );
    await page
      .locator('[data-sileo-toast][data-state="success"][data-ready="true"]')
      .waitFor();
    await page.waitForTimeout(700);
    await page.screenshot({ path: "test-results/contact-email-success.png" });
    await page.waitForURL(base + "/");
    assert.equal(emailRequests, 3);
    const metrics = {
      idle,
      filters,
      navigationMs,
      longTasks,
      activeClears,
      settledClears,
      errors,
      mobile,
      reducedClears,
      contactAndFooter: "passed (email provider mocked)",
    };
    await fs.mkdir("test-results", { recursive: true });
    await fs.writeFile(
      `test-results/carta-performance-${baseline ? "baseline" : "fixed"}.json`,
      JSON.stringify(metrics, null, 2),
    );
    console.log(JSON.stringify(metrics, null, 2));
    assert.deepEqual(errors, []);
    if (!baseline) {
      assert.equal(idle.clears, 0, "Particles must not draw while idle");
      assert.ok(
        idle.canvasHeight <= idle.viewportHeight,
        "Canvas must fit the viewport",
      );
      assert.ok(
        filters.every((f) => f.ms < 500),
        "Filters must respond without blocking",
      );
      assert.ok(activeClears > 0, "The particle effect must still play");
      assert.ok(mobile.canvasHeight <= mobile.viewportHeight);
      assert.equal(mobile.columns, 1);
      assert.equal(mobile.overflow, false);
      assert.equal(reducedClears, 0);
      assert.equal(
        settledClears,
        0,
        "The particle loop must stop after the effect",
      );
    }
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
