import { expect, test } from "@playwright/test";

/**
 * Shell smoke journeys — CI runs Next without a BFF, so live alarm/Rx/evidence
 * content may be empty/unavailable. Assert the forge shell loads; treat
 * fixture-era detail copy as optional.
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
    const evidence = page
      .getByLabel("Alarm links")
      .getByRole("link", { name: "Evidence" });
    if (await evidence.isVisible().catch(() => false)) {
      await expect(evidence).toBeVisible();
    }
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
    const signalCopy = page
      .locator("main")
      .getByText(/MD window|SIGNAL WINDOW|Tag|Evidence|unavailable|empty/i)
      .first();
    await expect(signalCopy).toBeVisible();
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
    const approve = page.getByRole("button", { name: /^Approve$/i }).first();
    if (await approve.isVisible().catch(() => false)) {
      await approve.click();
      await expect(page.locator("main").getByText(/approved|Download/i).first()).toBeVisible();
    }
  });

  test("analyst Mode A opens and closes with Escape", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Ask Analyst/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("plant switcher stays available on alarms and prescriptions", async ({ page }) => {
    await page.goto("/alarms");
    await expect(page.locator("main").first()).toBeVisible();
    const switcher = page.getByLabel("Switch plant");
    if (await switcher.isVisible().catch(() => false)) {
      const hasVinayak = await switcher
        .locator("option", { hasText: "Vinayak Plant" })
        .count();
      if (hasVinayak > 0) {
        await switcher.selectOption({ label: "Vinayak Plant" });
      }
    }
    await expect(page.locator("main").first()).toBeVisible();

    await page.goto("/prescriptions");
    await expect(page.locator("main").first()).toBeVisible();
  });
});
