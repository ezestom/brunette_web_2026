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
      viewport: { width: 1440, height: 1000 },
    });
    await page.goto("http://127.0.0.1:4321/", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    );
    await page.waitForTimeout(1000);
    console.log(
      JSON.stringify(
        await page.locator(".Footer_Wrapper").evaluate((e) => {
          const logo = e.querySelector(".Footer_Big_Logo_Text");
          const range = document.createRange();
          range.selectNodeContents(logo);
          return {
            fixed: e.classList.contains("Fixed"),
            height: e.offsetHeight,
            scrollY,
            docHeight: document.documentElement.scrollHeight,
            limit: document.documentElement.scrollHeight - innerHeight,
            space: document
              .querySelector(".Footer_Space")
              .getBoundingClientRect()
              .toJSON(),
            newsletter: document
              .querySelector(".Newsletter_Section")
              .getBoundingClientRect()
              .toJSON(),
            logo: logo.getBoundingClientRect().toJSON(),
            text: range.getBoundingClientRect().toJSON(),
          };
        }),
      ),
    );
    await page.screenshot({ path: "test-results/reference-footer.png" });
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
