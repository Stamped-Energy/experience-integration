import { test, expect } from "@playwright/test";

const DEMO_SESSION_KEY = "stamped.demo.session";
const DEMO_LOGIN_EMAIL = "demo@stamped.local";
const DEMO_LOGIN_PASSWORD = "StampedDemo123!";
const DEMO_PLANT_ID = "plant_jaipur_01";

test.describe("Jaipur demo session", () => {
  test("sessionStorage demo flag shows Jaipur demo banner", async ({ page }) => {
    await page.addInitScript(
      ({ key, payload }) => {
        window.sessionStorage.setItem(key, JSON.stringify(payload));
      },
      {
        key: DEMO_SESSION_KEY,
        payload: {
          email: DEMO_LOGIN_EMAIL,
          plantId: DEMO_PLANT_ID,
          orgId: "org_demo",
          role: "plant_head",
          signedInAt: new Date().toISOString(),
        },
      },
    );

    await page.goto("/");
    await expect(page.getByText(/Jaipur demo — sample data only/i)).toBeVisible();
    await expect(page.getByText(/Preview mode/i).first()).toBeVisible();
  });

  test("login form accepts demo credentials shape", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(DEMO_LOGIN_EMAIL);
    await page.getByLabel("Password").fill(DEMO_LOGIN_PASSWORD);
    await expect(page.getByRole("button", { name: /sign in/i })).toBeEnabled();
  });
});
