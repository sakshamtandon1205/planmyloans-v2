import { expect, test } from "@playwright/test";

/**
 * Ground truth derived by actually running calculateEmi/generateAmortizationSchedule
 * from src/lib/calculations against the real DEFAULT_INPUTS (see calculatorTypes.ts):
 * principal ₹1,00,00,000 (price 1.4Cr - down payment 40L), 7.5% annual rate, 240 months,
 * no prepayment -> EMI 80559.31935518023, payoffMonths 240 (20.0 yrs).
 *
 * Quick Estimate's rate/tenure/loan-amount are synced live with the full
 * planner (Section E), so its default is the same loan and thus the same EMI.
 */
const QUICK_ESTIMATE_EMI = "₹80,559";

const EXPECTED_EMI = "₹80,559/mo";
const EXPECTED_PAYOFF = "20.0 yrs (240 mo)";

test.describe("Default scenario", () => {
  test("Quick Estimate shows the correct EMI for its own default inputs", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("quick-emi")).toHaveText(QUICK_ESTIMATE_EMI);
  });

  test("full planner shows the correct EMI and payoff time for the default inputs", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("result-emi")).toHaveText(EXPECTED_EMI);
    await expect(page.getByTestId("result-payoff")).toHaveText(EXPECTED_PAYOFF);
  });
});
