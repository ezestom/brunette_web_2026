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
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto("http://127.0.0.1:4321/", { waitUntil: "networkidle" });
      await page
        .locator(".site_logo .Logo_Dark img")
        .evaluate((img) => img.decode());
      assert.ok(
        await page
          .locator(".site_logo .Logo_Dark img")
          .evaluate((img) => img.naturalWidth > 0),
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.screenshot({ path: `test-results/logo-${width}.png` });
    }
    console.log("Logo visible en escritorio y móvil, sin desbordamientos.");
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
