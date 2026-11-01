import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.DEMO_BASE ?? "http://127.0.0.1:3010";
const outDir = process.env.OUT_DIR ?? "/workspace/design/stamped/pr59-redesign-shots/after-v4";
await mkdir(outDir, { recursive: true });

const pages = [
  ["overview", "/"],
  ["process-actions", "/process/proposals"],
  ["process-dashboards", "/process/dashboards"],
  ["process-plant", "/process/line"],
  ["process-reports", "/process/reports"],
  ["process-analytics", "/process/analytics"],
  ["process-health", "/process/health"],
  ["quality-actions", "/quality/actions"],
  ["quality-inspect", "/quality/health"],
  ["quality-analytics", "/quality/analytics"],
  ["quality-simulations", "/quality/simulations"],
  ["quality-setup", "/quality/specs"],
  ["inbox", "/inbox"],
  ["ask", "/ask"],
  ["activity", "/activity"],
  ["settings", "/settings"],
];

async function shoot(page, name) {
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: false });
  console.log(`saved ${name}.png`);
}

async function setRail(page, expanded) {
  await page.evaluate((exp) => {
    document.documentElement.dataset.rail = exp ? "expanded" : "collapsed";
    localStorage.setItem("stamped-rail", exp ? "expanded" : "collapsed");
  }, expanded);
  // Force React state via collapse button if mismatch
  const btn = page.locator(".side-collapse");
  if (await btn.count()) {
    const aria = await btn.getAttribute("aria-expanded");
    const want = expanded ? "true" : "false";
    if (aria !== want) {
      await btn.click();
      await page.waitForTimeout(250);
    }
  }
  await page.waitForTimeout(200);
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

// Seed expanded + process open
await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.evaluate(() => {
  localStorage.setItem("stamped-rail", "expanded");
  localStorage.setItem("stamped-last-module", "process");
  document.documentElement.dataset.rail = "expanded";
});

for (const [name, path] of pages) {
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  // Plant auto-collapses; others prefer expanded for the catalogue
  if (path !== "/process/line") {
    await setRail(page, true);
  }
  await shoot(page, name);
}

// Explicit sidebar states
await page.goto(`${base}/process/proposals`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await setRail(page, true);
await shoot(page, "sidebar-process-expanded");

await setRail(page, false);
await page.waitForTimeout(300);
await shoot(page, "sidebar-collapsed");

// Hover flyout on Process while collapsed
const processBtn = page.locator(".side-group-btn", { hasText: /Process/i }).first();
if (await processBtn.count()) {
  await processBtn.hover();
  await page.waitForTimeout(400);
  await shoot(page, "sidebar-collapsed-flyout-process");
}

await setRail(page, true);
// Open Quality accordion
const qualityBtn = page.locator(".side-group-btn", { hasText: /^Quality$/ }).first();
if (await qualityBtn.count()) {
  await qualityBtn.click();
  await page.waitForTimeout(600);
  await shoot(page, "sidebar-quality-expanded");
}

// Plant with auto-collapsed sidebar
await page.goto(`${base}/process/line`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await shoot(page, "process-plant-sidebar-collapsed");

// Metrics
const metrics = await page.evaluate(() => {
  const side = document.querySelector(".side");
  const app = document.querySelector(".app");
  const stage = document.querySelector(".plant-stage");
  const rail = document.documentElement.dataset.rail;
  const sr = side?.getBoundingClientRect();
  const ar = app?.getBoundingClientRect();
  const st = stage?.getBoundingClientRect();
  const groups = [...document.querySelectorAll(".side-group")].map((g) => ({
    open: g.classList.contains("is-open"),
    active: g.classList.contains("is-active"),
    label: g.querySelector(".side-label")?.textContent,
  }));
  const badges = [...document.querySelectorAll(".side-group-btn .side-badge")].map((b) => b.textContent);
  return {
    rail,
    sideW: sr ? Math.round(sr.width) : null,
    appW: ar ? Math.round(ar.width) : null,
    stageW: st ? Math.round(st.width) : null,
    groups,
    badges,
    hasTopnav: !!document.querySelector(".app-topnav, .mod-switch, .module-page-tabs"),
    overviewLabel: [...document.querySelectorAll(".side-item .side-label")].map((el) => el.textContent).slice(0, 6),
  };
});
console.log("METRICS", JSON.stringify(metrics, null, 2));

await browser.close();
console.log(`done → ${outDir}`);
