import { expect, test } from "@playwright/test";

test.describe("inbox follows View as role", () => {
  test("Waiting for me and badge change when the role changes", async ({ page }) => {
    await page.goto("/inbox");
    await page.waitForLoadState("networkidle");
    await page.locator(".role-switch select").selectOption("plant-head");
    await expect(page.getByRole("heading", { name: "Waiting for me", exact: true })).toBeVisible();
    await expect(page.getByText(/waiting for the plant head/i)).toBeVisible();
    const plantHeadBadge = page.getByRole("navigation", { name: "Product" }).getByRole("link", { name: /^Inbox/ }).locator(".side-badge");
    const plantHeadCount = Number((await plantHeadBadge.textContent())?.trim() ?? "0");
    expect(plantHeadCount).toBeGreaterThan(0);

    await page.locator(".role-switch select").selectOption("operator");
    await expect(page.getByText(/waiting for the operator/i)).toBeVisible();
    await expect(page.getByText(/waiting for the plant head/i)).toHaveCount(0);
    const operatorBadge = page.getByRole("navigation", { name: "Product" }).getByRole("link", { name: /^Inbox/ }).locator(".side-badge");
    const operatorCount = Number((await operatorBadge.textContent())?.trim() ?? "0");
    expect(operatorCount).toBeGreaterThan(0);
    expect(operatorCount).not.toBe(plantHeadCount);

    await page.locator(".role-switch select").selectOption("quality-head");
    await page.getByRole("navigation", { name: "Inbox" }).getByRole("link", { name: /Tasks/ }).click();
    await expect(page.getByText(/for the quality head/i)).toBeVisible();
  });
});
