const {
  chromium,
} = require("C:/Users/ezequ/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
(async () => {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    await page.goto("http://127.0.0.1:4321/", { waitUntil: "networkidle" });
    await page.waitForTimeout(2600);
    console.log(
      JSON.stringify(
        await page
          .locator(".Hero_Heading")
          .evaluate((e) => ({
            text: e.textContent,
            style: e.style.cssText,
            font: getComputedStyle(e).font,
            rect: e.getBoundingClientRect().toJSON(),
            parent: e.parentElement.getBoundingClientRect().toJSON(),
            words: [...e.querySelectorAll(".Word")].map((w) => ({
              text: w.textContent,
              r: w.getBoundingClientRect().toJSON(),
            })),
          })),
        null,
        2,
      ),
    );
    await page.screenshot({ path: "test-results/reference-mobile-debug.png" });
  } finally {
    await browser.close();
  }
})();
