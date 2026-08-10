import { expect, test } from "@playwright/test";

test.describe("Interactivity", () => {
  test("changing the home loan interest rate updates the EMI result card", async ({ page }) => {
    await page.goto("/");

    const emiValue = page.getByTestId("result-emi");
    const initialEmi = await emiValue.textContent();
    expect(initialEmi).toBeTruthy();

    // Real keystrokes rather than .fill(): .fill() proved unreliable for
    // this number input specifically under WebKit's test-runner automation
    // (confirmed via manual reproduction outside the test runner, where
    // .fill() worked fine — a WebKit/Playwright automation quirk, not an
    // app bug). Simulating actual typing is also more realistic anyway.
    const rateInput = page.getByRole("spinbutton", { name: "Home loan interest (exact value)" });
    await rateInput.click();
    await rateInput.selectText();
    await rateInput.pressSequentially("11");
    await rateInput.blur();

    await expect(emiValue).not.toHaveText(initialEmi ?? "");
  });
});
