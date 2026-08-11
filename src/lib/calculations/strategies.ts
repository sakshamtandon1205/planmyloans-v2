import { calculateEmi, generateAmortizationSchedule } from "./emi";
import { calculateMfFutureValue } from "./mf";
import { simulateBankCorpus, simulateSwpCorpus } from "./swp";
import type { FundingMode } from "./types";

export type StrategyId = "safety" | "balanced" | "aggressive" | "offset";

export interface StrategyEngineInput {
  propertyPrice: number;
  ownFunds: number;
  loanRatePercent: number;
  tenureYears: number;
  /** Default 12 — matches the Planner's own default MF return assumption. */
  mfReturnPercent?: number;
  /** Default 30 — matches the Planner's own default marginal tax rate. */
  incomeTaxRatePercent?: number;
}

export interface StrategyCapitalStack {
  downPayment: number;
  mfLumpsum: number;
  corpus: number;
  loanAmount: number;
}

export interface StrategyResult {
  id: StrategyId;
  name: string;
  subtitle: string;
  fundingMode: FundingMode;
  capitalStack: StrategyCapitalStack;
  bufferAmount: number;
  /** Months-of-EMI buffer target, or null for Aggressive's flat-floor buffer. */
  bufferMonths: number | null;
  loanRatePercent: number;
  tenureMonths: number;
  extraMonthlyPrepayment: number;
  prepayStepUpPercent: number;
  mfReturnPercent: number;
  corpusReturnPercent: number;
  emi: number;
  payoffMonths: number;
  totalInterestPaid: number;
  mfFutureValue: number;
  corpusDepletedAtMonth: number | null;
  /** (FV(MF) - MF lumpsum) / total interest, clamped at 0 with no upper clamp. */
  interestOffsetPercent: number;
  /** Interest Offset only: the MF return needed to fully cover total interest. */
  requiredMfReturnPercent?: number;
  /** Interest Offset only: offset % achieved if the actual return is 3 points lower than required. */
  offsetPercentAt3PtsLower?: number;
}

// Matches the Planner's own defaults in calculatorTypes.ts (DEFAULT_INPUTS) — the
// strategy engine deliberately reuses these rather than inventing new assumptions.
const DEFAULT_MF_RETURN_PERCENT = 12;
const DEFAULT_INCOME_TAX_RATE_PERCENT = 30;
const DEFAULT_SWP_RETURN_PERCENT = 7.5;
const DEFAULT_BANK_RETURN_PERCENT = 6.5;
const DEFAULT_SWP_CAPITAL_GAINS_TAX_PERCENT = 12.5;

/** Down payment is now a flat, non-negotiable slice of the property price — identical across all 4 strategies. */
const DOWN_PAYMENT_PERCENT_OF_PRICE = 0.2;

export function computeStrategies(input: StrategyEngineInput): StrategyResult[] {
  const {
    propertyPrice,
    ownFunds,
    loanRatePercent,
    tenureYears,
    mfReturnPercent = DEFAULT_MF_RETURN_PERCENT,
    incomeTaxRatePercent = DEFAULT_INCOME_TAX_RATE_PERCENT,
  } = input;
  const tenureMonths = tenureYears * 12;

  const safety = runSafetyFirst(propertyPrice, ownFunds, loanRatePercent, tenureMonths, mfReturnPercent, incomeTaxRatePercent);
  const balanced = runBalanced(propertyPrice, ownFunds, loanRatePercent, tenureMonths, mfReturnPercent, incomeTaxRatePercent);
  const aggressive = runAggressive(propertyPrice, ownFunds, loanRatePercent, tenureMonths, mfReturnPercent, incomeTaxRatePercent);
  const offset = runInterestOffset(balanced, mfReturnPercent);

  return [safety, balanced, aggressive, offset];
}

// ---------------------------------------------------------------------------
// Capital-stack sizing
// ---------------------------------------------------------------------------

