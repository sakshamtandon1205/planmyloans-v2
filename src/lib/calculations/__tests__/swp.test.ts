import { describe, expect, it } from "vitest";
import { simulateBankCorpus, simulateSwpCorpus } from "../swp";

describe("simulateSwpCorpus", () => {
  it("withdraws exactly the target EMI with zero tax when there are no gains yet", () => {
    // 0% return keeps balance === cost basis, so gainFraction stays 0 and
    // the gross-up should collapse to a plain withdrawal with no tax.
    const emiSchedule = Array(6).fill(10000);
    const result = simulateSwpCorpus({
      initialCorpus: 1000000,
      annualReturnPercent: 0,
      emiSchedule,
      payoffMonths: 6,
      horizonMonths: 6,
      incomeTaxRatePercent: 30,
      capitalGainsTaxRatePercent: 12.5,
    });

    expect(result.totalTaxPaid).toBeCloseTo(0, 6);
    expect(result.finalBalance).toBeCloseTo(1000000 - 6 * 10000, 6);
    expect(result.depletedAtMonth).toBeNull();
  });

  it("grosses up the withdrawal so the net proceeds match the target EMI, taxing only the gain fraction", () => {
    const annualReturnPercent = 12;
    const monthlyRate = Math.pow(1 + annualReturnPercent / 100, 1 / 12) - 1;
    const targetWithdrawal = 20000;
    const capitalGainsTaxRatePercent = 12.5;

    const result = simulateSwpCorpus({
      initialCorpus: 2000000,
      annualReturnPercent,
      emiSchedule: [targetWithdrawal],
      payoffMonths: 1,
      horizonMonths: 1,
      incomeTaxRatePercent: 30,
      capitalGainsTaxRatePercent,
    });

    const grownBalance = 2000000 * (1 + monthlyRate);
    const gainFraction = Math.max(0, (grownBalance - 2000000) / grownBalance);
    const denom = 1 - gainFraction * (capitalGainsTaxRatePercent / 100);
    const expectedGrossWithdrawal = targetWithdrawal / denom;
    const expectedTax = expectedGrossWithdrawal - targetWithdrawal;

    expect(result.schedule[0].withdrawal).toBeCloseTo(expectedGrossWithdrawal, 6);
    expect(result.schedule[0].taxPaid).toBeCloseTo(expectedTax, 6);
    expect(result.totalTaxPaid).toBeCloseTo(expectedTax, 6);
  });

  it("freezes at zero once depleted instead of going negative, and stops future withdrawals/tax", () => {
    const emiSchedule = Array(24).fill(50000);
    const result = simulateSwpCorpus({
      initialCorpus: 200000,
      annualReturnPercent: 7.5,
      emiSchedule,
      payoffMonths: 24,
      horizonMonths: 24,
      incomeTaxRatePercent: 30,
      capitalGainsTaxRatePercent: 12.5,
    });

    expect(result.depletedAtMonth).not.toBeNull();
    expect(result.finalBalance).toBe(0);

    const depletedAt = result.depletedAtMonth as number;
    for (let i = depletedAt; i < result.schedule.length; i++) {
      expect(result.schedule[i].balance).toBe(0);
      expect(result.schedule[i].withdrawal).toBe(0);
      expect(result.schedule[i].taxPaid).toBe(0);
    }
  });

  it("stops withdrawing once the loan is paid off but keeps growing the balance", () => {
    const result = simulateSwpCorpus({
      initialCorpus: 500000,
      annualReturnPercent: 10,
      emiSchedule: Array(24).fill(10000),
      payoffMonths: 12,
      horizonMonths: 24,
      incomeTaxRatePercent: 30,
      capitalGainsTaxRatePercent: 12.5,
    });

    // No withdrawals after month 12.
    for (let i = 12; i < 24; i++) {
      expect(result.schedule[i].withdrawal).toBe(0);
    }
    // But the balance should still be growing between months 12 and 24.
    expect(result.schedule[23].balance).toBeGreaterThan(result.schedule[11].balance);
  });
});

describe("simulateBankCorpus", () => {
  it("taxes the full interest accrual each month, unlike the SWP gain-fraction gross-up", () => {
    const result = simulateBankCorpus({
      initialCorpus: 1000000,
      annualReturnPercent: 6.5,
      emiSchedule: [30000],
      payoffMonths: 1,
      horizonMonths: 1,
      incomeTaxRatePercent: 30,
    });

    const monthlyRate = Math.pow(1 + 6.5 / 100, 1 / 12) - 1;
    const grossInterest = 1000000 * monthlyRate;
    const expectedTax = grossInterest * 0.3;
    const expectedBalance = 1000000 + grossInterest - expectedTax - 30000;

    expect(result.schedule[0].taxPaid).toBeCloseTo(expectedTax, 6);
    expect(result.schedule[0].balance).toBeCloseTo(expectedBalance, 6);
  });

  it("freezes at zero once depleted instead of going negative, and stops future interest/tax/withdrawals", () => {
    const result = simulateBankCorpus({
      initialCorpus: 150000,
      annualReturnPercent: 6.5,
      emiSchedule: Array(12).fill(30000),
      payoffMonths: 12,
      horizonMonths: 12,
      incomeTaxRatePercent: 30,
    });

    expect(result.depletedAtMonth).not.toBeNull();
    expect(result.finalBalance).toBe(0);

    const depletedAt = result.depletedAtMonth as number;
    for (let i = depletedAt; i < result.schedule.length; i++) {
      expect(result.schedule[i].balance).toBe(0);
      expect(result.schedule[i].withdrawal).toBe(0);
      expect(result.schedule[i].taxPaid).toBe(0);
    }
  });
});
