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
    for (const [width, height] of [
      [1914, 916],
      [1440, 900],
      [1366, 768],
      [390, 844],
    ]) {
      await page.setViewportSize({ width, height });
      await page.goto("http://127.0.0.1:4321/", { waitUntil: "networkidle" });
      await page.waitForTimeout(1600);
      const credit = page.locator(".developer-credit");
      assert.equal(
        await credit.getAttribute("href"),
        "https://ezestom.is-a.dev/",
      );
      assert.ok(
        await credit
          .locator("img")
          .evaluate((e) => e.complete && e.naturalWidth > 0),
      );
      await page.evaluate(() =>
        scrollTo(0, document.documentElement.scrollHeight),
      );
      await page.waitForTimeout(500);
      const metrics = await page.evaluate(() => {
        const footer = document.querySelector("footer"),
          wordmark = document.querySelector(".brunette-wordmark"),
          range = document.createRange();
        range.selectNodeContents(wordmark);
        return {
          width: innerWidth,
          height: innerHeight,
          footer: footer.offsetHeight,
          fixed: document
            .querySelector(".Footer_Wrapper")
            .classList.contains("Fixed"),
          textWidth: range.getBoundingClientRect().width,
          available: wordmark.clientWidth,
          overflow: document.documentElement.scrollWidth - innerWidth,
        };
      });
      assert.equal(metrics.overflow, 0);
      assert.ok(Math.abs(metrics.textWidth - metrics.available) < 2);
      if (width > 768) assert.ok(metrics.fixed, JSON.stringify(metrics));
      await page.screenshot({
        path: `test-results/motion-footer-${width}.png`,
      });
      console.log(JSON.stringify(metrics));
      const image = page.locator(".Collections_CTA_Image");
      await image.evaluate((e) =>
        scrollTo(
          0,
          e.getBoundingClientRect().top + scrollY - innerHeight * 0.3,
        ),
      );
      await page.waitForTimeout(400);
      const offset = () =>
        page
          .locator(".Collections_CTA_Title_SVG textPath")
          .getAttribute("startOffset");
      const before = Number(await offset());
      const y = await page.evaluate(() => scrollY);
      await page.mouse.move(width / 2, height / 2);
      await page.mouse.wheel(0, 60);
      await page.waitForTimeout(350);
      const after = Number(await offset());
      assert.ok(Math.abs(after - before) > 0.1);
      assert.ok(Math.abs((await page.evaluate(() => scrollY)) - y - 60) < 2);
      assert.equal(
        await page
          .locator(".Collections_CTA_Title_SVG textPath")
          .evaluate((e) => getComputedStyle(e).transitionDuration),
        "0s",
      );
    }
    assert.deepEqual(errors, []);
    console.log(
      "Full-width lettering, desktop curtain reveal, developer link and small native wheel input verified.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