type BufferSpec = { type: "months"; months: number } | { type: "flat"; amount: number };

interface AllocationParams {
  /** Share of the post-down-payment, post-buffer pool that goes to the MF lumpsum; the rest goes to the corpus. */
  mfPercent: number;
  buffer: BufferSpec;
}

/**
 * Down payment is now a fixed 20% of property price for every strategy (no
 * longer searched or varied), so loan amount — and therefore the baseline
 * EMI before any prepayment — is identical across all 4 strategies too.
 * Strategies now only differ in how the *remaining* own funds split across
 * a safety buffer, an MF lumpsum, and the EMI-funding corpus, plus how
 * aggressively they prepay.
 */
function resolveCapitalStack(
  propertyPrice: number,
  ownFunds: number,
  loanRatePercent: number,
  tenureMonths: number,
  allocation: AllocationParams,
): { capitalStack: StrategyCapitalStack; bufferAmount: number; bufferMonths: number | null; emi: number } {
  const { mfPercent, buffer } = allocation;

  // Defensive clamp only — with the app's realistic input ranges, own funds
  // comfortably exceeds 20% of price, but this keeps the split sane if not.
  const downPayment = Math.min(DOWN_PAYMENT_PERCENT_OF_PRICE * propertyPrice, ownFunds);
  const loanAmount = Math.max(0, propertyPrice - downPayment);
  const emi = calculateEmi({ principal: loanAmount, annualRatePercent: loanRatePercent, tenureMonths });

  const remaining = Math.max(0, ownFunds - downPayment);
  const bufferMonths = buffer.type === "months" ? buffer.months : null;
  const bufferAmount = Math.min(buffer.type === "months" ? buffer.months * emi : buffer.amount, remaining);

  const investable = Math.max(0, remaining - bufferAmount);
  const mfLumpsum = mfPercent * investable;
  const corpus = Math.max(0, investable - mfLumpsum);

  return { capitalStack: { downPayment, mfLumpsum, corpus, loanAmount }, bufferAmount, bufferMonths, emi };
}

// ---------------------------------------------------------------------------
// Search over extra monthly prepay (step-up is now a fixed constant per
// strategy, not searched), via the existing tested engine
// ---------------------------------------------------------------------------

interface SearchOutcome {
  extraMonthlyPrepayment: number;
  emi: number;
  payoffMonths: number;
  totalInterestPaid: number;
  corpusDepletedAtMonth: number | null;
}

/**
 * Extra monthly prepay is expressed and capped as a percentage of the
 * strategy's own EMI (not an unbounded rupee search) — keeps the resulting
 * rupee figures in the range a real salaried person could plausibly commit
 * to, rather than an outlier like ₹30,000/mo on a ₹70,000 EMI.
 */
function extraPrepayGrid(emi: number, capPercentOfEmi: number, points: number): number[] {
  const step = capPercentOfEmi / points;
  const values: number[] = [];
  for (let pct = 0; pct <= capPercentOfEmi + 1e-9; pct += step) {
    values.push((pct / 100) * emi);
  }
  return values;
}

