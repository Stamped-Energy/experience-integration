import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.DEMO_BASE ?? "http://127.0.0.1:3010";
const outDir = process.env.OUT_DIR ?? "/opt/cursor/artifacts/screenshots/pr59-ia";

/** Every hub tab URL (Process + Quality compressed IA). */
const pages = [
  ["process-actions-proposals", "/process/proposals"],
  ["process-actions-trials", "/process/trials"],
  ["process-actions-drift", "/process/drift"],
  ["process-actions-queue", "/process/actions"],
  ["process-plant-line", "/process/line"],
  ["process-plant-health", "/process/health"],
  ["process-plant-oee", "/process/oee"],
  ["process-plant-lines-table", "/process"],
  ["process-analytics-trends", "/process/analytics"],
  ["process-analytics-cycle-time", "/process/cycle-time"],
  ["process-analytics-smed", "/process/smed"],
  ["process-analytics-tool-life", "/process/tool-life"],
  ["process-optimisation-loops", "/process/optimisation"],
  ["process-optimisation-simulations", "/process/simulations"],
  ["process-optimisation-simulate-legacy", "/process/simulate"],
  ["process-setup-measurement", "/process/measurement"],
  ["process-setup-settings", "/process/settings"],
  ["process-setup-model-fit", "/process/model-fit"],
  ["process-setup-modules", "/process/modules"],
  ["quality-actions-cards", "/quality/actions"],
  ["quality-actions-capa", "/quality/capa"],
  ["quality-actions-corrections", "/quality/corrections"],
  ["quality-actions-links", "/quality/links"],
  ["quality-actions-agent", "/quality/agent"],
  ["quality-actions-investigations", "/quality/investigations"],
  ["quality-inspect-health", "/quality/health"],
  ["quality-inspect-spc", "/quality/spc"],
  ["quality-inspect-genealogy", "/quality/genealogy"],
  ["quality-inspect-lots", "/quality"],
  ["quality-inspect-monitor", "/quality/monitor"],
  ["quality-inspect-capability", "/quality/capability"],
  ["quality-inspect-drift", "/quality/drift"],
  ["quality-analytics-trends", "/quality/analytics"],
  ["quality-analytics-roi", "/quality/roi"],
  ["quality-analytics-cause-gap", "/quality/cause-gap"],
  ["quality-analytics-causes", "/quality/causes"],
  ["quality-simulations", "/quality/simulations"],
  ["quality-setup-specs", "/quality/specs"],
  ["quality-setup-gauge-rr", "/quality/gauge-rr"],
  ["quality-setup-suppliers", "/quality/suppliers"],
];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

for (const [name, path] of pages) {
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  const railW = await page.evaluate(() => {
    const rail = document.querySelector(".rail-item svg");
    return rail ? getComputedStyle(rail).width : "";
  });
  if (railW !== "20px") console.warn(`${name}: rail svg width=${railW}`);
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: false });
  console.log(`saved ${name}.png`);
}

await browser.close();
