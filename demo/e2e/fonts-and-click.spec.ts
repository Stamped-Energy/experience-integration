import { expect, test, type Page } from "@playwright/test";

const TOKEN_FONT_MARKERS = ["Geist", "Space Grotesk", "Inter", "system-ui", "ui-monospace", "Geist Mono", "JetBrains Mono"];

async function fontFamilies(page: Page, selectors: string[]) {
  return page.evaluate((sels) => {
    const out: { sel: string; family: string; text: string }[] = [];
    for (const sel of sels) {
      const el = document.querySelector(sel);
      if (!el) {
        out.push({ sel, family: "(missing)", text: "" });
        continue;
      }
      out.push({
        sel,
        family: getComputedStyle(el).fontFamily,
        text: (el.textContent ?? "").trim().slice(0, 40),
      });
    }
    return out;
  }, selectors);
}

function looksToken(family: string) {
  if (family === "(missing)") return false;
  return TOKEN_FONT_MARKERS.some((m) => family.includes(m));
}

test.describe("font tokens and whole-row click", () => {
  test("key text uses token font families", async ({ page }) => {
    await page.goto("/process/health");
    await page.waitForLoadState("networkidle");
    const health = await fontFamilies(page, [
      "main h1, .page-head h1",
      ".pc-gauge-number",
      "body",
    ]);
    for (const row of health) {
      if (row.family === "(missing)") continue;
      expect(looksToken(row.family), JSON.stringify(row)).toBeTruthy();
      expect(row.family.toLowerCase()).not.toContain("times");
    }

    await page.goto("/process/analytics");
    await page.waitForLoadState("networkidle");
    const anal = await fontFamilies(page, [".anal-status-card .num", "main h1, .page-head h1", "body"]);
    for (const row of anal) {
      if (row.family === "(missing)") continue;
      expect(looksToken(row.family), JSON.stringify(row)).toBeTruthy();
    }

    await page.goto("/quality");
    await page.waitForLoadState("networkidle");
    const quality = await fontFamilies(page, [
      "main h1, .page-head h1",
      ".table td",
      "body",
      ".card-title",
    ]);
    for (const row of quality) {
      if (row.family === "(missing)") continue;
      expect(looksToken(row.family), JSON.stringify(row)).toBeTruthy();
    }
  });

  test("clicking lot row body (not the name) opens the lot", async ({ page }) => {
    await page.goto("/quality");
    await page.waitForLoadState("networkidle");
    const row = page.locator("table.table-click tbody tr.clickable-row").first();
    await expect(row).toBeVisible();
    const href = await row.getAttribute("data-href");
    expect(href).toBeTruthy();
    expect(href!).toMatch(/\/quality\/lots\//);

    const bodyCell = row.locator("td").nth(2);
    await expect(bodyCell).toBeVisible();
    await bodyCell.click({ position: { x: 8, y: 8 } });
    await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });
});
