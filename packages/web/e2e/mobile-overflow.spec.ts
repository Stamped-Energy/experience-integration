import { expect, test } from "@playwright/test";

const OPS_ROUTES = [
  "/",
  "/live",
  "/alarms",
  "/alarms/alm_1001",
  "/prescriptions",
  "/prescriptions/rx_9001",
  "/evidence",
  "/evidence/evd_4401",
] as const;

test.describe("mobile page overflow", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  for (const route of OPS_ROUTES) {
    test(`${route} has no page-level horizontal scroll at 360px`, async ({ page }) => {
      await page.goto(route);
      // Unauthenticated CI has AuthGate → /login (no forge main). Still assert no H-scroll.
      const shell = page.locator("main#forge-main, main, [data-auth-gate], form, body");
      await expect(shell.first()).toBeVisible({ timeout: 15_000 });
      const metrics = await page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        const scrollW = Math.max(doc.scrollWidth, body.scrollWidth);
        const clientW = doc.clientWidth;
        return { scrollW, clientW };
      });
      expect(
        metrics.scrollW,
        `${route} scrollWidth ${metrics.scrollW} > clientWidth ${metrics.clientW}`,
      ).toBeLessThanOrEqual(metrics.clientW + 1);
    });
  }
});
