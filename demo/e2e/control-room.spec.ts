import { expect, test } from "@playwright/test";

const DEMO_EMAIL = "demo@stamped.local";
const DEMO_PASSWORD = "StampedDemo123!";

test.describe("control-room production smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(DEMO_EMAIL);
    await page.getByLabel("Password").fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("[data-demo-session-banner]")).toBeVisible();
  });

  test("prioritises Overview actions and keeps the seven-signal cap", async ({ page }) => {
    await page.goto("/overview");
    await expect(page.locator("[data-overview-board]")).toBeVisible();
    await expect(page.locator("[data-overview-board] [data-signal-id]")).toHaveCount(7);
    await expect(page.getByRole("heading", { name: "Next operating actions" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Review action" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Show proof" }).first()).toBeVisible();
  });

  test("opens and closes contextual Analyst with keyboard focus return", async ({ page }) => {
    const askAnalyst = page.getByRole("button", { name: "Ask Stamped" });
    await askAnalyst.click();

    const dialog = page.getByRole("dialog", { name: "Stamped" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Attached context")).toBeVisible();
    await expect(dialog.getByTitle("Remove from context").first()).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(askAnalyst).toBeFocused();
  });

  test("renders fixture Analyst answers with source controls", async ({ page }) => {
    await page.goto("/analyst");
    await expect(page.getByRole("heading", { name: "Ask Stamped" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Conversations" })).toBeVisible();

    await page
      .getByRole("button", { name: /Summarize open alarms/ })
      .click();

    await expect(page.getByText("Stamped").last()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: /source/ }).last()).toBeVisible({
      timeout: 10_000,
    });
  });
});
