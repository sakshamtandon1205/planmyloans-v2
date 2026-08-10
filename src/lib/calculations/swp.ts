import { calculateBankInterestTax } from "./tax";
import type { BankCorpusInput, CorpusMonthRow, CorpusSimulationResult, SwpCorpusInput } from "./types";

/**
 * Simulates a mutual-fund corpus funding the EMI via a systematic
 * withdrawal plan. Each month the corpus grows, then (while the loan is
 * still active) a gross withdrawal is pulled that nets out to the target
 * EMI after capital-gains tax on the gains portion of the withdrawal —
 * the cost-basis/gain-fraction gross-up. Once the corpus would go
 * negative, it freezes at zero for the rest of the horizon instead of
 * continuing to accrue growth, tax, or withdrawals.
 */
export function simulateSwpCorpus(input: SwpCorpusInput): CorpusSimulationResult {
  const {
    initialCorpus,
    annualReturnPercent,
    emiSchedule,
    payoffMonths,
    horizonMonths,
    capitalGainsTaxRatePercent,
  } = input;

  const monthlyRate = Math.pow(1 + annualReturnPercent / 100, 1 / 12) - 1;
  const taxRate = capitalGainsTaxRatePercent / 100;

  let balance = initialCorpus;
  let costBasis = initialCorpus;
  let depletedAtMonth: number | null = null;
  let totalTaxPaid = 0;
  let totalWithdrawn = 0;
  const schedule: CorpusMonthRow[] = [];

  for (let month = 1; month <= horizonMonths; month++) {
    let withdrawal = 0;
    let taxPaid = 0;

    if (depletedAtMonth === null) {
      balance = balance * (1 + monthlyRate);

      if (month <= payoffMonths) {
        const targetWithdrawal = emiSchedule[month - 1] ?? 0;
        const gainFraction = balance > 0 ? Math.max(0, (balance - costBasis) / balance) : 0;
        const denominator = 1 - gainFraction * taxRate;
        const grossWithdrawal = denominator > 0 ? targetWithdrawal / denominator : targetWithdrawal;

        taxPaid = grossWithdrawal - targetWithdrawal;
        costBasis = Math.max(0, costBasis - grossWithdrawal * (1 - gainFraction));
        balance -= grossWithdrawal;
        withdrawal = grossWithdrawal;

        if (balance < 0) {
          depletedAtMonth = month;
          balance = 0;
        }
      }
    }

    totalTaxPaid += taxPaid;
    totalWithdrawn += withdrawal;
    schedule.push({ month, balance, withdrawal, taxPaid });
  }

  return { schedule, finalBalance: balance, depletedAtMonth, totalTaxPaid, totalWithdrawn };
}

/**
 * Simulates a bank account funding the EMI. Interest accrues and is taxed
 * in full each month (via tax.ts), then the EMI is withdrawn while the
 * loan is active. Same zero-floor freeze on depletion as the SWP corpus.
 */
export function simulateBankCorpus(input: BankCorpusInput): CorpusSimulationResult {
  const { initialCorpus, annualReturnPercent, emiSchedule, payoffMonths, horizonMonths, incomeTaxRatePercent } =
    input;

  let balance = initialCorpus;
  let depletedAtMonth: number | null = null;
  let totalTaxPaid = 0;
  let totalWithdrawn = 0;
  const schedule: CorpusMonthRow[] = [];

  for (let month = 1; month <= horizonMonths; month++) {
    let withdrawal = 0;
    let taxPaid = 0;

    if (depletedAtMonth === null) {
      const { tax, netInterest } = calculateBankInterestTax(balance, annualReturnPercent, incomeTaxRatePercent);
      balance += netInterest;
      taxPaid = tax;

      if (month <= payoffMonths) {
        withdrawal = emiSchedule[month - 1] ?? 0;
        balance -= withdrawal;

        if (balance < 0) {
          depletedAtMonth = month;
          balance = 0;
        }
      }
    }

    totalTaxPaid += taxPaid;
    totalWithdrawn += withdrawal;
    schedule.push({ month, balance, withdrawal, taxPaid });
  }

  return { schedule, finalBalance: balance, depletedAtMonth, totalTaxPaid, totalWithdrawn };
}
