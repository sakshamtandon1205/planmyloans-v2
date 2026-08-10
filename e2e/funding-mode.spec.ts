import { expect, test } from "@playwright/test";

test.describe("Funding mode toggle", () => {
  test("switching to Bank account updates the corpus label and reveals the bank rate field", async ({ page }) => {
    await page.goto("/");

    const corpusField = page.getByText("Set automatically: own funds").locator("..");
    await expect(corpusField).toContainText("SWP corpus");

    await expect(page.getByRole("slider", { name: "SWP expected return" })).toBeVisible();
    await expect(page.getByRole("slider", { name: "Bank interest rate" })).toHaveCount(0);

    await page.getByRole("button", { name: "Bank account" }).click();

    await expect(corpusField).toContainText("Bank account");
    await expect(page.getByRole("slider", { name: "Bank interest rate" })).toBeVisible();
    await expect(page.getByRole("slider", { name: "SWP expected return" })).toHaveCount(0);
  });
});
