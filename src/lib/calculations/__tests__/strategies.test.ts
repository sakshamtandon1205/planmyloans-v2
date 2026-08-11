import { describe, expect, it } from "vitest";
import { calculateMfFutureValue } from "../mf";
import { computeStrategies, type StrategyEngineInput } from "../strategies";

const BASE_INPUT: StrategyEngineInput = {
  propertyPrice: 14000000,
  ownFunds: 10000000,
  loanRatePercent: 7.5,
  tenureYears: 20,
};

describe("computeStrategies", () => {
  it("returns exactly 4 strategies with the expected ids, in a stable order", () => {
    const results = computeStrategies(BASE_INPUT);
    expect(results.map((r) => r.id)).toEqual(["safety", "balanced", "aggressive", "offset"]);
  });

  it("fixes down payment to exactly 20% of property price, identical across all 4 strategies", () => {
    const results = computeStrategies(BASE_INPUT);
    for (const r of results) {
      expect(r.capitalStack.downPayment).toBeCloseTo(0.2 * BASE_INPUT.propertyPrice, 6);
    }
    const [safety, balanced, aggressive, offset] = results;
    expect(safety.capitalStack.downPayment).toBe(balanced.capitalStack.downPayment);
    expect(balanced.capitalStack.downPayment).toBe(aggressive.capitalStack.downPayment);
    expect(aggressive.capitalStack.downPayment).toBe(offset.capitalStack.downPayment);
  });

  it("caps extra monthly prepay as a percentage of each strategy's own EMI, at realistic salaried-person levels", () => {
    const results = computeStrategies(BASE_INPUT);
    for (const r of results) {
      const pctOfEmi = (r.extraMonthlyPrepayment / r.emi) * 100;
      expect(pctOfEmi).toBeLessThanOrEqual(15 + 1e-6);
    }
  });

  it("keeps each capital stack within own funds and derives loan amount from price - down payment", () => {
    const results = computeStrategies(BASE_INPUT);
    for (const r of results) {
      const { downPayment, mfLumpsum, corpus, loanAmount } = r.capitalStack;
      expect(downPayment + mfLumpsum + corpus + r.bufferAmount).toBeLessThanOrEqual(BASE_INPUT.ownFunds + 1e-6);
      expect(loanAmount).toBeCloseTo(BASE_INPUT.propertyPrice - downPayment, 6);
      expect(downPayment).toBeGreaterThanOrEqual(0);
      expect(mfLumpsum).toBeGreaterThanOrEqual(0);
      expect(corpus).toBeGreaterThanOrEqual(0);
    }
  });

  it("Safety First never depletes its corpus on inputs where Aggressive Payoff does", () => {
    // A shorter, well-funded loan: Safety First's large corpus tilt and
    // near-zero prepay comfortably outlasts a 10yr payoff window, while
    // Aggressive Payoff's deliberately thin corpus — sized for speed, not
    // reserves — still runs dry even over its own much shorter window.
    const input: StrategyEngineInput = {
      propertyPrice: 14000000,
      ownFunds: 17000000,
      loanRatePercent: 7.5,
      tenureYears: 10,
    };
    const results = computeStrategies(input);
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

  it("Interest Offset reuses Balanced's exact capital stack, extra prepay, and step-up", () => {
    const results = computeStrategies(BASE_INPUT);
    const balanced = results.find((r) => r.id === "balanced")!;
    const offset = results.find((r) => r.id === "offset")!;

    expect(offset.capitalStack).toEqual(balanced.capitalStack);
    expect(offset.extraMonthlyPrepayment).toBe(balanced.extraMonthlyPrepayment);
    expect(offset.prepayStepUpPercent).toBe(balanced.prepayStepUpPercent);
    expect(offset.payoffMonths).toBe(balanced.payoffMonths);
    expect(offset.totalInterestPaid).toBe(balanced.totalInterestPaid);
  });

  it("Interest Offset's solved required return, plugged back into the MF future-value formula, actually closes the interest gap", () => {
    const results = computeStrategies(BASE_INPUT);
    const offset = results.find((r) => r.id === "offset")!;

    expect(offset.requiredMfReturnPercent).toBeDefined();
    const r = offset.requiredMfReturnPercent!;
    expect(Number.isFinite(r)).toBe(true);

    // Verify the solver's answer independently — don't just trust convergence.
    const fvGain = calculateMfFutureValue(offset.capitalStack.mfLumpsum, r, offset.payoffMonths) - offset.capitalStack.mfLumpsum;
    expect(fvGain).toBeGreaterThanOrEqual(offset.totalInterestPaid - 1);

    // One point lower should no longer fully close the gap (proves the
    // solver found close to the minimum sufficient rate, not an overshoot).
    const fvGainOnePointLower =
      calculateMfFutureValue(offset.capitalStack.mfLumpsum, r - 1, offset.payoffMonths) - offset.capitalStack.mfLumpsum;
    expect(fvGainOnePointLower).toBeLessThan(offset.totalInterestPaid);
  });

  it("Interest Offset's sensitivity note reflects a real, lower offset % at 3 points below the required return", () => {
    const results = computeStrategies(BASE_INPUT);
    const offset = results.find((r) => r.id === "offset")!;

    expect(offset.offsetPercentAt3PtsLower).toBeDefined();
    expect(offset.offsetPercentAt3PtsLower!).toBeLessThan(100);
    expect(offset.offsetPercentAt3PtsLower!).toBeGreaterThanOrEqual(0);
  });

  it("all 4 strategies report an MF-growth interest-offset percentage, clamped at 0", () => {
    const results = computeStrategies(BASE_INPUT);
    for (const r of results) {
      expect(r.interestOffsetPercent).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(r.interestOffsetPercent)).toBe(true);
    }
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

  it("respects custom mfReturnPercent/incomeTaxRatePercent overrides", () => {
    const results = computeStrategies({ ...BASE_INPUT, mfReturnPercent: 15, incomeTaxRatePercent: 20 });
    for (const r of results) {
      expect(r.mfReturnPercent).toBe(15);
    }
  });
});
