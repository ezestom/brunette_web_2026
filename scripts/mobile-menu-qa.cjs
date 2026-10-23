const { chromium } = require("C:/Users/ezequ/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  fs.mkdirSync("test-results", { recursive: true });
  try {
    for (const viewport of [
      { width: 393, height: 852 },
      { width: 820, height: 1180 },
      { width: 1024, height: 768 },
      { width: 844, height: 390 },
    ]) {
      const page = await browser.newPage({ viewport });
      await page.goto(process.env.QA_BASE_URL || "http://127.0.0.1:4321", {
        waitUntil: "networkidle",
      });
      await page.locator("[data-action=open-side-menu]").click();
      await page.waitForTimeout(1400);
      const drawer = page.locator(".Menu_Drawer");
      const geometry = await drawer.evaluate((element) => {
        const last = element.lastElementChild.getBoundingClientRect();
        const padding = parseFloat(getComputedStyle(element).paddingBottom);
        return {
          actual: element.scrollHeight,
          expected: Math.max(element.clientHeight, Math.ceil(last.bottom + padding)),
        };
      });
      assert.ok(
        geometry.actual <= geometry.expected + 1,
        `${viewport.width}: decorative background creates empty scroll: ${JSON.stringify(geometry)}`,
      );
      const scrollY = await page.evaluate(() => window.scrollY);
      await page.mouse.move(viewport.width / 2, viewport.height / 2);
      await page.mouse.wheel(0, 2000);
      await page.waitForTimeout(300);
      assert.equal(await page.evaluate(() => window.scrollY), scrollY);
      await drawer.evaluate((element) => { element.scrollTop = element.scrollHeight; });
      assert.equal(
        await drawer.evaluate((element) => getComputedStyle(element).backgroundColor),
        await page.evaluate(() => getComputedStyle(document.body).color),
        "The entire scrollable panel must have the brand background",
      );
      await page.screenshot({ path: `test-results/mobile-menu-${viewport.width}.png` });
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => !document.querySelector(".Menu_Drawer[open]"));
      assert.equal(await page.locator("html").evaluate(e => e.classList.contains("has-modal")), false);
      await page.locator("[data-action=open-side-menu]").click();
      await page.waitForTimeout(1400);
      await page.getByRole("button", { name: "Cerrar menú", exact: true }).click();
      await page.waitForFunction(() => !document.querySelector(".Menu_Drawer[open]"));
      console.log(`Menu scroll and close controls OK: ${viewport.width}x${viewport.height}`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
