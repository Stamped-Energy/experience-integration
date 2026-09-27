/**
 * Capture full-page screenshots of every L6 web route + a short demo video.
 * Requires: web on http://127.0.0.1:3000 and Playwright Chromium installed.
 */
import { chromium } from "@playwright/test";
import { mkdirSync, copyFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const BASE = process.env.DEMO_BASE_URL ?? "http://127.0.0.1:3000";
const OUT = process.env.DEMO_OUT ?? "/opt/cursor/artifacts/screenshots";
const VIDEO_DIR = process.env.DEMO_VIDEO_DIR ?? "/opt/cursor/artifacts/demo-raw";
const REPO_DOCS =
  process.env.DEMO_DOCS ?? join(fileURLToPath(new URL(".", import.meta.url)), "../../../docs/demo");

mkdirSync(OUT, { recursive: true });
mkdirSync(VIDEO_DIR, { recursive: true });
mkdirSync(REPO_DOCS, { recursive: true });

/** Every Forge screen - static routes first, then detail/action captures. */
const routes = [
  { path: "/", name: "01-today", label: "Today (Overview)" },
  { path: "/live", name: "02-live", label: "Live" },
  { path: "/alarms", name: "03-alarms", label: "Alarms console" },
  { path: "/alarms/alm_1001", name: "04-alarm-detail", label: "Alarm detail" },
  { path: "/prescriptions", name: "05-prescriptions", label: "Prescriptions" },
  { path: "/prescriptions/rx_9001", name: "06-prescription-detail", label: "Prescription detail" },
  { path: "/evidence", name: "07-evidence-index", label: "Evidence index" },
  { path: "/evidence/evd_4401", name: "08-evidence", label: "Evidence detail" },
  { path: "/analyst", name: "09-analyst", label: "Analyst (Mode B)" },
  { path: "/reports", name: "10-reports", label: "Reports & ledger" },
  { path: "/energy", name: "11-energy", label: "Energy analytics" },
  { path: "/equipment", name: "12-equipment", label: "Machine health" },
  { path: "/plant-map", name: "13-plant-map", label: "Plant map" },
  { path: "/intensity", name: "14-intensity", label: "Sustainability / intensity" },
  { path: "/tools", name: "15-tools", label: "Tools" },
  { path: "/settings/integrations", name: "16-integrations", label: "Integrations" },
  { path: "/settings/admin", name: "17-admin", label: "Admin & members" },
  { path: "/settings/assignments", name: "18-assignments", label: "Assignments" },
];

async function settle(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(400);
}

async function quickSettle(page) {
  await page.waitForTimeout(250);
}

async function shot(page, name, opts = {}) {
  const file = join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: opts.fullPage ?? true });
  copyFileSync(file, join(REPO_DOCS, `${name}.png`));
  console.log(`screenshot ${name}`);
}

function toMp4(webmPath, mp4Path, { fast = false } = {}) {
  const args = [
    "-y",
    "-i",
    webmPath,
    ...(fast ? ["-vf", "setpts=0.3*PTS"] : []),
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    mp4Path,
  ];
  execFileSync("ffmpeg", args, { stdio: "inherit" });
}

const browser = await chromium.launch({ headless: true });

