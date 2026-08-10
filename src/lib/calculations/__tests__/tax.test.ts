import { describe, expect, it } from "vitest";
import { generateAmortizationSchedule } from "../emi";
import {
  SEC_24B_ANNUAL_CAP,
  SEC_80C_ANNUAL_CAP,
  calculateBankInterestTax,
  calculateLoanTaxBenefitForYear,
  calculateLoanTaxBenefitFromSchedule,
} from "../tax";

describe("calculateBankInterestTax", () => {
  it("taxes the full monthly interest accrual", () => {
    const balance = 1000000;
    const annualReturnPercent = 6.5;
    const incomeTaxRatePercent = 30;

    const monthlyRate = Math.pow(1 + annualReturnPercent / 100, 1 / 12) - 1;
    const expectedGross = balance * monthlyRate;

    const result = calculateBankInterestTax(balance, annualReturnPercent, incomeTaxRatePercent);

    expect(result.grossInterest).toBeCloseTo(expectedGross, 6);
    expect(result.tax).toBeCloseTo(expectedGross * 0.3, 6);
    expect(result.netInterest).toBeCloseTo(expectedGross * 0.7, 6);
  });

  it("returns zero interest and tax on a zero balance", () => {
    const result = calculateBankInterestTax(0, 6.5, 30);
    expect(result.grossInterest).toBe(0);
    expect(result.tax).toBe(0);
    expect(result.netInterest).toBe(0);
  });
});

describe("calculateLoanTaxBenefitForYear", () => {
  it("applies the Sec 24(b) and 80C caps independently", () => {
    const taxSaved = calculateLoanTaxBenefitForYear(300000, 200000, 30);
    const expectedDeductible = SEC_24B_ANNUAL_CAP + SEC_80C_ANNUAL_CAP;
    expect(taxSaved).toBeCloseTo(expectedDeductible * 0.3, 6);
  });

  it("uses the actual amounts when below the caps", () => {
    const taxSaved = calculateLoanTaxBenefitForYear(100000, 50000, 30);
    expect(taxSaved).toBeCloseTo((100000 + 50000) * 0.3, 6);
  });
});

describe("calculateLoanTaxBenefitFromSchedule", () => {
  it("flushes annually and matches the sum of per-year caps", () => {
    const { schedule } = generateAmortizationSchedule({
      principal: 10000000,
      annualRatePercent: 8.5,
      tenureMonths: 240,
    });

    const { totalTaxSaved, yearlyBreakdown } = calculateLoanTaxBenefitFromSchedule(schedule, 30);

    expect(yearlyBreakdown).toHaveLength(20);
    expect(yearlyBreakdown.every((y) => y.throughMonth % 12 === 0)).toBe(true);

    const recomputed = yearlyBreakdown.reduce((sum, y) => sum + y.taxSaved, 0);
    expect(totalTaxSaved).toBeCloseTo(recomputed, 6);
  });

  it("flushes a partial final year immediately at payoff instead of dropping it", () => {
    const { schedule } = generateAmortizationSchedule({
      principal: 100000,
      annualRatePercent: 8.5,
      tenureMonths: 12,
      extraMonthlyPrepayment: 50000,
      simulationMonths: 12,
    });

    const { yearlyBreakdown } = calculateLoanTaxBenefitFromSchedule(schedule, 30);

    // Loan pays off well before month 12, so the flush should happen at the
    // payoff month, not get silently dropped or double-flushed at month 12.
    expect(yearlyBreakdown.length).toBeGreaterThan(0);
    const totalInterest = yearlyBreakdown.reduce((sum, y) => sum + y.interestPaid, 0);
    const totalPrincipal = yearlyBreakdown.reduce((sum, y) => sum + y.principalPaid, 0);
    expect(totalPrincipal).toBeCloseTo(100000, 2);
    expect(totalInterest).toBeGreaterThan(0);
  });
});
