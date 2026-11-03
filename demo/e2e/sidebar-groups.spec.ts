import { expect, test, type Page } from "@playwright/test";

async function ensureRailExpanded(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem("stamped-rail", "expanded");
    document.documentElement.dataset.rail = "expanded";
  });
  const collapse = page.getByRole("button", { name: "Collapse sidebar" });
  if (!(await collapse.count())) {
    await page.getByRole("button", { name: "Expand sidebar" }).click();
  }
  await expect(page.getByRole("button", { name: "Collapse sidebar" })).toBeVisible();
}

function processHeader(page: Page) {
  return page.locator("nav#app-rail").getByRole("button", { name: /^Process/ });
}

function qualityHeader(page: Page) {
  return page.locator("nav#app-rail").getByRole("button", { name: /^Quality/ });
}

test.describe("sidebar Process / Quality groups", () => {
  test("can open both groups at once", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("stamped-rail", "expanded");
      localStorage.setItem("stamped-side-groups", JSON.stringify({ process: false, quality: false }));
    });
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await ensureRailExpanded(page);

    const processBtn = processHeader(page);
    const qualityBtn = qualityHeader(page);
    await expect(processBtn).toHaveAttribute("aria-expanded", "false");
    await expect(qualityBtn).toHaveAttribute("aria-expanded", "false");

    await processBtn.click();
    await qualityBtn.click();

    await expect(processBtn).toHaveAttribute("aria-expanded", "true");
    await expect(qualityBtn).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#side-sub-process")).toBeVisible();
    await expect(page.locator("#side-sub-quality")).toBeVisible();
  });

  test("can close both groups at once", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("stamped-rail", "expanded");
      localStorage.setItem("stamped-side-groups", JSON.stringify({ process: true, quality: true }));
    });
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await ensureRailExpanded(page);

    const processBtn = processHeader(page);
    const qualityBtn = qualityHeader(page);
    await expect(processBtn).toHaveAttribute("aria-expanded", "true");
    await expect(qualityBtn).toHaveAttribute("aria-expanded", "true");

    await processBtn.click();
    await qualityBtn.click();

    await expect(processBtn).toHaveAttribute("aria-expanded", "false");
    await expect(qualityBtn).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#side-sub-process")).toHaveCount(0);
    await expect(page.locator("#side-sub-quality")).toHaveCount(0);
  });

  test("can close the group that holds the active route", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("stamped-rail", "expanded");
      localStorage.setItem("stamped-side-groups", JSON.stringify({ process: true, quality: true }));
    });
    await page.goto("/quality/actions");
    await page.waitForLoadState("networkidle");
    await ensureRailExpanded(page);

    const qualityBtn = qualityHeader(page);
    const processBtn = processHeader(page);
    await expect(qualityBtn).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#side-sub-quality")).toBeVisible();

    await qualityBtn.click();
    await expect(qualityBtn).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#side-sub-quality")).toHaveCount(0);
    // stays closed while still on the quality route
    await expect(page).toHaveURL(/\/quality\/actions/);
    await expect(qualityBtn).toHaveAttribute("aria-expanded", "false");

    // Process can stay open independently
    if ((await processBtn.getAttribute("aria-expanded")) !== "true") {
      await processBtn.click();
    }
    await expect(processBtn).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#side-sub-process")).toBeVisible();
    await expect(qualityBtn).toHaveAttribute("aria-expanded", "false");
  });
});
