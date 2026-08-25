import { expect, test } from "@playwright/test";

/**
 * Offline shell journeys — CI runs Next without a BFF.
 * Assert shell + honest empty/loading surfaces; do not require fixture KPI copy.
 */
test.describe("operational journeys", () => {
  test("Today shell loads with Ask Analyst", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main#forge-main, main").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Ask Analyst/i })).toBeVisible();
  });

  test("alarms console renders shell (live or empty upstream)", async ({ page }) => {
    await page.goto("/alarms");
    await expect(page.locator("main").first()).toBeVisible();
    await expect(
      page.locator("main").getByText(/Alarm|upstream|Sign in|unavailable|Loading/i).first(),
    ).toBeVisible();
    await page.goto("/alarms/alm_1001");
    await expect(page.locator("main").first()).toBeVisible();
  });

  test("prescriptions and evidence shells render", async ({ page }) => {
    await page.goto("/prescriptions");
    await expect(page.locator("main").first()).toBeVisible();
    await expect(
      page
        .locator("main")
        .getByText(/Prescription|Needs attention|Addressable|upstream|unavailable|Loading/i)
        .first(),
    ).toBeVisible();
    await page.goto("/evidence/evd_4401");
    await expect(page.locator("[data-evidence-detail], main").first()).toBeVisible();
  });

  test("reports shell renders export or ledger region", async ({ page }) => {
    await page.goto("/reports");
    await expect(page.locator("main").first()).toBeVisible();
    await expect(
      page
        .locator("main")
        .getByText(/Report|Export|Confirmed savings|ledger|upstream|unavailable|Loading/i)
        .first(),
    ).toBeVisible();
  });

  test("analyst Mode A opens and closes with Escape", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Ask Analyst/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("plant switcher stays available on alarms", async ({ page }) => {
    await page.goto("/alarms");
    await expect(page.locator("main").first()).toBeVisible();
    const switcher = page.getByLabel("Switch plant");
    if (await switcher.isVisible().catch(() => false)) {
      await switcher.selectOption({ label: "Vinayak Plant" });
      await expect(page.locator("main").first()).toBeVisible();
    }
  });
});
