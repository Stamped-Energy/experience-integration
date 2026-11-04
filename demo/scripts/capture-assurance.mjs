import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.DEMO_BASE ?? "http://127.0.0.1:3010";
const outDir = process.env.OUT_DIR ?? "/workspace/design/stamped/round-assurance";
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

async function ready(page, path, role = "plant-head") {
  await page.context().addCookies([{ name: "stamped-role", value: role, url: base }]);
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await setTheme(page, "light");

await ready(page, "/process/actions/ex-p1");
await page.getByText("How this action works").first().waitFor({ timeout: 20000 });
await page.screenshot({ path: `${outDir}/01-process-action-detail-ex-p1-top-light-1440.png`, fullPage: false });
await page.locator(".action-assurance").first().scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/02-process-action-detail-ex-p1-assurance-light-1440.png`, fullPage: false });
await page.locator(".action-assurance").first().screenshot({ path: `${outDir}/03-assurance-block-ex-p1-light.png` });

await ready(page, "/process/actions/ex-p5");
await page.getByText("How this action works").first().waitFor({ timeout: 20000 });
await page.locator(".action-assurance").first().scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/04-process-action-detail-ex-p5-twin-assurance-light-1440.png`, fullPage: false });

await ready(page, "/quality/actions/ex-q1");
await page.getByText("How this action works").first().waitFor({ timeout: 20000 });
await page.locator(".action-assurance").first().scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/05-quality-action-detail-ex-q1-assurance-light-1440.png`, fullPage: false });

await ready(page, "/process/actions?tab=actions");
await page.getByText("Needs a decision").first().waitFor({ timeout: 20000 });
await page.screenshot({ path: `${outDir}/06-process-actions-list-light-1440.png`, fullPage: false });

await ready(page, "/quality/actions?tab=actions");
await page.getByText("Needs a decision").first().waitFor({ timeout: 20000 });
await page.screenshot({ path: `${outDir}/07-quality-actions-list-light-1440.png`, fullPage: false });

await setTheme(page, "dark");
await ready(page, "/process/actions/ex-p1");
await page.getByText("How this action works").first().waitFor({ timeout: 20000 });
await page.locator(".action-assurance").first().scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/08-process-action-detail-ex-p1-assurance-dark-1440.png`, fullPage: false });

await browser.close();
console.log(`saved screenshots to ${outDir}`);
