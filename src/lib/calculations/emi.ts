import type { AmortizationInput, AmortizationResult, AmortizationRow, EmiInput } from "./types";

export function calculateEmi({ principal, annualRatePercent, tenureMonths }: EmiInput): number {
  const monthlyRate = annualRatePercent / 12 / 100;

  if (monthlyRate === 0) {
    return principal / tenureMonths;
  }

  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
}

/**
 * Full-tenure interest if the EMI were paid with no prepayment at all —
 * the baseline used to measure interest saved by prepaying.
 */
export function calculateBaselineInterest(principal: number, emi: number, tenureMonths: number): number {
  return emi * tenureMonths - principal;
}

/**
 * Simulates the loan month by month, applying extra prepayment and annual
 * step-ups to both the prepayment and the EMI itself. Once the balance hits
 * zero it freezes there for the rest of the simulation window instead of
 * continuing to amortize (or going negative).
 */
export function generateAmortizationSchedule(input: AmortizationInput): AmortizationResult {
  const {
    principal,
    annualRatePercent,
    tenureMonths,
    extraMonthlyPrepayment = 0,
    annualPrepayStepUpPercent = 0,
    annualEmiStepUpPercent = 0,
    annualLumpSumCount = 0,
    simulationMonths = tenureMonths,
  } = input;

  const monthlyRate = annualRatePercent / 12 / 100;
  const emi = calculateEmi({ principal, annualRatePercent, tenureMonths });
  const prepayStepUpRate = annualPrepayStepUpPercent / 100;
  const emiStepUpRate = annualEmiStepUpPercent / 100;

  let balance = principal;
  let currentExtra = extraMonthlyPrepayment;
  let currentEmi = emi;
  let lastEmiUsed = emi;
  let payoffMonths: number | null = null;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;

  const schedule: AmortizationRow[] = [];

  for (let month = 1; month <= simulationMonths; month++) {
    let interestPortion = 0;
    let principalPortion = 0;

    if (balance > 0) {
      interestPortion = balance * monthlyRate;
      principalPortion = currentEmi - interestPortion + currentExtra;
      if (principalPortion > balance) principalPortion = balance;

      balance -= principalPortion;
      totalInterestPaid += interestPortion;
      totalPrincipalPaid += principalPortion;
      lastEmiUsed = currentEmi;

      // Distinct from extraMonthlyPrepayment: N full EMIs knocked off the
      // principal once a year, not spread across the year's payments.
      if (annualLumpSumCount > 0 && balance > 0 && month % 12 === 0) {
        for (let i = 0; i < annualLumpSumCount && balance > 0; i++) {
          const lumpSum = Math.min(currentEmi, balance);
          balance -= lumpSum;
          principalPortion += lumpSum;
          totalPrincipalPaid += lumpSum;
        }
      }

      if (balance <= 0 && payoffMonths === null) payoffMonths = month;
    }

    if (month % 12 === 0) {
      if (prepayStepUpRate > 0) currentExtra *= 1 + prepayStepUpRate;
      if (emiStepUpRate > 0) currentEmi *= 1 + emiStepUpRate;
    }

    schedule.push({
      month,
      emi: currentEmi,
      interestPortion,
      principalPortion,
      balance: Math.max(balance, 0),
    });
  }

  return {
    emi,
    schedule,
    payoffMonths: payoffMonths ?? simulationMonths,
    totalInterestPaid,
    totalPrincipalPaid,
    lastEmiUsed,
    baselineInterest: calculateBaselineInterest(principal, emi, tenureMonths),
  };
}

/**
 * Fast payoff estimate: runs the amortization for the full tenure and
 * returns the month the balance reaches zero (or tenureMonths, since a
 * non-negative prepayment can only accelerate payoff, never delay it).
 */
export function calculatePayoffMonths(input: AmortizationInput): number {
  const { tenureMonths } = input;
  const result = generateAmortizationSchedule({ ...input, simulationMonths: tenureMonths });
  return result.payoffMonths;
}
