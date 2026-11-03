import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.DEMO_BASE ?? "http://127.0.0.1:3010";
const outDir = process.env.OUT_DIR ?? "/workspace/design/stamped/pen-r1";
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

for (const theme of ["light", "dark"]) {
  await setTheme(page, theme);

  await ready(page, "/process/actions");
  await page.getByText("Needs a decision").first().waitFor({ timeout: 20000 });
  await page.screenshot({ path: `${outDir}/process-actions-${theme}.png`, fullPage: false });

  await ready(page, "/quality/actions");
  await page.getByText("Needs a decision").first().waitFor({ timeout: 20000 });
  await page.screenshot({ path: `${outDir}/process-quality-actions-${theme}.png`, fullPage: false });

  await ready(page, "/process/actions/ex-p1");
  await page.getByText(/Measured on the line/).first().waitFor({ timeout: 20000 });
  await page.screenshot({ path: `${outDir}/process-detail-ex-p1-${theme}.png`, fullPage: false });

  await ready(page, "/quality/actions/ex-q3");
  await page.getByText(/Measured on the line/).first().waitFor({ timeout: 20000 });
  await page.screenshot({ path: `${outDir}/process-detail-ex-q3-${theme}.png`, fullPage: false });
}

await browser.close();
console.log(`saved screenshots to ${outDir}`);
