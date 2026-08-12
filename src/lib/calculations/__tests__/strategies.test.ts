import { describe, expect, it } from "vitest";
import { generateAmortizationSchedule } from "../emi";
import { calculateMfFutureValue } from "../mf";
import {
  AGGRESSIVE_STEP_UP_PERCENT,
  BALANCED_STEP_UP_PERCENT,
  computeStrategies,
  DOWN_PAYMENT_FLOOR_PERCENT,
  type StrategyEngineInput,
} from "../strategies";
import { calculateLoanTaxBenefitFromSchedule } from "../tax";

const BASE_INPUT: StrategyEngineInput = {
  propertyPrice: 14000000,
  ownFunds: 10000000,
  loanRatePercent: 7.5,
  tenureYears: 20,
};

// Own funds generous enough for Safety First's huge, bank-return-only
// corpus to actually outlast a near-full tenure draw window (a 6.5% bank
// return can't sustain that without a large starting balance), while
// Aggressive Payoff's deliberately thin, fixed 12-month corpus still runs
// dry — same underlying math verified in earlier build rounds, re-checked
// against this rebuilt engine's own numbers.
const DIVERGENT_INPUT: StrategyEngineInput = {
  propertyPrice: 14000000,
  ownFunds: 17000000,
  loanRatePercent: 7.5,
  tenureYears: 20,
};

