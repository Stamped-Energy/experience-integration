import { expect, test } from "@playwright/test";

test.describe("PR-59 feature gates", () => {
  test("reports use horizontal tabs synced to ?section=", async ({ page }) => {
    await page.goto("/process/reports");
    await page.waitForLoadState("networkidle");
    const tablist = page.getByRole("tablist", { name: "Report sections" });
    await expect(tablist).toBeVisible();
    await expect(page.locator(".rep-outline")).toHaveCount(0);
    const tabs = tablist.getByRole("tab");
    await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
    const second = tabs.nth(1);
    const label = (await second.textContent())?.trim() ?? "";
    await second.click();
    await expect(page).toHaveURL(/section=/);
    await expect(second).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#" + (await second.getAttribute("aria-controls")))).toBeVisible();
    expect(label.length).toBeGreaterThan(0);
  });

  test("SPC page shows control chart limits and capability strip", async ({ page }) => {
    await page.goto("/quality/spc");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Demonstration SPC")).toBeVisible();
    await expect(page.getByText(/Cp\s+\d+\.\d+/).first()).toBeVisible();
    await expect(page.getByText(/Cpk\s+\d+\.\d+/).first()).toBeVisible();
    await expect(page.locator(".spc-chart-card").first()).toBeVisible();
  });

  test("disabling a screen hides nav and redirects direct URL", async ({ page }) => {
    await page.goto("/settings/screens");
    await page.waitForLoadState("networkidle");
    const reportsToggle = page.getByRole("checkbox", { name: /Reports enabled/i });
    await reportsToggle.uncheck();
    await page.goto("/process/reports");
    await page.waitForURL("**/process/proposals**");
    await page.goto("/process/proposals");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("link", { name: "Reports" })).toHaveCount(0);
    await page.goto("/settings/screens");
    await reportsToggle.check();
  });

  test("loop dashboard gauge is a single value arc", async ({ page }) => {
    await page.goto("/process/dashboards");
    await page.waitForLoadState("networkidle");
    const gauge = page.locator(".pc-gauge").first();
    await expect(gauge).toBeVisible();
    await expect(gauge.locator(".pc-gauge-value")).toHaveCount(1);
    await expect(gauge.locator(".pc-gauge-band")).toHaveCount(0);
    const nameFont = await gauge.locator(".pc-gauge-name").evaluate((el) => getComputedStyle(el).fontFamily);
    expect(nameFont.toLowerCase()).toMatch(/geist|inter|system-ui/);
    expect(Number(await gauge.locator(".pc-gauge-name").evaluate((el) => getComputedStyle(el).fontWeight))).toBeGreaterThanOrEqual(500);
  });

  test("process plant diagram canvas renders", async ({ page }) => {
    await page.goto("/process/line");
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".dg-canvas")).toBeVisible();
    await expect(page.getByText("PlantCraft")).toHaveCount(0);
  });
});
