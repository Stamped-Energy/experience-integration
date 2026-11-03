import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.DEMO_BASE ?? "http://127.0.0.1:3010";
const outDir = process.env.OUT_DIR ?? "/opt/cursor/artifacts";
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
  await page.waitForTimeout(600);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

for (const theme of ["light", "dark"]) {
  await setTheme(page, theme);
  await ready(page, "/quality/actions?tab=actions");
  await page.getByText("Needs a decision").first().waitFor({ timeout: 20000 });
  await page.screenshot({ path: `${outDir}/quality-actions-${theme}-1440.png`, fullPage: false });

  await ready(page, "/process/actions?tab=actions");
  await page.getByText("Needs a decision").first().waitFor({ timeout: 20000 });
  await page.screenshot({ path: `${outDir}/process-actions-${theme}-1440.png`, fullPage: false });

  await ready(page, "/quality/actions/ex-q1");
  await page.screenshot({ path: `${outDir}/quality-action-detail-ex-q1-${theme}-1440.png`, fullPage: false });
}

await setTheme(page, "light");
await ready(page, "/quality/actions?tab=actions", "plant-head");
const denied = page.locator(".ex-card").filter({ has: page.getByRole("button", { name: /Hold and check/i }) }).first();
await denied.waitFor({ timeout: 20000 });
await denied.screenshot({ path: `${outDir}/quality-action-denied-role-light-1440.png` });

await browser.close();
console.log(`saved screenshots to ${outDir}`);
