export interface EmiInput {
  principal: number;
  annualRatePercent: number;
  tenureMonths: number;
}

export interface AmortizationInput extends EmiInput {
  /** Extra amount paid on top of the EMI, straight onto principal, every month. */
  extraMonthlyPrepayment?: number;
  /** % the extra prepayment rises by on each loan anniversary. */
  annualPrepayStepUpPercent?: number;
  /** % the EMI itself rises by on each loan anniversary. */
  annualEmiStepUpPercent?: number;
  /**
   * Number of months to simulate. Defaults to tenureMonths (full natural
   * amortization window). Pass a horizon shorter than tenureMonths to bound
   * the schedule to a viewing window; pass tenureMonths when you need the
   * true payoff month.
   */
  simulationMonths?: number;
}

export interface AmortizationRow {
  month: number;
  /** EMI in effect this month (reflects any step-up already applied). */
  emi: number;
  interestPortion: number;
  principalPortion: number;
  /** Outstanding balance after this month's payment. Frozen at 0 once paid off. */
  balance: number;
}

export interface AmortizationResult {
  /** The original/starting EMI computed from the loan formula. */
  emi: number;
  schedule: AmortizationRow[];
  /** Month the loan balance first reaches zero, or simulationMonths if it hasn't by then. */
  payoffMonths: number;
  totalInterestPaid: number;
  totalPrincipalPaid: number;
  /** EMI amount in effect during the last month a payment was actually made. */
  lastEmiUsed: number;
  /** Total interest over the full tenure with no prepayment, for savings comparisons. */
  baselineInterest: number;
}

export type FundingMode = "swp" | "bank";

export interface CorpusSimulationInput {
  initialCorpus: number;
  annualReturnPercent: number;
  /** EMI withdrawal target per month, index 0 = month 1. Length should cover horizonMonths. */
  emiSchedule: number[];
  /** Withdrawals are only drawn while month <= payoffMonths. */
  payoffMonths: number;
  horizonMonths: number;
  incomeTaxRatePercent: number;
}

export interface SwpCorpusInput extends CorpusSimulationInput {
  capitalGainsTaxRatePercent: number;
}

export type BankCorpusInput = CorpusSimulationInput;

export interface CorpusMonthRow {
  month: number;
  /** Balance after this month's growth, tax, and withdrawal. Frozen at 0 once depleted. */
  balance: number;
  /** Gross amount drawn from the corpus this month (0 once depleted or after payoff). */
  withdrawal: number;
  /** Tax paid this month (capital gains gross-up in SWP mode, interest tax in bank mode). */
  taxPaid: number;
}

export interface CorpusSimulationResult {
  schedule: CorpusMonthRow[];
  finalBalance: number;
  depletedAtMonth: number | null;
  totalTaxPaid: number;
  totalWithdrawn: number;
}

export interface BankInterestTaxResult {
  grossInterest: number;
  tax: number;
  netInterest: number;
}

export interface LoanTaxBenefitYear {
  /** Month at which this year's deduction was flushed (year-end, or the payoff month). */
  throughMonth: number;
  interestPaid: number;
  principalPaid: number;
  taxSaved: number;
}

export interface LoanTaxBenefitResult {
  totalTaxSaved: number;
  yearlyBreakdown: LoanTaxBenefitYear[];
}
