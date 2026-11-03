import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.DEMO_BASE ?? "http://127.0.0.1:3010";
const outDir = process.env.OUT_DIR ?? "/opt/cursor/artifacts/screenshots";
await mkdir(outDir, { recursive: true });

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    document.documentElement.dataset.theme = t;
    document.documentElement.dataset.rail = "expanded";
    try {
      localStorage.setItem("stamped-theme", t);
      localStorage.setItem("stamped-rail", "expanded");
    } catch {
      /* denied */
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

await setTheme(page, "light");
await ready(page, "/process/actions");
await page.locator(".side-foot-cluster").screenshot({ path: `${outDir}/audit-round5-sidebar-foot-light.png` });

await ready(page, "/quality/actions?mine=1");
await page.locator(".filter-empty").screenshot({ path: `${outDir}/audit-round5-empty-filter-light.png` });

await ready(page, "/process/actions");
await page.locator(".tabs").first().screenshot({ path: `${outDir}/audit-round5-process-actions-tabs-light.png` });
await page.screenshot({ path: `${outDir}/audit-round5-process-actions-page-light.png`, fullPage: false, clip: { x: 200, y: 0, width: 1240, height: 720 } });

for (const theme of ["light", "dark"]) {
  await setTheme(page, theme);
await ready(page, "/quality/actions");
await page.getByText("Needs a decision").first().waitFor({ timeout: 20000 }).catch(() => {});
await page.locator(".act-list, .act-board").first().screenshot({ path: `${outDir}/audit-round5-quality-actions-${theme}.png`, fullPage: false });

await ready(page, "/process/actions");
await page.getByText("Needs a decision").first().waitFor({ timeout: 20000 }).catch(() => {});
await page.locator(".act-list, .act-board").first().screenshot({ path: `${outDir}/audit-round5-process-actions-${theme}.png`, fullPage: false });
  await ready(page, "/quality/actions/ex-q1");
  if (theme === "dark") {
    await page.getByRole("heading", { name: "How we calculated this" }).scrollIntoViewIfNeeded();
    await page.locator("section").filter({ has: page.getByRole("heading", { name: "How we calculated this" }) }).screenshot({
      path: `${outDir}/audit-round5-action-detail-calc-dark.png`,
    });
  }
}

await setTheme(page, "light");
await ready(page, "/quality/lots/lot-a-3307");
await page.locator(".spc-chart-card").first().screenshot({ path: `${outDir}/audit-round5-lot-detail-light.png` });

await browser.close();
console.log(`saved to ${outDir}`);
