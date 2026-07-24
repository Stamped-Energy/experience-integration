import { expect, test } from "@playwright/test";

test.describe("operational journeys", () => {
  test("Today shows decision signals and Ask Analyst", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /Ask Analyst/i })).toBeVisible();
    await expect(page.locator("main#forge-main, main").first()).toBeVisible();
  });

  test("alarms console supports detail evidence link", async ({ page }) => {
    await page.goto("/alarms");
    await expect(page.locator("main").first()).toBeVisible();
    await page.goto("/alarms/alm_1001");
    await expect(
      page.getByLabel("Alarm detail actions").getByRole("link", { name: "Evidence" }),
    ).toBeVisible();
  });

  test("prescription triage and evidence scope", async ({ page }) => {
    await page.goto("/prescriptions");
    await expect(page.locator("main").getByText(/Prescription queue|Needs review/i).first()).toBeVisible();
    await page.goto("/evidence/evd_4401");
    await expect(page.locator("[data-evidence-detail], main").first()).toBeVisible();
    await expect(page.locator("main").getByText(/MD window|SIGNAL WINDOW|Tag/i).first()).toBeVisible();
  });

  test("ledger claim safety and export centre approval", async ({ page }) => {
    await page.goto("/reports");
    await expect(page.locator("main").getByText(/Pending utility bill verification|Confirmed savings|Export centre/i).first()).toBeVisible();
    await expect(page.locator("[data-export-centre], [data-ledger]").first()).toBeVisible();
    const approve = page.getByRole("button", { name: /^Approve$/i }).first();
    if (await approve.isVisible()) {
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
});
