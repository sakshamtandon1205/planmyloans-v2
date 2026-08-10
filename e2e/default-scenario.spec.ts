import { expect, test } from "@playwright/test";

/**
 * Ground truth derived by actually running calculateEmi/generateAmortizationSchedule
 * from src/lib/calculations against the real DEFAULT_INPUTS (see calculatorTypes.ts):
 * principal ₹1,00,00,000 (price 1.4Cr - down payment 40L), 7.5% annual rate, 240 months,
 * no prepayment -> EMI 80559.31935518023, payoffMonths 240 (20.0 yrs).
 */
const EXPECTED_EMI = "₹80,559";
const EXPECTED_PAYOFF_YEARS = "20.0 yrs";
const EXPECTED_PAYOFF_MONTHS = "240 months";

test.describe("Default scenario", () => {
  test("shows the correct EMI and payoff time for the default inputs", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("result-emi")).toHaveText(EXPECTED_EMI);
    await expect(page.getByTestId("result-payoff")).toHaveText(EXPECTED_PAYOFF_YEARS);
    await expect(page.getByText(EXPECTED_PAYOFF_MONTHS)).toBeVisible();
  });
});