function evaluateCandidate(
  loanAmount: number,
  loanRatePercent: number,
  tenureMonths: number,
  extraMonthlyPrepayment: number,
  prepayStepUpPercent: number,
  fundingMode: FundingMode,
  corpus: number,
  corpusReturnPercent: number,
  incomeTaxRatePercent: number,
  capitalGainsTaxRatePercent: number,
): SearchOutcome {
  const amortization = generateAmortizationSchedule({
    principal: loanAmount,
    annualRatePercent: loanRatePercent,
    tenureMonths,
    extraMonthlyPrepayment,
    annualPrepayStepUpPercent: prepayStepUpPercent,
  });

  const emiSchedule = amortization.schedule.map((row) => row.emi);
  // Corpus is only checked for depletion through payoff — what happens after
  // the loan is repaid doesn't bear on "did it fund every EMI."
  const corpusSim =
    fundingMode === "swp"
      ? simulateSwpCorpus({
          initialCorpus: corpus,
          annualReturnPercent: corpusReturnPercent,
          emiSchedule,
          payoffMonths: amortization.payoffMonths,
          horizonMonths: amortization.payoffMonths,
          incomeTaxRatePercent,
          capitalGainsTaxRatePercent,
        })
      : simulateBankCorpus({
          initialCorpus: corpus,
          annualReturnPercent: corpusReturnPercent,
          emiSchedule,
          payoffMonths: amortization.payoffMonths,
          horizonMonths: amortization.payoffMonths,
          incomeTaxRatePercent,
        });

  return {
    extraMonthlyPrepayment,
    emi: amortization.emi,
    payoffMonths: amortization.payoffMonths,
    totalInterestPaid: amortization.totalInterestPaid,
    corpusDepletedAtMonth: corpusSim.depletedAtMonth,
  };
}

/**
 * Picks the best outcome (by `compareBest`, ascending — lower "wins") among
 * candidates that never deplete the corpus. If none survive that filter
 * (the allocation itself is too tight for these inputs), falls back to
 * whichever candidate depletes latest — an honest "safest available" choice
 * rather than silently violating the constraint.
 */
function pickBestOrSafest(outcomes: SearchOutcome[], compareBest: (a: SearchOutcome, b: SearchOutcome) => number): SearchOutcome {
  const feasible = outcomes.filter((o) => o.corpusDepletedAtMonth === null);
  if (feasible.length > 0) {
    return feasible.reduce((best, o) => (compareBest(o, best) < 0 ? o : best));
  }
  // No candidate fully avoids depletion: prefer whichever survives longest,
  // breaking ties by the strategy's own objective instead of search order —
  // several candidates commonly hit the exact same depletion month, since
  // extra prepay shortens payoff without changing the EMI drawn from the
  // corpus each month before that.
  return outcomes.reduce((best, o) => {
    const oMonth = o.corpusDepletedAtMonth ?? Infinity;
    const bestMonth = best.corpusDepletedAtMonth ?? Infinity;
    if (oMonth !== bestMonth) return oMonth > bestMonth ? o : best;
    return compareBest(o, best) < 0 ? o : best;
  });
}

function computeOffsetPercent(mfLumpsum: number, mfReturnPercent: number, months: number, totalInterestPaid: number): number {
  if (totalInterestPaid <= 0) return 0;
  const fv = calculateMfFutureValue(mfLumpsum, mfReturnPercent, months);
  return Math.max(0, ((fv - mfLumpsum) / totalInterestPaid) * 100);
}

// ---------------------------------------------------------------------------
// Individual strategies
// ---------------------------------------------------------------------------

