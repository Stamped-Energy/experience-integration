import { expect, test } from "@playwright/test";

const QUALITY_ACTION_IDS = ["ex-q1", "ex-q2", "ex-q3", "ex-q4"] as const;

test.describe("quality action detail routes", () => {
  for (const id of QUALITY_ACTION_IDS) {
    test(`opens /quality/actions/${id} with hub tabs and outcomes`, async ({ page }) => {
      await page.goto(`/quality/actions/${id}`);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("main h1, .page-head h1").first()).toBeVisible();
      const tabs = page.getByRole("navigation", { name: "Quality · Actions" });
      await expect(tabs).toBeVisible();
      await expect(tabs.getByRole("link", { name: "Action cards" })).toHaveAttribute("aria-current", "page");
      await expect(page.locator(".ex-outcome-strip")).toBeVisible();
      await expect(page.getByRole("heading", { name: "How we calculated this" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Evidence" })).toBeVisible();
      await expect(page.getByRole("link", { name: "← Back to actions" })).toBeVisible();
    });
  }

  test("closed bore-scrap card shows measured-on-the-line status", async ({ page }) => {
    await page.goto("/quality/actions/ex-q4");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Measured on the line: bore scrap down to 1\.2%/)).toBeVisible();
    await expect(page.locator(".action-loop-facts dt", { hasText: "Verified result" })).toBeVisible();
  });
});
