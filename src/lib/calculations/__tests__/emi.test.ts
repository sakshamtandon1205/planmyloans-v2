import { describe, expect, it } from "vitest";
import { calculateBaselineInterest, calculateEmi, calculatePayoffMonths, generateAmortizationSchedule } from "../emi";

describe("calculateEmi", () => {
  it("matches the documented worked example: ₹1,00,00,000 @ 7.5% over 20 years", () => {
    const emi = calculateEmi({ principal: 10000000, annualRatePercent: 7.5, tenureMonths: 240 });
    expect(emi).toBeCloseTo(80559, 0);
  });

  it("falls back to a simple division when the rate is zero", () => {
    const emi = calculateEmi({ principal: 1200000, annualRatePercent: 0, tenureMonths: 120 });
    expect(emi).toBeCloseTo(10000, 5);
  });
});

describe("generateAmortizationSchedule", () => {
  it("amortizes exactly to zero by the end of the tenure with no prepayment", () => {
    const result = generateAmortizationSchedule({
      principal: 10000000,
      annualRatePercent: 8.5,
      tenureMonths: 240,
    });

    expect(result.payoffMonths).toBe(240);
    expect(result.schedule).toHaveLength(240);
    expect(result.schedule[239].balance).toBeCloseTo(0, 4);
    expect(result.totalPrincipalPaid).toBeCloseTo(10000000, 2);
  });

  it("pays off faster with extra monthly prepayment", () => {
    const baseline = generateAmortizationSchedule({
      principal: 10000000,
      annualRatePercent: 8.5,
      tenureMonths: 240,
    });
    const withPrepay = generateAmortizationSchedule({
      principal: 10000000,
      annualRatePercent: 8.5,
      tenureMonths: 240,
      extraMonthlyPrepayment: 20000,
    });

    expect(withPrepay.payoffMonths).toBeLessThan(baseline.payoffMonths);
    expect(withPrepay.totalInterestPaid).toBeLessThan(baseline.totalInterestPaid);
  });

  it("steps up the prepayment and EMI annually", () => {
    const result = generateAmortizationSchedule({
      principal: 10000000,
      annualRatePercent: 8.5,
      tenureMonths: 240,
      extraMonthlyPrepayment: 5000,
      annualPrepayStepUpPercent: 10,
      annualEmiStepUpPercent: 5,
    });

    // Month 13 (second year) should reflect one round of step-up.
    const emiMonth13 = result.schedule[12].emi;
    expect(emiMonth13).toBeCloseTo(result.emi * 1.05, 2);
  });

  it("freezes the balance at zero once paid off instead of going negative", () => {
    const result = generateAmortizationSchedule({
      principal: 100000,
      annualRatePercent: 8.5,
      tenureMonths: 12,
      extraMonthlyPrepayment: 50000,
      simulationMonths: 12,
    });

    const payoffRow = result.schedule[result.payoffMonths - 1];
    expect(payoffRow.balance).toBe(0);

    for (let i = result.payoffMonths; i < result.schedule.length; i++) {
      expect(result.schedule[i].balance).toBe(0);
      expect(result.schedule[i].interestPortion).toBe(0);
      expect(result.schedule[i].principalPortion).toBe(0);
    }
  });

  it("bounds the schedule to simulationMonths when shorter than the tenure", () => {
    const result = generateAmortizationSchedule({
      principal: 10000000,
      annualRatePercent: 8.5,
      tenureMonths: 240,
      simulationMonths: 60,
    });

    expect(result.schedule).toHaveLength(60);
    expect(result.schedule[59].balance).toBeGreaterThan(0);
    // Loan hasn't paid off within the shortened window, so payoffMonths
    // falls back to the simulation boundary itself.
    expect(result.payoffMonths).toBe(60);
  });
});

describe("calculateBaselineInterest", () => {
  it("computes full-tenure interest with no prepayment", () => {
    const emi = calculateEmi({ principal: 10000000, annualRatePercent: 8.5, tenureMonths: 240 });
    const baseline = calculateBaselineInterest(10000000, emi, 240);
    expect(baseline).toBeCloseTo(emi * 240 - 10000000, 5);
  });
});

describe("calculatePayoffMonths", () => {
  it("matches the tenure when there is no prepayment", () => {
    const months = calculatePayoffMonths({ principal: 10000000, annualRatePercent: 8.5, tenureMonths: 240 });
    expect(months).toBe(240);
  });

  it("accelerates payoff with a large extra prepayment", () => {
    const months = calculatePayoffMonths({
      principal: 10000000,
      annualRatePercent: 8.5,
      tenureMonths: 240,
      extraMonthlyPrepayment: 50000,
    });
    expect(months).toBeLessThan(240);
  });
});
