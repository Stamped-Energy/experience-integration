import { chromium } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
const base = process.env.DEMO_BASE ?? "http://127.0.0.1:3010";
const outDir = process.env.OUT_DIR;
const theme = process.env.THEME ?? "light";
const only = process.env.ROUTES ? process.env.ROUTES.split(",") : null;
await mkdir(outDir, { recursive: true });
const manifest = JSON.parse(await readFile(".next/app-path-routes-manifest.json", "utf8"));
const pre = JSON.parse(await readFile(".next/prerender-manifest.json", "utf8"));
let routes = new Set(Object.values(manifest).filter((r) => !r.includes("[") && !r.startsWith("/_") && !r.includes("api") && !r.includes("icon")));
// one instance of each dynamic route
const dyn = {};
for (const r of Object.keys(pre.routes)) {
  const key = r.split("/").slice(0, -1).join("/");
  if (!dyn[key]) dyn[key] = r;
}
for (const r of Object.values(dyn)) routes.add(r);
routes = [...routes].filter((r) => !/\.(txt|xml|ico|png)$/.test(r)).sort();
if (only) routes = only;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addCookies([{ name: "stamped-role", value: "plant-head", url: base }]);
await ctx.addInitScript((t) => { try { localStorage.setItem("stamped-theme", t); localStorage.setItem("stamped-rail", "expanded"); } catch {} document.documentElement.dataset.theme = t; }, theme);
const page = await ctx.newPage();
for (const r of routes) {
  try {
    await page.goto(base + r, { waitUntil: "networkidle", timeout: 30000 });
    await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
    await page.waitForTimeout(500);
    const name = (r === "/" ? "home" : r.slice(1).replace(/\//g, "__")) + `-${theme}.png`;
    await page.screenshot({ path: `${outDir}/${name}`, fullPage: true });
  } catch (e) { console.log("fail", r, e.message.split("\n")[0]); }
}
console.log(routes.length, "routes");
await browser.close();
