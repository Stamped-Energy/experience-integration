import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.DEMO_BASE ?? "http://127.0.0.1:3010";
const outDir = process.env.OUT_DIR ?? "/opt/cursor/artifacts/screenshots/pr59-layout-1440-expanded";

/** Keep in sync with demo/e2e/routes.ts */
const ALL_LAYOUT_ROUTES = [
  "/",
  "/inbox",
  "/ask",
  "/settings",
  "/process/proposals",
  "/process/trials",
  "/process/drift",
  "/process/actions",
  "/process/dashboards",
  "/process/line",
  "/process/health",
  "/process/reports",
  "/process/analytics",
  "/process/optimisation",
  "/process/simulations",
  "/process/measurement",
  "/process/settings",
  "/process/model-fit",
  "/process/modules",
  "/process/cycle-time",
  "/process/smed",
  "/process/tool-life",
  "/process/oee",
  "/process",
  "/quality/actions",
  "/quality/capa",
  "/quality/corrections",
  "/quality/links",
  "/quality/agent",
  "/quality/investigations",
  "/quality/health",
  "/quality/spc",
  "/quality/genealogy",
  "/quality",
  "/quality/monitor",
  "/quality/capability",
  "/quality/drift",
  "/quality/analytics",
  "/quality/roi",
  "/quality/cause-gap",
  "/quality/causes",
  "/quality/simulations",
  "/quality/specs",
  "/quality/gauge-rr",
  "/quality/suppliers",
];

function slug(path) {
  if (path === "/") return "overview";
  return path.replace(/^\//, "").replace(/\//g, "-");
}

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

for (const path of ALL_LAYOUT_ROUTES) {
  await page.goto(`${base}${path}`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.evaluate(() => {
    document.documentElement.dataset.rail = "expanded";
  });
  await page.waitForTimeout(200);
  const cssOk = await page.evaluate(() => {
    const bg = getComputedStyle(document.body).backgroundColor;
    return bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent";
  });
  if (!cssOk) console.warn(`${path}: body background may mean CSS failed to load`);
  const name = slug(path);
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: false });
  console.log(`saved ${name}.png`);
}

await browser.close();
