import { expect, test } from "@playwright/test";

const PROCESS_ACTION_IDS = ["ex-p1", "ex-p2", "ex-p3", "ex-p4", "ex-p5", "ex-p6"] as const;

test.describe("process action detail routes", () => {
  for (const id of PROCESS_ACTION_IDS) {
    test(`opens /process/actions/${id} with outcomes and closed loop`, async ({ page }) => {
      await page.goto(`/process/actions/${id}`);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("main h1, .page-head h1").first()).toBeVisible();
      const tabs = page.getByRole("navigation", { name: "Process · Actions" });
      await expect(tabs).toBeVisible();
      await expect(tabs.getByRole("link", { name: "Action cards" })).toHaveAttribute("aria-current", "page");
      await expect(page.locator(".ex-outcome-strip")).toBeVisible();
      await expect(page.getByRole("heading", { name: "How we calculated this" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Evidence" })).toBeVisible();
      await expect(
        page.getByText("Every action is tried on the model first, applied on the line, then measured, and the result feeds the next one."),
      ).toBeVisible();
      await expect(page.getByText("Stamped recommends and your team decides")).toHaveCount(0);
      await expect(page.getByRole("link", { name: "← Back to actions" })).toBeVisible();
    });
  }

  test("running coil-warm action shows measured-on-the-line status", async ({ page }) => {
    await page.goto("/process/actions/ex-p2");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Measured on the line: heats per 100 parts down 5/)).toBeVisible();
    await expect(page.locator(".action-loop-facts dt", { hasText: "Written" })).toBeVisible();
    await expect(page.locator(".action-loop-facts dt", { hasText: "Measured after" })).toBeVisible();
    await expect(page.locator(".action-loop-facts dt", { hasText: "Verified result" })).toBeVisible();
  });
});
