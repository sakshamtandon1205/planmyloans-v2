import type { AmortizationRow, BankInterestTaxResult, LoanTaxBenefitResult, LoanTaxBenefitYear } from "./types";

/** Sec 24(b) annual cap on home-loan interest deduction. */
export const SEC_24B_ANNUAL_CAP = 200000;
/** Sec 80C annual cap on home-loan principal deduction. */
export const SEC_80C_ANNUAL_CAP = 150000;

/**
 * Bank-mode monthly interest taxation: interest accrues on the corpus at
 * the compounding-equivalent monthly rate and is taxed in full as it accrues
 * (unlike SWP capital gains, which are only taxed on the gains portion).
 */
export function calculateBankInterestTax(
  balance: number,
  annualReturnPercent: number,
  incomeTaxRatePercent: number,
): BankInterestTaxResult {
  const monthlyRate = Math.pow(1 + annualReturnPercent / 100, 1 / 12) - 1;
  const grossInterest = balance * monthlyRate;
  const tax = grossInterest * (incomeTaxRatePercent / 100);
  const netInterest = grossInterest - tax;
  return { grossInterest, tax, netInterest };
}

/** Tax saved for a single year, applying the Sec 24(b) and 80C caps independently. */
export function calculateLoanTaxBenefitForYear(
  yearInterestPaid: number,
  yearPrincipalPaid: number,
  incomeTaxRatePercent: number,
): number {
  const deductible =
    Math.min(yearInterestPaid, SEC_24B_ANNUAL_CAP) + Math.min(yearPrincipalPaid, SEC_80C_ANNUAL_CAP);
  return deductible * (incomeTaxRatePercent / 100);
}

/**
 * Walks an amortization schedule and flushes the annual tax-benefit
 * calculation every 12 months, or immediately in the month the loan is
 * paid off (so a partial final year's interest/principal isn't dropped or
 * carried into a year that never happens).
 */
export function calculateLoanTaxBenefitFromSchedule(
  schedule: AmortizationRow[],
  incomeTaxRatePercent: number,
): LoanTaxBenefitResult {
  let yearInterest = 0;
  let yearPrincipal = 0;
  let totalTaxSaved = 0;
  const yearlyBreakdown: LoanTaxBenefitYear[] = [];

  for (const row of schedule) {
    yearInterest += row.interestPortion;
    yearPrincipal += row.principalPortion;

    const isYearEnd = row.month % 12 === 0;
    const isPayoffFlush = row.balance <= 0 && yearInterest + yearPrincipal > 0;

    if (isYearEnd || isPayoffFlush) {
      const taxSaved = calculateLoanTaxBenefitForYear(yearInterest, yearPrincipal, incomeTaxRatePercent);
      totalTaxSaved += taxSaved;
      yearlyBreakdown.push({
        throughMonth: row.month,
        interestPaid: yearInterest,
        principalPaid: yearPrincipal,
        taxSaved,
      });
      yearInterest = 0;
      yearPrincipal = 0;
    }
  }

  return { totalTaxSaved, yearlyBreakdown };
}
