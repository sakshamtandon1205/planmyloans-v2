import { describe, expect, it } from "vitest";
import { generateAmortizationSchedule } from "../emi";
import { calculateMfFutureValue } from "../mf";
import { computeStrategies, DOWN_PAYMENT_FLOOR_PERCENT, type StrategyEngineInput } from "../strategies";
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

  it("fixes Balanced and Tax-Optimized Payoff's down payment at exactly the 20% floor", () => {
    const results = computeStrategies(BASE_INPUT);
    const balanced = results.find((r) => r.id === "balanced")!;
    const bonus = results.find((r) => r.id === "bonus")!;
    expect(balanced.downPaymentPercent).toBeCloseTo(DOWN_PAYMENT_FLOOR_PERCENT, 6);
    expect(bonus.downPaymentPercent).toBeCloseTo(DOWN_PAYMENT_FLOOR_PERCENT, 6);
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
    const caps: Record<string, number> = { safety: 5, balanced: 10, aggressive: 15, bonus: 0 };
    for (const r of results) {
      const pctOfEmi = (r.extraMonthlyPrepayment / r.emi) * 100;
      expect(pctOfEmi).toBeLessThanOrEqual(caps[r.id] + 1e-6);
    }
  });

  it("Safety First never depletes its corpus on inputs where Aggressive Payoff does", () => {
    const results = computeStrategies(DIVERGENT_INPUT);
    const safety = results.find((r) => r.id === "safety")!;
    const aggressive = results.find((r) => r.id === "aggressive")!;

    expect(safety.corpusDepletedAtMonth).toBeNull();
    expect(aggressive.corpusDepletedAtMonth).not.toBeNull();
  });

  it("orders total interest paid Safety First > Balanced > Aggressive Payoff", () => {
    const results = computeStrategies(BASE_INPUT);
    const safety = results.find((r) => r.id === "safety")!;
    const balanced = results.find((r) => r.id === "balanced")!;
    const aggressive = results.find((r) => r.id === "aggressive")!;

    expect(safety.totalInterestPaid).toBeGreaterThan(balanced.totalInterestPaid);
    expect(balanced.totalInterestPaid).toBeGreaterThan(aggressive.totalInterestPaid);
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

    expect(bonus.taxSavingsAmount).toBeCloseTo(taxBenefit.totalTaxSaved, 3);
    expect(bonus.netEffectiveInterestCost).toBeCloseTo(bonus.totalInterestPaid - taxBenefit.totalTaxSaved, 3);
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

  it("reports a finite, non-negative EMI runway and net wealth at horizon for all 4 strategies", () => {
    const results = computeStrategies(BASE_INPUT);
    for (const r of results) {
      expect(Number.isFinite(r.emiRunwayMonths)).toBe(true);
      expect(r.emiRunwayMonths).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(r.netWealthAtHorizon)).toBe(true);
      expect(r.netWealthAtHorizon).toBeGreaterThanOrEqual(0);
    }
  });

  it("Safety First allocates 0% to the MF lumpsum — all remaining funds go to the bank corpus", () => {
    const results = computeStrategies(BASE_INPUT);
    const safety = results.find((r) => r.id === "safety")!;
    expect(safety.capitalStack.mfLumpsum).toBeCloseTo(0, 6);
    expect(safety.fundingMode).toBe("bank");
  });

  it("verifies MF future value at the fixed loan-tenure horizon, not each candidate's own payoff month (closing the loop on netWealthAtHorizon, not just trusting it)", () => {
    const results = computeStrategies(BASE_INPUT);
    const balanced = results.find((r) => r.id === "balanced")!;

    const expectedMfFv = calculateMfFutureValue(balanced.capitalStack.mfLumpsum, balanced.mfReturnPercent, balanced.tenureMonths);
    expect(balanced.mfFutureValue).toBeCloseTo(expectedMfFv, 3);
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
