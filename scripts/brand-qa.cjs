const {
  chromium,
} = require("C:/Users/ezequ/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await page.goto("http://127.0.0.1:4321/", { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1500);
      assert.equal(
        await page.locator(".Logo_Light img").getAttribute("src"),
        "/assets/brunette-logo-beige.jpg",
      );
      assert.equal(
        await page.locator(".Logo_Light img").evaluate((e) => e.naturalWidth),
        640,
      );
      const brand = page.locator(".brunette-wordmark");
      assert.equal(await brand.textContent(), "Brunette");
      assert.deepEqual(await brand.locator(".brand-italic").allTextContents(), [
        "B",
        "u",
        "tt",
      ]);
      assert.equal(
        await brand
          .locator(".brand-italic")
          .first()
          .evaluate((e) => getComputedStyle(e).fontStyle),
        "italic",
      );
      assert.ok(
        await page.evaluate(() =>
          document.fonts.check('italic 16px "Brunette Serif"'),
        ),
      );
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth),
        width,
      );
      await page.screenshot({ path: `test-results/brand-header-${width}.png` });
      await page.evaluate(() =>
        scrollTo(0, document.documentElement.scrollHeight),
      );
      await page.waitForTimeout(500);
      await page.evaluate(() =>
        scrollTo(0, document.documentElement.scrollHeight),
      );
      await page.waitForTimeout(300);
      await page.screenshot({ path: `test-results/brand-footer-${width}.png` });
      console.log(
        JSON.stringify({
          width,
          brand: await brand.evaluate((e) => {
            const r = document.createRange();
            r.selectNodeContents(e);
            return {
              font: getComputedStyle(e).fontFamily,
              size: getComputedStyle(e).fontSize,
              textWidth: r.getBoundingClientRect().width,
              available: e.clientWidth,
            };
          }),
        }),
      );
    }
    assert.deepEqual(errors, []);
    console.log(
      "Logo beige, mayúsculas/minúsculas y cursivas correctos en escritorio y móvil.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
