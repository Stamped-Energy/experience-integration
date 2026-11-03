import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.DEMO_BASE ?? "http://127.0.0.1:3010";
const outDir = process.env.OUT_DIR ?? "/opt/cursor/artifacts/screenshots";
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(`${base}/quality/actions/ex-q1`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const chart = page.locator(".spc-chart-card");
await chart.screenshot({ path: `${outDir}/demo-action-detail-chart.png` });
await page.screenshot({ path: `${outDir}/demo-action-detail.png`, fullPage: false });
console.log("saved detail screenshots");

await page.goto(`${base}/quality/actions`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const decision = page.locator('[data-act-group="decision"]');
await decision.screenshot({ path: `${outDir}/demo-action-cards-needs-decision.png` });
console.log("saved cards screenshot");

await browser.close();
