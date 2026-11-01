import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.DEMO_BASE ?? "http://127.0.0.1:3010";
const outDir = process.env.OUT_DIR ?? "/workspace/design/stamped/pr59-redesign-shots/after-v3";
await mkdir(outDir, { recursive: true });

const pages = [
  ["home", "/"],
  ["process-actions", "/process/proposals"],
  ["process-dashboards", "/process/dashboards"],
  ["process-plant", "/process/line"],
  ["process-reports", "/process/reports"],
  ["process-analytics", "/process/analytics"],
  ["process-health", "/process/health"],
  ["quality-actions", "/quality/actions"],
  ["quality-inspect", "/quality/health"],
  ["quality-analytics", "/quality/analytics"],
  ["inbox", "/inbox"],
  ["ask", "/ask"],
];

async function shoot(page, name) {
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: false });
  console.log(`saved ${name}.png`);
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

for (const [name, path] of pages) {
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await shoot(page, name);
}

// Plant variants
await page.goto(`${base}/process/line`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
const ht = page.locator(".dg-tabs button", { hasText: /Heat/i }).first();
if (await ht.count()) {
  await ht.click();
  await page.waitForTimeout(500);
  await shoot(page, "process-plant-area-ht");
}
const ov = page.locator(".dg-tabs button", { hasText: /Overview/i }).first();
if (await ov.count()) {
  await ov.click();
  await page.waitForTimeout(300);
}
const fs = page.getByRole("button", { name: /Full screen/i });
if (await fs.count()) {
  await fs.click();
  await page.waitForTimeout(700);
  await shoot(page, "process-plant-fullscreen");
  const exit = page.getByRole("button", { name: /Leave full screen|Exit/i });
  if (await exit.count()) await exit.first().click().catch(() => {});
  await page.waitForTimeout(300);
}

// Module switcher open
await page.goto(`${base}/process/proposals`, { waitUntil: "networkidle" });
await page.waitForTimeout(400);
const sw = page.locator(".mod-switch-btn");
if (await sw.count()) {
  await sw.click();
  await page.waitForTimeout(300);
  await shoot(page, "module-switcher-open");
}

// DOM metrics for plant + gauges
await page.goto(`${base}/process/line`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const plantMetrics = await page.evaluate(() => {
  const stage = document.querySelector(".plant-stage");
  const canvas = document.querySelector(".plant-stage .dg-canvas");
  const svg = canvas;
  const sr = stage?.getBoundingClientRect();
  const cr = canvas?.getBoundingClientRect();
  return {
    stage: sr ? { w: sr.width, h: sr.height, top: sr.top } : null,
    canvas: cr ? { w: cr.width, h: cr.height } : null,
    rail: !!document.querySelector(".rail:not([style*='display: none'])"),
    moduleNav: !!document.querySelector(".module-nav:not([style*='display: none'])"),
    pageTabs: !!document.querySelector(".module-page-tabs"),
    topbar: !!document.querySelector(".topbar"),
    switcher: !!document.querySelector(".mod-switch"),
  };
});
console.log("PLANT_METRICS", JSON.stringify(plantMetrics, null, 2));

await page.goto(`${base}/process/dashboards`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
const gaugeMetrics = await page.evaluate(() => {
  const gauges = [...document.querySelectorAll(".pc-gauge")].slice(0, 3).map((g) => {
    const svg = g.querySelector("svg");
    const gr = g.getBoundingClientRect();
    const sr = svg?.getBoundingClientRect();
    const paths = [...(svg?.querySelectorAll("path") ?? [])].map((p) => {
      const bb = p.getBBox();
      return { d: (p.getAttribute("d") || "").slice(0, 40), bb: { x: bb.x, y: bb.y, w: bb.width, h: bb.height } };
    });
    return {
      card: { w: gr.width, h: gr.height },
      svg: sr ? { w: sr.width, h: sr.height } : null,
      viewBox: svg?.getAttribute("viewBox"),
      paths,
    };
  });
  // OP% legend / axis text near chart
  const texts = [...document.querySelectorAll("text")].map((t) => t.textContent?.trim()).filter((t) => t && /OP|%|bar|°C/.test(t)).slice(0, 20);
  return { gauges, texts };
});
console.log("GAUGE_METRICS", JSON.stringify(gaugeMetrics, null, 2));

await browser.close();
console.log("done");
