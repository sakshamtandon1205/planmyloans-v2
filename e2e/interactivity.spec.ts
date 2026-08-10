import { expect, test } from "@playwright/test";

test.describe("Interactivity", () => {
  test("changing the home loan interest rate updates the EMI result card", async ({ page }) => {
    await page.goto("/");

    const emiValue = page.getByTestId("result-emi");
    const initialEmi = await emiValue.textContent();
    expect(initialEmi).toBeTruthy();

    const rateInput = page.getByRole("spinbutton", { name: "Home loan interest (exact value)" });
    await rateInput.fill("11");
    await rateInput.dispatchEvent("change");

    await expect(emiValue).not.toHaveText(initialEmi ?? "");
  });
});