function runSafetyFirst(
  propertyPrice: number,
  ownFunds: number,
  loanRatePercent: number,
  tenureMonths: number,
  mfReturnPercent: number,
  incomeTaxRatePercent: number,
): StrategyResult {
  // Safety First avoids market exposure altogether on the invested portion,
  // not just the EMI-funding corpus: the remaining own funds go entirely to
  // the bank-account corpus, none to an MF lumpsum. A near-0% "MF growth
  // offsets interest" badge here is honest, not a bug.
  const { capitalStack, bufferAmount, bufferMonths, emi } = resolveCapitalStack(propertyPrice, ownFunds, loanRatePercent, tenureMonths, {
    mfPercent: 0,
    buffer: { type: "months", months: 6 },
  });

  const prepayStepUpPercent = 0;
  const outcomes = extraPrepayGrid(emi, 5, 5).map((extra) =>
    evaluateCandidate(
      capitalStack.loanAmount,
      loanRatePercent,
      tenureMonths,
      extra,
      prepayStepUpPercent,
      "bank",
      capitalStack.corpus,
      DEFAULT_BANK_RETURN_PERCENT,
      incomeTaxRatePercent,
      DEFAULT_SWP_CAPITAL_GAINS_TAX_PERCENT,
    ),
  );
  // Hard constraint: never deplete. Among survivors, prefer more prepay.
  const chosen = pickBestOrSafest(outcomes, (a, b) => b.extraMonthlyPrepayment - a.extraMonthlyPrepayment);

  return {
    id: "safety",
    name: "Safety First",
    subtitle: "Maximum cushion — the corpus is built to never run dry",
    fundingMode: "bank",
    capitalStack,
    bufferAmount,
    bufferMonths,
    loanRatePercent,
    tenureMonths,
    extraMonthlyPrepayment: chosen.extraMonthlyPrepayment,
    prepayStepUpPercent,
    mfReturnPercent,
    corpusReturnPercent: DEFAULT_BANK_RETURN_PERCENT,
    emi: chosen.emi,
    payoffMonths: chosen.payoffMonths,
    totalInterestPaid: chosen.totalInterestPaid,
    mfFutureValue: calculateMfFutureValue(capitalStack.mfLumpsum, mfReturnPercent, chosen.payoffMonths),
    corpusDepletedAtMonth: chosen.corpusDepletedAtMonth,
    interestOffsetPercent: computeOffsetPercent(capitalStack.mfLumpsum, mfReturnPercent, chosen.payoffMonths, chosen.totalInterestPaid),
  };
}

function runBalanced(
  propertyPrice: number,
  ownFunds: number,
  loanRatePercent: number,
  tenureMonths: number,
  mfReturnPercent: number,
  incomeTaxRatePercent: number,
): StrategyResult {
  const { capitalStack, bufferAmount, bufferMonths, emi } = resolveCapitalStack(propertyPrice, ownFunds, loanRatePercent, tenureMonths, {
    mfPercent: 0.5,
    buffer: { type: "months", months: 4 },
  });

  const prepayStepUpPercent = 5;
  const outcomes = extraPrepayGrid(emi, 10, 5).map((extra) =>
    evaluateCandidate(
      capitalStack.loanAmount,
      loanRatePercent,
      tenureMonths,
      extra,
      prepayStepUpPercent,
      "swp",
      capitalStack.corpus,
      DEFAULT_SWP_RETURN_PERCENT,
      incomeTaxRatePercent,
      DEFAULT_SWP_CAPITAL_GAINS_TAX_PERCENT,
    ),
  );
  // Minimize total interest, subject to not depleting before payoff.
  const chosen = pickBestOrSafest(outcomes, (a, b) => a.totalInterestPaid - b.totalInterestPaid);

  return {
    id: "balanced",
    name: "Balanced",
    subtitle: "Strong prepayment without starving the SWP corpus",
    fundingMode: "swp",
    capitalStack,
    bufferAmount,
    bufferMonths,
    loanRatePercent,
    tenureMonths,
    extraMonthlyPrepayment: chosen.extraMonthlyPrepayment,
    prepayStepUpPercent,
    mfReturnPercent,
    corpusReturnPercent: DEFAULT_SWP_RETURN_PERCENT,
    emi: chosen.emi,
    payoffMonths: chosen.payoffMonths,
    totalInterestPaid: chosen.totalInterestPaid,
    mfFutureValue: calculateMfFutureValue(capitalStack.mfLumpsum, mfReturnPercent, chosen.payoffMonths),
    corpusDepletedAtMonth: chosen.corpusDepletedAtMonth,
    interestOffsetPercent: computeOffsetPercent(capitalStack.mfLumpsum, mfReturnPercent, chosen.payoffMonths, chosen.totalInterestPaid),
  };
}

