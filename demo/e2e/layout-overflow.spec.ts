import { expect, test, type Page } from "@playwright/test";
import { ALL_LAYOUT_ROUTES, VIEWPORTS, type RailMode } from "./routes";

async function setRail(page: Page, rail: RailMode) {
  await page.evaluate((mode) => {
    document.documentElement.dataset.rail = mode;
  }, rail);
}

/** True when label text wraps inside the element (ignores decorative SVG). */
async function wrappedLabels(page: Page, selector: string) {
  return page.evaluate((sel) => {
    const bad: { selector: string; text: string; sh: number; ch: number }[] = [];
    for (const el of document.querySelectorAll(sel)) {
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) continue;
      const lh = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2 || 16;
      const sh = el.scrollHeight;
      const lines = sh / lh;
      if (lines > 1.45) {
        bad.push({ selector: sel, text: (el.textContent ?? "").trim().slice(0, 48), sh, ch: el.clientHeight });
      }
    }
    return bad;
  }, selector);
}

async function pageOverflow(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const main = document.querySelector(".main");
    const scrollW = Math.max(doc.scrollWidth, document.body.scrollWidth);
    const clientW = doc.clientWidth;
    const mainOx = main ? main.scrollWidth - main.clientWidth : 0;
    return { scrollW, clientW, mainOx };
  });
}

for (const viewport of VIEWPORTS) {
  for (const rail of ["expanded", "collapsed"] as const) {
    test.describe(`layout ${viewport.width}x${viewport.height} sidebar ${rail}`, () => {
      test.use({ viewport });

      for (const route of ALL_LAYOUT_ROUTES) {
        test(`${route} — no horizontal overflow, single-line pills`, async ({ page }) => {
          await page.goto(route, { waitUntil: "networkidle", timeout: 60_000 });
          await expect(page.locator("#main")).toBeVisible({ timeout: 15_000 });
          await setRail(page, rail);
          await page.waitForTimeout(150);

          const metrics = await pageOverflow(page);
          expect(
            metrics.scrollW,
            `${route} document scrollWidth ${metrics.scrollW} > ${metrics.clientW}`,
          ).toBeLessThanOrEqual(metrics.clientW + 1);
          expect(metrics.mainOx, `${route} .main horizontal overflow ${metrics.mainOx}px`).toBeLessThanOrEqual(1);

          const pillSelector = [".tag", ".strip .st", "button.btn:not(.icon-btn)"].join(", ");

          const wrapped = await wrappedLabels(page, pillSelector);
          expect(wrapped, `${route} wrapped labels: ${JSON.stringify(wrapped.slice(0, 5))}`).toEqual([]);
        });
      }
    });
  }
}
