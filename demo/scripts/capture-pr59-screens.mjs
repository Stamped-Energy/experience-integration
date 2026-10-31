import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.DEMO_BASE ?? "http://127.0.0.1:3010";
const outDir = process.env.OUT_DIR ?? "/opt/cursor/artifacts/screenshots/pr59-working";

const pages = [
  ["process-health", "/process/health"],
  ["process-line-pfd", "/process/line"],
  ["process-analytics", "/process/analytics"],
  ["process-optimisation", "/process/optimisation"],
  ["process-simulations", "/process/simulations"],
  ["quality-health", "/quality/health"],
  ["quality-analytics", "/quality/analytics"],
  ["quality-simulations", "/quality/simulations"],
];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

for (const [name, path] of pages) {
  const url = `${base}${path}`;
  await page.goto(url, { waitUntil: "networkidle" });
  const cssOk = await page.evaluate(() => {
    const bg = getComputedStyle(document.body).backgroundColor;
    const rail = document.querySelector(".rail-item svg");
    const railW = rail ? getComputedStyle(rail).width : "";
    return { bg, railW };
  });
  if (cssOk.railW !== "20px") {
    console.warn(`${name}: rail svg width=${cssOk.railW} bg=${cssOk.bg} (CSS may be broken)`);
  }
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: false });
  console.log(`saved ${name}.png`);
}

await browser.close();