function runAggressive(
  propertyPrice: number,
  ownFunds: number,
  loanRatePercent: number,
  tenureMonths: number,
  mfReturnPercent: number,
  incomeTaxRatePercent: number,
): StrategyResult {
  // Aggressive Payoff deliberately keeps the corpus thin — it's betting on
  // speed (the majority of remaining funds go to the MF lumpsum, not the
  // EMI-funding corpus), so depletion is a real, accepted possibility rather
  // than something the allocation quietly guards against like Safety
  // First's does.
  const { capitalStack, bufferAmount, bufferMonths, emi } = resolveCapitalStack(propertyPrice, ownFunds, loanRatePercent, tenureMonths, {
    mfPercent: 0.85,
    buffer: { type: "flat", amount: 150000 },
  });

  const prepayStepUpPercent = 7.5;
  const outcomes = extraPrepayGrid(emi, 15, 5).map((extra) =>
    evaluateCandidate(
      capitalStack.loanAmount,
      loanRatePercent,
      tenureMonths,
      extra,
      prepayStepUpPercent,
      "swp",
      capitalStack.corpus,
      DEFAULT_SWP_RETURN_PERCENT,
      incomeTaxRatePercent,
      DEFAULT_SWP_CAPITAL_GAINS_TAX_PERCENT,
    ),
  );
  // No depletion constraint — minimize total interest outright, and report
  // whatever depletion results honestly rather than filtering it away.
  const chosen = outcomes.reduce((best, o) => (o.totalInterestPaid < best.totalInterestPaid ? o : best));

  return {
    id: "aggressive",
    name: "Aggressive Payoff",
    subtitle: "Fastest payoff and least interest — corpus depletion is an accepted tradeoff",
    fundingMode: "swp",
    capitalStack,
    bufferAmount,
    bufferMonths,
    loanRatePercent,
    tenureMonths,
    extraMonthlyPrepayment: chosen.extraMonthlyPrepayment,
    prepayStepUpPercent,
    mfReturnPercent,
    corpusReturnPercent: DEFAULT_SWP_RETURN_PERCENT,
    emi: chosen.emi,
    payoffMonths: chosen.payoffMonths,
    totalInterestPaid: chosen.totalInterestPaid,
    mfFutureValue: calculateMfFutureValue(capitalStack.mfLumpsum, mfReturnPercent, chosen.payoffMonths),
    corpusDepletedAtMonth: chosen.corpusDepletedAtMonth,
    interestOffsetPercent: computeOffsetPercent(capitalStack.mfLumpsum, mfReturnPercent, chosen.payoffMonths, chosen.totalInterestPaid),
  };
}

/** Binary-searches the annual MF return r such that FV(mf, r, months) - mf >= totalInterestPaid. */
function solveRequiredMfReturn(mfLumpsum: number, totalInterestPaid: number, months: number): number {
  if (mfLumpsum <= 0) return Infinity;
  if (totalInterestPaid <= 0) return 0;

  let lo = 0;
  let hi = 50;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const fvGain = calculateMfFutureValue(mfLumpsum, mid, months) - mfLumpsum;
    if (fvGain < totalInterestPaid) lo = mid;
    else hi = mid;
  }
  return hi;
}

function runInterestOffset(balanced: StrategyResult, mfReturnPercent: number): StrategyResult {
  const requiredMfReturnPercent = solveRequiredMfReturn(
    balanced.capitalStack.mfLumpsum,
    balanced.totalInterestPaid,
    balanced.payoffMonths,
  );
  const offsetPercentAt3PtsLower = computeOffsetPercent(
    balanced.capitalStack.mfLumpsum,
    requiredMfReturnPercent - 3,
    balanced.payoffMonths,
    balanced.totalInterestPaid,
  );

  return {
    ...balanced,
    id: "offset",
    name: "Interest Offset",
    subtitle: "Size the MF return needed to fully cover the loan's interest cost",
    interestOffsetPercent: computeOffsetPercent(
      balanced.capitalStack.mfLumpsum,
      mfReturnPercent,
      balanced.payoffMonths,
      balanced.totalInterestPaid,
    ),
    requiredMfReturnPercent,
    offsetPercentAt3PtsLower,
  };
}
