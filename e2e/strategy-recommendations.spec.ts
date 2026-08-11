import { expect, test } from "@playwright/test";

/**
 * The 4-strategy recommendations feature (StrategyInputs -> StrategyGrid ->
 * StrategyCard -> "Use this plan" into the shared store). Scoped to
 * Chromium only during this feature's build-out per the dev workflow note —
 * the full cross-browser + accessibility pass happens separately once the
 * visuals are approved.
 */
test.beforeEach(({ browserName }) => {
  test.skip(browserName !== "chromium", "Scoped to Chromium only during this feature's build-out.");
});

async function showStrategies(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Show me strategies" }).click();
}

test.describe("Strategy recommendations", () => {
  test("all 4 cards render with plausible, distinct EMI/payoff/interest data", async ({ page }) => {
    await showStrategies(page);

    for (const id of ["safety", "balanced", "aggressive", "offset"]) {
      await expect(page.getByTestId(`strategy-card-${id}`)).toBeVisible();
      await expect(page.getByTestId(`strategy-emi-${id}`)).not.toHaveText("");
      await expect(page.getByTestId(`strategy-payoff-${id}`)).not.toHaveText("");
    }

    // Total interest is shown for the first 3; Interest Offset shows a
    // required-return headline instead — both must be real, non-empty figures.
    const safetyInterest = await page.getByTestId("strategy-interest-safety").textContent();
    const balancedInterest = await page.getByTestId("strategy-interest-balanced").textContent();
    const aggressiveInterest = await page.getByTestId("strategy-interest-aggressive").textContent();
    expect(safetyInterest).toBeTruthy();
    expect(balancedInterest).toBeTruthy();
    expect(aggressiveInterest).toBeTruthy();
    // Sanity: the 3 cards don't all show the identical figure (genuinely
    // distinct strategies, not 4 copies of the same computation).
    expect(new Set([safetyInterest, balancedInterest, aggressiveInterest]).size).toBe(3);

    await expect(page.getByTestId("strategy-required-return-offset")).not.toHaveText("");

    await expect(page.getByText("Recommended")).toBeVisible();
  });

  test("Safety First's +1 EMI/year toggle recalculates payoff and interest inline", async ({ page }) => {
    await showStrategies(page);

    const payoff = page.getByTestId("strategy-payoff-safety");
    const interest = page.getByTestId("strategy-interest-safety");
    const before = { payoff: await payoff.textContent(), interest: await interest.textContent() };

    await page.getByTestId("strategy-lumpsum-toggle").check();

    await expect(payoff).not.toHaveText(before.payoff ?? "");
    await expect(interest).not.toHaveText(before.interest ?? "");

    // Toggling back off restores the original figures.
    await page.getByTestId("strategy-lumpsum-toggle").uncheck();
    await expect(payoff).toHaveText(before.payoff ?? "");
    await expect(interest).toHaveText(before.interest ?? "");
  });

  test("Interest Offset's 'See sensitivity' expands detail before offering 'Use this plan'", async ({ page }) => {
    await showStrategies(page);

    await expect(page.getByTestId("strategy-use-plan-offset")).toHaveCount(0);
    await page.getByTestId("strategy-see-sensitivity").click();
    await expect(page.getByText(/needs to compound at/)).toBeVisible();
    await expect(page.getByTestId("strategy-use-plan-offset")).toBeVisible();
  });

  test("'Use this plan' on the Balanced card populates the real Planner fields, not just a scroll", async ({
    page,
  }) => {
    await showStrategies(page);

    await page.getByTestId("strategy-use-plan-balanced").click();

    // Real rendered field values in the full Planner's control panel (scoped
    // to #planner — the strategy entry form above reuses some of the same
    // field labels, e.g. "Property price").
    const planner = page.locator("#planner");
    const price = planner.getByRole("spinbutton", { name: "Property price (exact value)" });
    const dp = planner.getByRole("spinbutton", { name: "Down payment (exact value)" });
    const mf = planner.getByRole("spinbutton", { name: "MF lumpsum (exact value)" });
    const extra = planner.getByRole("spinbutton", { name: "Extra monthly prepay (exact value)" });
    const stepup = planner.getByRole("spinbutton", { name: "Step up prepay yearly (exact value)" });
    const swpToggle = planner.getByRole("button", { name: "SWP (mutual fund)" });

    await expect(price).toHaveValue("14000000");
    await expect(extra).toHaveValue("30000");
    await expect(stepup).toHaveValue("8");
    await expect(swpToggle).toHaveAttribute("aria-pressed", "true");

    const dpValue = Number(await dp.inputValue());
    const mfValue = Number(await mf.inputValue());
    expect(dpValue).toBeCloseTo(5349354.07, 0);
    expect(mfValue).toBeCloseTo(2431524.58, 0);

    // Landed on a fully populated, immediately-editable planner view.
    await expect(page.locator("#planner")).toBeInViewport();
  });

  test("mobile viewport (2x2 grid) renders without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await showStrategies(page);

    for (const id of ["safety", "balanced", "aggressive", "offset"]) {
      await expect(page.getByTestId(`strategy-card-${id}`)).toBeVisible();
    }

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(hasOverflow).toBe(false);

    // 2x2: Safety First and Balanced share a row, distinct from Aggressive/Offset's row.
    const safetyBox = await page.getByTestId("strategy-card-safety").boundingBox();
    const balancedBox = await page.getByTestId("strategy-card-balanced").boundingBox();
    const aggressiveBox = await page.getByTestId("strategy-card-aggressive").boundingBox();
    expect(safetyBox && balancedBox && Math.abs(safetyBox.y - balancedBox.y)).toBeLessThan(5);
    expect(safetyBox && aggressiveBox && Math.abs(safetyBox.y - aggressiveBox.y)).toBeGreaterThan(50);
  });
});