// --- Full-page screenshots ---
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  for (const r of routes) {
    const url = `${BASE}${r.path}`;
    console.log(`nav ${r.name} <- ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await settle(page);
    await shot(page, r.name);
  }

  // Analyst Mode A overlay on Today
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await settle(page);
  const ask = page.getByRole("button", { name: /Ask Analyst/i });
  if (await ask.isVisible().catch(() => false)) {
    await ask.click();
    await page.waitForTimeout(500);
    await shot(page, "19-analyst-mode-a", { fullPage: false });
  }

  // Alarm acknowledge action
  await page.goto(`${BASE}/alarms/alm_1001`, { waitUntil: "domcontentloaded" });
  await settle(page);
  const ack = page.getByRole("button", { name: /^Acknowledge$/i }).first();
  if (await ack.isVisible().catch(() => false)) {
    await ack.click();
    await page.waitForTimeout(500);
    await shot(page, "20-alarm-acked");
  }

  // Prescription defer action (expand row first - Defer is in expanded panel)
  await page.goto(`${BASE}/prescriptions`, { waitUntil: "domcontentloaded" });
  await settle(page);
  await page.locator(".rx-queue li button").first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(400);
  const defer = page.getByRole("button", { name: /Defer/i }).first();
  if (await defer.isVisible().catch(() => false)) {
    await defer.click();
    await page.waitForTimeout(500);
    await shot(page, "21-rx-deferred");
  }

  // Export approve action
  await page.goto(`${BASE}/reports`, { waitUntil: "domcontentloaded" });
  await settle(page);
  const approve = page.getByRole("button", { name: /^Approve$/i }).first();
  if (await approve.isVisible().catch(() => false)) {
    await approve.click();
    await page.waitForTimeout(500);
    await shot(page, "22-export-approved");
  }

  await context.close();
}

// --- Demo video (core ops journey) ---
{
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();

  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await quickSettle(page);

  const ask = page.getByRole("button", { name: /Ask Analyst/i });
  if (await ask.isVisible().catch(() => false)) {
    await ask.click();
    await quickSettle(page);
    await page.keyboard.press("Escape");
    await quickSettle(page);
  }

  for (const p of [
    "/live",
    "/alarms",
    "/alarms/alm_1001",
    "/prescriptions",
    "/prescriptions/rx_9001",
    "/evidence/evd_4401",
    "/analyst",
    "/reports",
    "/energy",
    "/equipment",
    "/plant-map",
    "/intensity",
    "/settings/integrations",
    "/settings/admin",
    "/settings/assignments",
    "/tools",
  ]) {
    await page.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded" });
    await quickSettle(page);
  }

  await page.goto(`${BASE}/prescriptions`, { waitUntil: "domcontentloaded" });
  await quickSettle(page);
  await page.locator(".rx-queue li button").first().click({ force: true }).catch(() => {});
  await quickSettle(page);
  const defer = page.getByRole("button", { name: /Defer/i }).first();
  if (await defer.isVisible().catch(() => false)) {
    await defer.click();
    await quickSettle(page);
  }

  await page.goto(`${BASE}/reports`, { waitUntil: "domcontentloaded" });
  await quickSettle(page);
  const approve = page.getByRole("button", { name: /^Approve$/i }).first();
  if (await approve.isVisible().catch(() => false)) {
    await approve.click();
    await quickSettle(page);
  }

  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await quickSettle(page);

  await context.close();
}

await browser.close();

const vids = readdirSync(VIDEO_DIR).filter((f) => f.endsWith(".webm"));
if (vids.length === 0) {
  console.error("No video produced");
  process.exit(1);
}
const src = join(VIDEO_DIR, vids[vids.length - 1]);
const destWebmArtifacts = "/opt/cursor/artifacts/l6-ui-demo.webm";
const destWebmDocs = join(REPO_DOCS, "l6-ui-demo.webm");
const destMp4Artifacts = "/opt/cursor/artifacts/l6-ui-demo.mp4";
const destMp4Docs = join(REPO_DOCS, "l6-ui-demo.mp4");
const destFastMp4Docs = join(REPO_DOCS, "l6-ui-demo-fast.mp4");

copyFileSync(src, destWebmArtifacts);
copyFileSync(src, destWebmDocs);
toMp4(destWebmDocs, destMp4Docs);
copyFileSync(destMp4Docs, destMp4Artifacts);
toMp4(destWebmDocs, destFastMp4Docs, { fast: true }); // setpts=0.3 → ~3 min walkthrough

console.log(
  JSON.stringify(
    {
      screenshots: OUT,
      docs: REPO_DOCS,
      video: { webm: destWebmDocs, mp4: destMp4Docs, fastMp4: destFastMp4Docs },
      routes: routes.map((r) => ({ file: `${r.name}.png`, label: r.label, path: r.path })),
    },
    null,
    2,
  ),
);
