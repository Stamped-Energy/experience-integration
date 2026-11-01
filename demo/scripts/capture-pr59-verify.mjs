import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.DEMO_BASE ?? "http://127.0.0.1:3010";
const outDir = process.env.OUT_DIR ?? "/opt/cursor/artifacts/screenshots/pr59-plantcraft-port";

const pages = [
  ["actions-landing", "/process/proposals"],
  ["dashboards", "/process/dashboards"],
  ["process-plant-overview", "/process/line"],
  ["reports", "/process/reports"],
  ["analytics-overview", "/process/analytics"],
];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

for (const [name, path] of pages) {
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: false });
  console.log(`saved ${name}.png`);
}

// Process plant · one area tab
await page.goto(`${base}/process/line`, { waitUntil: "networkidle" });
await page.getByRole("tab", { name: "Heat treatment" }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/process-plant-area-ht.png`, fullPage: false });
console.log("saved process-plant-area-ht.png");

// Full screen (may fall back to fixed overlay if Fullscreen API unavailable)
await page.getByRole("button", { name: "Full screen" }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${outDir}/process-plant-fullscreen.png`, fullPage: false });
console.log("saved process-plant-fullscreen.png");

await browser.close();