describe("computeStrategies", () => {
  it("returns exactly 4 strategies with the expected ids, in a stable order", () => {
    const results = computeStrategies(BASE_INPUT);
    expect(results.map((r) => r.id)).toEqual(["safety", "balanced", "aggressive", "bonus"]);
  });

  it("respects the 20% down-payment floor for every strategy, never going below it", () => {
    const results = computeStrategies(BASE_INPUT);
    for (const r of results) {
      expect(r.downPaymentPercent).toBeGreaterThanOrEqual(DOWN_PAYMENT_FLOOR_PERCENT - 1e-9);
      expect(r.capitalStack.downPayment / BASE_INPUT.propertyPrice).toBeGreaterThanOrEqual(
        DOWN_PAYMENT_FLOOR_PERCENT - 1e-9,
      );
    }
  });

  it("fixes Tax-Optimized Payoff's down payment at exactly the 20% floor", () => {
    const results = computeStrategies(BASE_INPUT);
    const bonus = results.find((r) => r.id === "bonus")!;
    expect(bonus.downPaymentPercent).toBeCloseTo(DOWN_PAYMENT_FLOOR_PERCENT, 6);
  });

  it("targets Balanced's down payment at a medium 40-50% of own funds, above the floor and below Safety First's", () => {
    const results = computeStrategies(BASE_INPUT);
    const safety = results.find((r) => r.id === "safety")!;
    const balanced = results.find((r) => r.id === "balanced")!;

    const balancedDpAsShareOfOwnFunds = balanced.capitalStack.downPayment / BASE_INPUT.ownFunds;
    expect(balancedDpAsShareOfOwnFunds).toBeGreaterThanOrEqual(0.4 - 1e-6);
    expect(balancedDpAsShareOfOwnFunds).toBeLessThanOrEqual(0.5 + 1e-6);
    expect(balanced.downPaymentPercent).toBeGreaterThan(DOWN_PAYMENT_FLOOR_PERCENT + 1e-6);
    expect(balanced.downPaymentPercent).toBeLessThan(safety.downPaymentPercent);
  });

  it("keeps each capital stack within own funds and derives loan amount from price - down payment", () => {
    const results = computeStrategies(BASE_INPUT);
    for (const r of results) {
      const { downPayment, mfLumpsum, corpus, loanAmount } = r.capitalStack;
      expect(downPayment + mfLumpsum + corpus).toBeLessThanOrEqual(BASE_INPUT.ownFunds + 1e-6);
      expect(loanAmount).toBeCloseTo(BASE_INPUT.propertyPrice - downPayment, 6);
      expect(downPayment).toBeGreaterThanOrEqual(0);
      expect(mfLumpsum).toBeGreaterThanOrEqual(0);
      expect(corpus).toBeGreaterThanOrEqual(0);
    }
  });

  it("caps extra monthly prepay as a percentage of each strategy's own EMI, at realistic salaried-person levels", () => {
    const results = computeStrategies(BASE_INPUT);
    const caps: Record<string, number> = { safety: 5, balanced: 12.5, aggressive: 15, bonus: 0 };
    for (const r of results) {
      // Grid points are now rounded to the nearest ₹100 (Part 6) before
      // simulation, so the resulting percentage-of-EMI can drift slightly
      // past the nominal search cap — bounded by 100 rupees' worth of EMI,
      // which is a fraction of a percentage point at realistic EMI sizes.
      const pctOfEmi = (r.extraMonthlyPrepayment / r.emi) * 100;
      expect(pctOfEmi).toBeLessThanOrEqual(caps[r.id] + 0.5);
    }
  });

  it("rounds every extra monthly prepay figure to a clean multiple of ₹100", () => {
    const results = computeStrategies(BASE_INPUT);
    for (const r of results) {
      expect(r.extraMonthlyPrepayment % 100).toBe(0);
    }
  });

  it("Safety First never depletes its corpus on inputs where Aggressive Payoff does", () => {
    const results = computeStrategies(DIVERGENT_INPUT);
    const safety = results.find((r) => r.id === "safety")!;
    const aggressive = results.find((r) => r.id === "aggressive")!;

    expect(safety.corpusDepletedAtMonth).toBeNull();
    expect(aggressive.corpusDepletedAtMonth).not.toBeNull();
  });

  it("Aggressive Payoff's own prepayment genuinely cuts its total interest below a no-prepay baseline on the same loan", () => {
    // Cross-model total-interest comparisons are no longer meaningful
    // identity checks for Aggressive Payoff: both Safety First (~80% of
    // own funds to down payment) and Balanced (~40-50%) now put
    // substantially more down payment than Aggressive's ~20-25% floor, so
    // their smaller loans can legitimately rack up less absolute interest
    // even though Aggressive prepays harder and pays off faster (already
    // covered by the payoff-time test below) — down-payment size, not
    // prepayment speed, dominates 20-year absolute interest across models
    // with such different loan principals. What must still hold is
    // Aggressive Payoff's prepayment doing real work on ITS OWN loan: the
    // same principal, rate, and tenure with zero extra prepay must cost
    // strictly more in interest than what the model actually chose.
    const results = computeStrategies(BASE_INPUT);
    const aggressive = results.find((r) => r.id === "aggressive")!;

    const noPrepayBaseline = generateAmortizationSchedule({
      principal: aggressive.capitalStack.loanAmount,
      annualRatePercent: aggressive.loanRatePercent,
      tenureMonths: aggressive.tenureMonths,
      extraMonthlyPrepayment: 0,
      annualPrepayStepUpPercent: 0,
      annualLumpSumCount: 0,
    });

    expect(aggressive.totalInterestPaid).toBeLessThan(noPrepayBaseline.totalInterestPaid);
  });

  it("Aggressive Payoff pays off faster than Balanced and Safety First (its whole identity)", () => {
    const results = computeStrategies(BASE_INPUT);
    const safety = results.find((r) => r.id === "safety")!;
    const balanced = results.find((r) => r.id === "balanced")!;
    const aggressive = results.find((r) => r.id === "aggressive")!;

    expect(aggressive.payoffMonths).toBeLessThan(balanced.payoffMonths);
    expect(aggressive.payoffMonths).toBeLessThan(safety.payoffMonths);
  });

  it("Tax-Optimized Payoff fixes zero monthly prepay and exactly 1 lump-sum EMI/year", () => {
    const results = computeStrategies(BASE_INPUT);
    const bonus = results.find((r) => r.id === "bonus")!;
    expect(bonus.extraMonthlyPrepayment).toBe(0);
    expect(bonus.annualLumpSumCount).toBe(1);
    expect(bonus.prepayStepUpPercent).toBe(0);
  });

  it("Tax-Optimized Payoff's tax savings exactly match calculateLoanTaxBenefitFromSchedule on the same inputs", () => {
    const results = computeStrategies(BASE_INPUT);
    const bonus = results.find((r) => r.id === "bonus")!;

    // Independently reconstruct the same amortization schedule (not trusting
    // the engine's internal one) and re-derive the tax benefit ourselves.
    const schedule = generateAmortizationSchedule({
      principal: bonus.capitalStack.loanAmount,
      annualRatePercent: bonus.loanRatePercent,
      tenureMonths: bonus.tenureMonths,
      extraMonthlyPrepayment: bonus.extraMonthlyPrepayment,
      annualPrepayStepUpPercent: bonus.prepayStepUpPercent,
      annualLumpSumCount: bonus.annualLumpSumCount,
    }).schedule;
    const taxBenefit = calculateLoanTaxBenefitFromSchedule(schedule, 30);

    // Both sides are within a rupee of each other — bonus.taxSavingsAmount
    // is the rounded-to-whole-rupee figure, taxBenefit.totalTaxSaved is the
    // unrounded one computed independently here.
    expect(Math.abs(bonus.taxSavingsAmount! - taxBenefit.totalTaxSaved)).toBeLessThan(1);
    expect(Math.abs(bonus.netEffectiveInterestCost! - (bonus.totalInterestPaid - taxBenefit.totalTaxSaved))).toBeLessThan(2);
  });

  it("only Tax-Optimized Payoff reports tax fields; the other 3 leave them undefined", () => {
    const results = computeStrategies(BASE_INPUT);
    for (const r of results) {
      if (r.id === "bonus") {
        expect(r.taxSavingsAmount).toBeGreaterThan(0);
        expect(r.netEffectiveInterestCost).toBeLessThan(r.totalInterestPaid);
      } else {
        expect(r.taxSavingsAmount).toBeUndefined();
        expect(r.netEffectiveInterestCost).toBeUndefined();
      }
    }
  });

  it("reports a finite, non-negative EMI runway and net wealth at payoff for all 4 strategies", () => {
    const results = computeStrategies(BASE_INPUT);
    for (const r of results) {
      expect(Number.isFinite(r.emiRunwayMonths)).toBe(true);
      expect(r.emiRunwayMonths).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(r.netWealthAtPayoff)).toBe(true);
      expect(r.netWealthAtPayoff).toBeGreaterThanOrEqual(0);
    }
  });

  it("rounds every monetary figure to a whole rupee — no decimals on any card, or once applied into the Planner", () => {
    const results = computeStrategies(BASE_INPUT);
    for (const r of results) {
      const moneyFields: Array<number | undefined> = [
        r.capitalStack.downPayment,
        r.capitalStack.mfLumpsum,
        r.capitalStack.corpus,
        r.capitalStack.loanAmount,
        r.emi,
        r.extraMonthlyPrepayment,
        r.totalInterestPaid,
        r.mfFutureValue,
        r.netWealthAtPayoff,
        r.taxSavingsAmount,
        r.netEffectiveInterestCost,
      ];
      for (const value of moneyFields) {
        if (value === undefined) continue;
        expect(Number.isInteger(value)).toBe(true);
      }
    }
  });

  it("Safety First puts ~80% of own funds into down payment and a small ~5-7.5% into the MF lumpsum, not zero", () => {
    const results = computeStrategies(BASE_INPUT);
    const safety = results.find((r) => r.id === "safety")!;

    const dpShareOfOwnFunds = safety.capitalStack.downPayment / BASE_INPUT.ownFunds;
    const mfShareOfOwnFunds = safety.capitalStack.mfLumpsum / BASE_INPUT.ownFunds;

    expect(dpShareOfOwnFunds).toBeGreaterThanOrEqual(0.775 - 1e-6);
    expect(dpShareOfOwnFunds).toBeLessThanOrEqual(0.825 + 1e-6);
    expect(mfShareOfOwnFunds).toBeGreaterThan(0);
    expect(mfShareOfOwnFunds).toBeGreaterThanOrEqual(0.05 - 1e-6);
    expect(mfShareOfOwnFunds).toBeLessThanOrEqual(0.075 + 1e-6);
    expect(safety.fundingMode).toBe("bank");
  });

  it("Safety First's bank corpus absorbs whatever's left of own funds after down payment and the small MF lumpsum (~12.5-15%)", () => {
    const results = computeStrategies(BASE_INPUT);
    const safety = results.find((r) => r.id === "safety")!;
    const corpusShareOfOwnFunds = safety.capitalStack.corpus / BASE_INPUT.ownFunds;

    expect(corpusShareOfOwnFunds).toBeGreaterThanOrEqual(0.1 - 1e-6);
    expect(corpusShareOfOwnFunds).toBeLessThan(0.2);
    expect(
      safety.capitalStack.downPayment + safety.capitalStack.mfLumpsum + safety.capitalStack.corpus,
    ).toBeCloseTo(BASE_INPUT.ownFunds, -2);
  });

  it("caps down payment at 100% of property price even when own funds are extremely generous (no nonsensical >100% down payment)", () => {
    const input: StrategyEngineInput = {
      propertyPrice: 14000000,
      ownFunds: 20000000,
      loanRatePercent: 7.5,
      tenureYears: 20,
    };
    const results = computeStrategies(input);
    const safety = results.find((r) => r.id === "safety")!;
    expect(safety.downPaymentPercent).toBeLessThanOrEqual(1 + 1e-9);
    expect(safety.capitalStack.downPayment).toBeLessThanOrEqual(input.propertyPrice + 1e-6);
  });

  it("computes MF future value (and net wealth) at each strategy's own actual payoff month, not the original nominal tenure", () => {
    const results = computeStrategies(BASE_INPUT);
    const balanced = results.find((r) => r.id === "balanced")!;

    // Balanced prepays, so its actual payoff month is well short of the
    // full tenure — verify the engine used THAT shorter horizon as the
    // actual input to the MF future-value calculation, not the tenure.
    expect(balanced.payoffMonths).toBeLessThan(balanced.tenureMonths);

    const expectedAtPayoff = calculateMfFutureValue(balanced.capitalStack.mfLumpsum, balanced.mfReturnPercent, balanced.payoffMonths);
    const wouldBeAtFullTenure = calculateMfFutureValue(balanced.capitalStack.mfLumpsum, balanced.mfReturnPercent, balanced.tenureMonths);

    expect(Math.abs(balanced.mfFutureValue - expectedAtPayoff)).toBeLessThan(5);
    // Closing the loop: confirm the two horizons genuinely produce
    // different numbers here (proving the fix actually changes behavior,
    // not just that the "right" formula happens to coincide with the old one).
    expect(balanced.mfFutureValue).toBeLessThan(wouldBeAtFullTenure);
  });

  it("two strategies with different payoff months report net wealth grown over genuinely different durations", () => {
    const results = computeStrategies(BASE_INPUT);
    const balanced = results.find((r) => r.id === "balanced")!;
    const aggressive = results.find((r) => r.id === "aggressive")!;

    expect(balanced.payoffMonths).not.toBe(aggressive.payoffMonths);

    // Independently recompute each one's MF future value at its OWN payoff
    // month and confirm the engine's reported figure matches that (not the
    // other strategy's payoff month, and not a shared tenure).
    const balancedExpected = calculateMfFutureValue(balanced.capitalStack.mfLumpsum, balanced.mfReturnPercent, balanced.payoffMonths);
    const aggressiveExpected = calculateMfFutureValue(
      aggressive.capitalStack.mfLumpsum,
      aggressive.mfReturnPercent,
      aggressive.payoffMonths,
    );
    // Within a few rupees — the engine rounds mfLumpsum to a whole rupee
    // before this recomputation ever sees it, while the stored
    // mfFutureValue was rounded from the unrounded lumpsum, so a small
    // rounding-order gap here is expected, not a sign of a wrong horizon.
    expect(Math.abs(balanced.mfFutureValue - balancedExpected)).toBeLessThan(5);
    expect(Math.abs(aggressive.mfFutureValue - aggressiveExpected)).toBeLessThan(5);
  });

  it("Safety First uses the bank funding mode and a 0% step-up; the others use SWP", () => {
    const results = computeStrategies(BASE_INPUT);
    const safety = results.find((r) => r.id === "safety")!;
    const others = results.filter((r) => r.id !== "safety");

    expect(safety.fundingMode).toBe("bank");
    expect(safety.prepayStepUpPercent).toBe(0);
    for (const r of others) {
      expect(r.fundingMode).toBe("swp");
    }
  });

  it("uses realistic, distinct annual prepay step-ups per model: 0% / 3% / 5% for Safety / Balanced / Aggressive", () => {
    const results = computeStrategies(BASE_INPUT);
    const safety = results.find((r) => r.id === "safety")!;
    const balanced = results.find((r) => r.id === "balanced")!;
    const aggressive = results.find((r) => r.id === "aggressive")!;

    expect(safety.prepayStepUpPercent).toBe(0);
    expect(balanced.prepayStepUpPercent).toBe(BALANCED_STEP_UP_PERCENT);
    expect(aggressive.prepayStepUpPercent).toBe(AGGRESSIVE_STEP_UP_PERCENT);
    expect(BALANCED_STEP_UP_PERCENT).toBeGreaterThanOrEqual(2.5);
    expect(BALANCED_STEP_UP_PERCENT).toBeLessThanOrEqual(3.75);
    expect(AGGRESSIVE_STEP_UP_PERCENT).toBeLessThanOrEqual(5);
  });

  it("all 4 strategies report an MF-growth interest-offset percentage, clamped at 0", () => {
    const results = computeStrategies(BASE_INPUT);
    for (const r of results) {
      expect(r.interestOffsetPercent).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(r.interestOffsetPercent)).toBe(true);
    }
  });

  it("respects custom mfReturnPercent/incomeTaxRatePercent overrides", () => {
    const results = computeStrategies({ ...BASE_INPUT, mfReturnPercent: 15, incomeTaxRatePercent: 20 });
    for (const r of results) {
      expect(r.mfReturnPercent).toBe(15);
    }
  });
});
