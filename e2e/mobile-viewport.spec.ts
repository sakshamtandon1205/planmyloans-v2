import { expect, test } from "@playwright/test";

test.describe("Mobile viewport", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const path of ["/", "/guides/emi-calculation-explained"]) {
    test(`no horizontal overflow on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );

      expect(hasOverflow).toBe(false);
    });
  }
});
