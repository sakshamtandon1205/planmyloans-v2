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
  await page.getByRole("button", { name: /See 4 tailored strategies/ }).click();
  await page.getByRole("button", { name: "Show me strategies" }).click();
}

test.describe("Strategy recommendations", () => {
  test("all 4 cards render with plausible, distinct EMI/payoff/interest data", async ({ page }) => {
    await showStrategies(page);

    for (const id of ["safety", "balanced", "aggressive", "bonus"]) {
      await expect(page.getByTestId(`strategy-card-${id}`)).toBeVisible();
      await expect(page.getByTestId(`strategy-emi-${id}`)).not.toHaveText("");
      await expect(page.getByTestId(`strategy-payoff-${id}`)).not.toHaveText("");
      await expect(page.getByTestId(`strategy-downpayment-${id}`)).not.toHaveText("");
      await expect(page.getByTestId(`strategy-runway-${id}`)).not.toHaveText("");
      await expect(page.getByTestId(`strategy-wealth-${id}`)).not.toHaveText("");
    }

    // Total interest is shown for the first 3; Tax-Optimized Payoff shows
    // tax-saved/net-effective-cost headline figures instead.
    const safetyInterest = await page.getByTestId("strategy-interest-safety").textContent();
    const balancedInterest = await page.getByTestId("strategy-interest-balanced").textContent();
    const aggressiveInterest = await page.getByTestId("strategy-interest-aggressive").textContent();
    expect(safetyInterest).toBeTruthy();
    expect(balancedInterest).toBeTruthy();
    expect(aggressiveInterest).toBeTruthy();
    // Sanity: the 3 cards don't all show the identical figure (genuinely
    // distinct strategies, not 3 copies of the same computation).
    expect(new Set([safetyInterest, balancedInterest, aggressiveInterest]).size).toBe(3);

    await expect(page.getByTestId("strategy-taxsaved-bonus")).not.toHaveText("");
    await expect(page.getByTestId("strategy-neteffective-bonus")).not.toHaveText("");
    await expect(page.getByText("Assumes Old Tax Regime")).toBeVisible();

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

  test("Tax-Optimized Payoff's 'Use this plan' works directly, no expand-gate", async ({ page }) => {
    await showStrategies(page);

    await expect(page.getByTestId("strategy-use-plan-bonus")).toBeVisible();
    await expect(page.getByTestId("strategy-use-plan-bonus")).toBeEnabled();
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
    const stepup = planner.getByRole("spinbutton", { name: "Step up prepay yearly (exact value)" });
    const swpToggle = planner.getByRole("button", { name: "SWP (mutual fund)" });

    await expect(price).toHaveValue("14000000");
    // Balanced's down payment now targets a medium ~40-50% of own funds
    // (floored at 20% of price if that's ever higher) — no longer a fixed
    // value, so just check it landed meaningfully above the floor.
    const dpValue = Number(await dp.inputValue());
    expect(dpValue).toBeGreaterThan(0.2 * 14000000);
    await expect(stepup).toHaveValue("3");
    await expect(swpToggle).toHaveAttribute("aria-pressed", "true");

    const mfValue = Number(await mf.inputValue());
    expect(mfValue).toBeGreaterThan(0);

    // Landed on a fully populated, immediately-editable planner view.
    await expect(page.locator("#planner")).toBeInViewport();
  });

  test("mobile viewport (swipeable carousel) renders one card at a time without horizontal page overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await showStrategies(page);

    // All 4 cards exist in the DOM (inside the horizontally-scrolling
    // carousel track), but only the first is in view before any swipe.
    for (const id of ["safety", "balanced", "aggressive", "bonus"]) {
      await expect(page.getByTestId(`strategy-card-${id}`)).toBeAttached();
    }
    await expect(page.getByTestId("strategy-card-safety")).toBeInViewport();
    await expect(page.getByTestId("strategy-card-bonus")).not.toBeInViewport();

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(hasOverflow).toBe(false);

    // The carousel's own scroller may legitimately overflow horizontally
    // (that's the swipe surface) — confirm it's actually scrollable.
    const carousel = page.getByTestId("strategy-carousel");
    const isScrollable = await carousel.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
    expect(isScrollable).toBe(true);

    // The "next" dot/arrow advances the carousel to the next card.
    await page.getByRole("button", { name: "Next strategy" }).click();
    await expect(page.getByTestId("strategy-card-balanced")).toBeInViewport();
  });
});
