const {
  chromium,
} = require("C:/Users/ezequ/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({ channel: "chrome", headless: true });
  try {
    for (const width of [320, 393, 820, 1440, 1920]) {
      const p = await b.newPage({ viewport: { width, height: 1000 } });
      await p.goto(process.env.QA_BASE_URL || "http://127.0.0.1:4321/", {
        waitUntil: "networkidle",
      });
      const section = p.locator(".social-section");
      await section.locator(".social-heading").scrollIntoViewIfNeeded();
      await p.waitForTimeout(700);
      await p
        .getByRole("button", { name: "Pausar carrusel", exact: true })
        .click();
      const result = await section.evaluate((e) => {
        const stage = e.querySelector(".social-stage");
        const ring = e.querySelector(".social-ring");
        const bounds = stage.getBoundingClientRect();
        const bad = [];
        for (let phase = 0; phase < 360; phase += 2) {
          ring.style.transform = `rotate(${phase}deg)`;
          for (const card of e.querySelectorAll(".social-card")) {
            if (!card.getClientRects().length) continue;
            const r = card.getBoundingClientRect();
            if (
              r.right > bounds.left + 1 &&
              r.left < bounds.right - 1 &&
              r.top < bounds.bottom - 1 &&
              r.bottom > bounds.bottom + 1
            )
              bad.push({
                phase,
                top: r.top - bounds.top,
                bottom: r.bottom - bounds.top,
                left: r.left,
                right: r.right,
                height: bounds.height,
              });
          }
        }
        ring.style.transform = "rotate(-8deg)";
        return {
          bad,
          mask: getComputedStyle(stage).maskImage,
          height: bounds.height,
          cardWidth: e.querySelector(".social-card").offsetWidth,
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      assert.deepEqual(result.bad, [], JSON.stringify(result.bad.slice(0, 2)));
      assert.equal(result.mask, "none");
      assert.equal(result.overflow, false);
      if ([393, 1440].includes(width))
        await section.screenshot({
          path: `test-results/social-no-mask-${width}.png`,
        });
      console.log(
        JSON.stringify({
          width,
          height: result.height,
          cardWidth: result.cardWidth,
          clipped: result.bad.length,
        }),
      );
      await p.close();
    }
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
