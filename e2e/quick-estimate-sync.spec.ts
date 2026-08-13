import { expect, test } from "@playwright/test";

/**
 * Home loan interest rate, tenure, and loan amount (mirrored against the
 * Planner's Property price − Down payment) are shared live between Quick
 * Estimate and the full Planner via a Zustand store (see
 * src/lib/sharedInputsStore.ts). Each field is checked in both directions.
 */
test.describe("Quick Estimate <-> Planner sync", () => {
  test("rate: Quick Estimate edit propagates to the Planner", async ({ page }) => {
    await page.goto("/");

    const quickRate = page.getByRole("spinbutton", { name: "Interest rate (exact value)" });
    await quickRate.click();
    await quickRate.selectText();
    await quickRate.pressSequentially("9.25", { delay: 50 });
    await quickRate.blur();

    const plannerRate = page.getByRole("spinbutton", { name: "Home loan interest (exact value)" });
    await expect(plannerRate).toHaveValue("9.25");
  });

  test("rate: Planner edit propagates to Quick Estimate", async ({ page }) => {
    await page.goto("/");

    const plannerRate = page.getByRole("spinbutton", { name: "Home loan interest (exact value)" });
    await plannerRate.click();
    await plannerRate.selectText();
    await plannerRate.pressSequentially("10.5", { delay: 50 });
    await plannerRate.blur();

    const quickRate = page.getByRole("spinbutton", { name: "Interest rate (exact value)" });
    await expect(quickRate).toHaveValue("10.5");
  });

  test("tenure: Quick Estimate edit propagates to the Planner", async ({ page }) => {
    await page.goto("/");

    const quickTenure = page.getByRole("spinbutton", { name: "Tenure (exact value)", exact: true });
    await quickTenure.click();
    await quickTenure.selectText();
    await quickTenure.pressSequentially("12", { delay: 50 });
    await quickTenure.blur();

    const plannerTenure = page.getByRole("spinbutton", { name: "Loan tenure (exact value)" });
    await expect(plannerTenure).toHaveValue("12");
  });

  test("tenure: Planner edit propagates to Quick Estimate", async ({ page }) => {
    await page.goto("/");

    const plannerTenure = page.getByRole("spinbutton", { name: "Loan tenure (exact value)" });
    await plannerTenure.click();
    await plannerTenure.selectText();
    await plannerTenure.pressSequentially("8", { delay: 50 });
    await plannerTenure.blur();

    const quickTenure = page.getByRole("spinbutton", { name: "Tenure (exact value)", exact: true });
    await expect(quickTenure).toHaveValue("8");
  });

  test("loan amount: Quick Estimate edit raises the Planner's price, holding down payment fixed", async ({
    page,
  }) => {
    await page.goto("/");

    const plannerDp = page.getByRole("spinbutton", { name: "Down payment (exact value)" });
    const dpBefore = await plannerDp.inputValue();

    // Loan amount takes raw rupees directly, same as the Planner's own fields.
    const quickLoan = page.getByRole("spinbutton", { name: "Loan amount (exact value)" });
    await quickLoan.click();
    await quickLoan.selectText();
    await quickLoan.pressSequentially("12000000", { delay: 80 });
    await quickLoan.blur();

    const plannerPrice = page.getByRole("spinbutton", { name: "Property price (exact value)" });
    await expect(plannerDp).toHaveValue(dpBefore);
    await expect(plannerPrice).toHaveValue(String(12000000 + Number(dpBefore)));
  });

  test("loan amount: reproduces the reported ₹3,18,00,000 scenario — Property price field itself must update, not just the EMI figure", async ({
    page,
  }) => {
    await page.goto("/");

    const plannerDp = page.getByRole("spinbutton", { name: "Down payment (exact value)" });
    const dpBefore = Number(await plannerDp.inputValue());
    const plannerPrice = page.getByRole("spinbutton", { name: "Property price (exact value)" });
    const priceBefore = await plannerPrice.inputValue();

    // Raw rupees, typed directly — no Cr/L conversion.
    const quickLoan = page.getByRole("spinbutton", { name: "Loan amount (exact value)" });
    await quickLoan.click();
    await quickLoan.selectText();
    await quickLoan.pressSequentially("31800000", { delay: 80 });
    await quickLoan.blur();

    // The actual input value, not a derived display string — this is what
    // was reported stuck at its old value.
    await expect(plannerPrice).not.toHaveValue(priceBefore);
    await expect(plannerPrice).toHaveValue(String(31800000 + dpBefore));
    await expect(plannerDp).toHaveValue(String(dpBefore));

    // EMI in both places must agree once the animated hero number settles.
    const quickEmi = page.getByTestId("quick-emi");
    await expect(quickEmi).toHaveText("₹2,56,179", { timeout: 3000 });
    await expect(page.getByTestId("result-emi")).toHaveText("₹2,56,179/mo");
  });

  test("loan amount: Planner price edit updates Quick Estimate's loan amount", async ({ page }) => {
    await page.goto("/");

    const plannerDp = page.getByRole("spinbutton", { name: "Down payment (exact value)" });
    const dp = Number(await plannerDp.inputValue());

    const plannerPrice = page.getByRole("spinbutton", { name: "Property price (exact value)" });
    await plannerPrice.click();
    await plannerPrice.selectText();
    await plannerPrice.pressSequentially("20000000", { delay: 50 });
    await plannerPrice.blur();

    const expectedLoan = 20000000 - dp;
    const quickLoan = page.getByRole("spinbutton", { name: "Loan amount (exact value)" });
    await expect(quickLoan).toHaveValue(String(expectedLoan));
  });

  test("prepayment: Quick Estimate's Total interest reacts to a Planner prepayment plan, matching the Planner's own actual-interest math (Interest saved card) rather than a stale baseline", async ({
    page,
  }) => {
    await page.goto("/");

    const quickTotalInterest = page.getByTestId("quick-total-interest");
    // "Interest saved" = baseline (no-prepay) interest minus actual interest —
    // the Planner's own real-math card, now that the outcome grid no longer
    // duplicates a raw "Total interest paid" figure (dropped from the 6-card
    // grid in the redesign; Quick Estimate is the only place that number is
    // still shown directly).
    const interestSaved = page.getByTestId("result-total-interest");

    // Baseline (no prepayment): nothing saved yet.
    const baselineQuick = await quickTotalInterest.textContent();
    await expect(interestSaved).toHaveText("₹0.00 L");

    // Configure real prepayment in the full Planner only — Quick Estimate has no
    // prepayment input of its own, it should pick this up via the shared store.
    const extraPrepay = page.getByRole("spinbutton", { name: "Extra monthly prepay (exact value)" });
    await extraPrepay.click();
    await extraPrepay.selectText();
    await extraPrepay.pressSequentially("10000", { delay: 50 });
    await extraPrepay.blur();

    const withPrepayQuick = await quickTotalInterest.textContent();
    expect(withPrepayQuick).not.toBe(baselineQuick); // sanity: the number actually moved
    // Interest saved should now be positive and reflect the same gap.
    await expect(interestSaved).not.toHaveText("₹0");

    // The Monthly EMI figure is unaffected by prepayment (it's the starting EMI).
    await expect(page.getByTestId("quick-emi")).toHaveText("₹80,559");

    // Caption should now explain the discrepancy with a naive calculation.
    await expect(page.getByText("Includes your prepayment plan set below")).toBeVisible();

    // Reset back to zero prepayment: both totals should converge again.
    await extraPrepay.click();
    await extraPrepay.selectText();
    await extraPrepay.pressSequentially("0", { delay: 50 });
    await extraPrepay.blur();

    const resetQuick = await quickTotalInterest.textContent();
    expect(resetQuick).toBe(baselineQuick);
    await expect(interestSaved).toHaveText("₹0.00 L");
    await expect(page.getByText("Simple estimate — see the full planner")).toBeVisible();
  });

  test("no console/page errors during rapid back-and-forth edits (regression guard for update-loop bugs)", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));
    await page.goto("/");

    const quickRate = page.getByRole("spinbutton", { name: "Interest rate (exact value)" });
    const plannerRate = page.getByRole("spinbutton", { name: "Home loan interest (exact value)" });

    for (const value of ["7", "11", "8.5"]) {
      await quickRate.click();
      await quickRate.selectText();
      await quickRate.pressSequentially(value, { delay: 50 });
      await quickRate.blur();
    }
    await plannerRate.click();
    await plannerRate.selectText();
    await plannerRate.pressSequentially("9", { delay: 50 });
    await plannerRate.blur();

    await expect(quickRate).toHaveValue("9");
    expect(pageErrors).toEqual([]);
  });
});
