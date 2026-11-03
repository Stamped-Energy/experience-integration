import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.DEMO_BASE ?? "http://127.0.0.1:3010";
const outDir = process.env.OUT_DIR ?? "/opt/cursor/artifacts/screenshots";
await mkdir(outDir, { recursive: true });

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem("stamped-theme", t);
    } catch {
      /* file:// or denied */
    }
  }, theme);
  await page.waitForTimeout(400);
}

async function ready(page, path) {
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

for (const theme of ["light", "dark"]) {
  await setTheme(page, theme);
  await ready(page, "/quality/actions/ex-q1");
  await page.locator(".spc-chart-card").screenshot({ path: `${outDir}/audit-action-detail-${theme}.png` });
  await ready(page, "/quality/actions");
  await page.getByText("Needs a decision").first().waitFor({ timeout: 20000 });
  await page.locator(".act-pack-row").first().screenshot({ path: `${outDir}/audit-quality-actions-${theme}.png` });
  await ready(page, "/process/actions");
  await page.getByText("Needs a decision").first().waitFor({ timeout: 20000 }).catch(() => {});
  await page.screenshot({ path: `${outDir}/audit-process-actions-${theme}.png`, fullPage: false });
  await ready(page, "/process");
  await page.screenshot({ path: `${outDir}/audit-process-lines-${theme}.png`, fullPage: false });
}

await setTheme(page, "light");
await ready(page, "/quality/actions?mine=1");
await page.locator(".filter-empty").screenshot({ path: `${outDir}/audit-empty-filter-light.png` });

await browser.close();
console.log(`saved to ${outDir}`);
