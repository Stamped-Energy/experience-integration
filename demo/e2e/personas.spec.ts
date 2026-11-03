import { expect, test, type Page } from "@playwright/test";

const ROLE_COOKIE = "stamped-role";

async function asRole(page: Page, role: string) {
  await page.context().addCookies([
    { name: ROLE_COOKIE, value: role, url: "http://127.0.0.1:3010" },
  ]);
}

test.describe("persona happy paths", () => {
  test("plant head lands on Plant with a full decision card", async ({ page }) => {
    await asRole(page, "plant-head");
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Plant today", exact: true })).toBeVisible();
    await expect(page.getByText("Plant head view")).toBeVisible();
    const card = page.getByRole("article").filter({ has: page.getByRole("heading", { name: /hold pressure/i }) }).first();
    await expect(card).toBeVisible();
    await expect(card.getByText("Expected result")).toBeVisible();
    await expect(card.getByText("Limits")).toBeVisible();
    await expect(card.getByRole("button", { name: /Accept/i })).toBeEnabled();
  });

  test("process engineer lands on Plant and reaches Line B settings", async ({ page }) => {
    await asRole(page, "process-engineer");
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Plant today", exact: true })).toBeVisible();
    await expect(page.getByText("Process engineer view")).toBeVisible();
    await page.goto("/process/lines/line-b");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /Moulding/i }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Running settings", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Accept 760 bar/i }).first()).toBeVisible();
  });

  test("quality head lands on Plant with lots and opens lot investigation", async ({ page }) => {
    await asRole(page, "quality-head");
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Plant today", exact: true })).toBeVisible();
    await expect(page.getByText("Quality head view")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Lots at risk", exact: true })).toBeVisible();
    await page.goto("/quality/investigations/inv-1");
    await page.waitForLoadState("load");
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("presenter start link ?as=role sets cookie and keeps view", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/?as=quality-head&view=plant");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/view=plant/);
    await expect(page).not.toHaveURL(/[?&]as=/);
    await expect(page.getByRole("heading", { name: "Plant today", exact: true })).toBeVisible();
    await expect(page.getByText("Quality head view")).toBeVisible();
    await expect(page.locator(".role-switch select")).toHaveValue("quality-head");
    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === ROLE_COOKIE)?.value).toBe("quality-head");
  });
});
