import { expect, test } from "@playwright/test";

const GUIDE_SLUGS = [
  "emi-calculation-explained",
  "swp-vs-bank-account-emi",
  "home-loan-tax-benefits",
  "prepay-vs-invest",
  "down-payment-strategy",
];

test.describe("Guides navigation", () => {
  test("the guides hub lists all 5 guides", async ({ page }) => {
    await page.goto("/guides");

    for (const slug of GUIDE_SLUGS) {
      await expect(page.locator(`a[href="/guides/${slug}"]`)).toBeVisible();
    }
  });

  test("clicking into a guide loads real article content", async ({ page }) => {
    await page.goto("/guides");
    await page.locator('a[href="/guides/emi-calculation-explained"]').click();

    await expect(page).toHaveURL(/\/guides\/emi-calculation-explained/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("How Your EMI Is Calculated");
    await expect(page.getByText("₹80,559 per month")).toBeVisible();
  });

  test("visiting an unknown guide slug returns a 404", async ({ page }) => {
    const response = await page.goto("/guides/nonexistent-slug");
    expect(response?.status()).toBe(404);
  });
});
