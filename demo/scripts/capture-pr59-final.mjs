import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.DEMO_BASE ?? "http://127.0.0.1:3010";
const outDir = process.env.OUT_DIR ?? "/opt/cursor/artifacts/screenshots/pr59-final-1440";

const pages = [
  ["process-line-diagram", "/process/line"],
  ["process-dashboards-gauges", "/process/dashboards"],
  ["process-reports-tabs", "/process/reports?section=intro"],
  ["quality-spc-charts", "/quality/spc"],
  ["settings-screen-toggles", "/settings/screens"],
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

await page.goto(`${base}/settings/screens`, { waitUntil: "networkidle" });
await page.getByRole("checkbox", { name: /Dashboards enabled/i }).uncheck();
await page.goto(`${base}/process/proposals`, { waitUntil: "networkidle" });
await page.screenshot({ path: `${outDir}/nav-screen-disabled.png`, fullPage: false });
console.log("saved nav-screen-disabled.png");
await page.goto(`${base}/settings/screens`, { waitUntil: "networkidle" });
await page.getByRole("checkbox", { name: /Dashboards enabled/i }).check();

await browser.close();
