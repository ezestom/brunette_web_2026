const {
  chromium,
} = require("C:/Users/ezequ/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const base = process.env.QA_BASE_URL || "http://127.0.0.1:4321";
  fs.mkdirSync("test-results", { recursive: true });
  try {
    await page.goto(base, { waitUntil: "networkidle" });
    await page.waitForFunction(() =>
      document.documentElement.classList.contains("lenis"),
    );
    await page.waitForTimeout(1600);
    await page.screenshot({ path: "test-results/scroll-hero.png" });
    await page.mouse.move(700, 450);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(80);
    const initial = await page.evaluate(() => scrollY);
    assert.ok(
      initial > 0 && initial < 490,
      `Wheel should ease into motion: ${initial}`,
    );
    await page.waitForTimeout(1300);
    const settled = await page.evaluate(() => scrollY);
    assert.ok(
      Math.abs(settled - 500) < 3,
      `Wheel should retain its distance: ${settled}`,
    );
    await page.mouse.wheel(0, -60);
    await page.waitForTimeout(1000);
    assert.ok(Math.abs((await page.evaluate(() => scrollY)) - 440) < 3);

    await page.locator(".header-cart").click();
    await page.waitForFunction(() =>
      document.documentElement.classList.contains("lenis-stopped"),
    );
    const locked = await page.evaluate(() => scrollY);
    await page.mouse.move(20, 450);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => scrollY), locked);
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector("dialog[open]"));
    await page.waitForFunction(
      () => !document.documentElement.classList.contains("lenis-stopped"),
    );
    await page.locator(".skip-link").focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1200);
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "contenido",
    );
    assert.ok((await page.evaluate(() => scrollY)) < 3);

    for (const [width, height] of [
      [1900, 918],
      [1440, 900],
      [1366, 768],
      [1024, 600],
      [390, 844],
    ]) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(400);
      await page.evaluate(() =>
        scrollTo(0, document.documentElement.scrollHeight),
      );
      await page.waitForTimeout(700);
      const result = await page.evaluate(() => {
        const footer = document.querySelector("footer");
        const wrapper = footer.parentElement;
        const bounds = footer.getBoundingClientRect();
        const fixed = wrapper.classList.contains("Fixed");
        return {
          width: innerWidth,
          height: innerHeight,
          fixed,
          overflow: document.documentElement.scrollWidth - innerWidth,
          reachable: bounds.bottom <= innerHeight + 2,
          fits:
            !fixed ||
            bounds.top >= document.querySelector("header").offsetHeight,
          transform: getComputedStyle(
            document.querySelector(".brunette-wordmark"),
          ).transform,
        };
      });
      assert.equal(result.overflow, 0, JSON.stringify(result));
      assert.ok(result.reachable && result.fits, JSON.stringify(result));
      assert.equal(
        result.transform,
        "none",
        "Keep the wordmark's natural proportions",
      );
      if (width === 390) assert.equal(result.fixed, false);
      if (width > 768)
        assert.equal(
          result.fixed,
          true,
          "Desktop curtain should reveal the footer",
        );
      await page.screenshot({
        path: `test-results/scroll-footer-${width}.png`,
      });
      console.log(result);
      if (width > 768) {
        const reveal = [];
        for (const progress of [0.25, 0.65, 1]) {
          await page.evaluate((progress) => {
            const space = document.querySelector(".Footer_Space");
            const start =
              space.getBoundingClientRect().top + scrollY - innerHeight;
            scrollTo(0, start + space.offsetHeight * progress);
          }, progress);
          await page.waitForTimeout(350);
          reveal.push(
            await page.evaluate(() => ({
              footer: document.querySelector("footer").getBoundingClientRect()
                .top,
              curtain: document
                .querySelector(".Newsletter_Section")
                .getBoundingClientRect().bottom,
            })),
          );
          await page.screenshot({
            path: `test-results/footer-curtain-${width}-${progress}.png`,
          });
        }
        assert.ok(
          Math.abs(reveal[0].footer - reveal[1].footer) < 2,
          "Footer stays fixed while the curtain moves",
        );
        assert.ok(
          reveal[0].curtain - reveal[1].curtain > 100,
          "Content progressively uncovers the footer",
        );
      }
    }

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(
      () => !document.documentElement.classList.contains("lenis"),
    );
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.locator("html.lenis").count(), 0);
    assert.equal(await page.locator(".Footer_Wrapper.Fixed").count(), 0);

    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const touchPage = await mobile.newPage();
    touchPage.on("pageerror", (error) => errors.push(error.message));
    await touchPage.goto(base, { waitUntil: "networkidle" });
    await touchPage.waitForTimeout(1600);
    const cdp = await mobile.newCDPSession(touchPage);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 195, y: 650 }],
    });
    for (let y = 600; y >= 250; y -= 50) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: 195, y }],
      });
      await touchPage.waitForTimeout(20);
    }
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await touchPage.waitForTimeout(600);
    assert.ok(
      (await touchPage.evaluate(() => scrollY)) > 100,
      "Native touch swipe scrolls the page",
    );
    await touchPage.goto(base + "/catalogo", {
      waitUntil: "networkidle",
    });
    await touchPage
      .locator(".Product_Item button[type=submit]:enabled")
      .first()
      .click();
    await touchPage.locator(".cart-dialog[open]").waitFor();
    await touchPage.waitForTimeout(900);
    const drawer = touchPage.locator(".drawer-scroll");
    const box = await drawer.boundingBox();
    const backgroundY = await touchPage.evaluate(() => scrollY);
    await touchPage.mouse.move(box.x + box.width / 2, box.y + 150);
    await touchPage.mouse.wheel(0, 500);
    await touchPage.waitForTimeout(400);
    assert.ok((await drawer.evaluate((element) => element.scrollTop)) > 100);
    assert.equal(await touchPage.evaluate(() => scrollY), backgroundY);
    await mobile.close();
    assert.deepEqual(errors, []);
    console.log(
      "Smooth wheel, reverse input, keyboard anchor, modal lock, nested scroll, responsive footer, native touch and reduced motion verified.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
