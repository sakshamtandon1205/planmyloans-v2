import { calculateEmi, generateAmortizationSchedule } from "./emi";
import { calculateMfFutureValue } from "./mf";
import { simulateBankCorpus, simulateSwpCorpus } from "./swp";
import { calculateLoanTaxBenefitFromSchedule } from "./tax";
import type { AmortizationRow, FundingMode } from "./types";

export type StrategyId = "safety" | "balanced" | "aggressive" | "bonus";

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
  /** Down payment as a fraction of property price — now variable per strategy (searched or model-fixed), never a global constant. */
  downPaymentPercent: number;
  /** corpus / EMI at allocation — a simple "how many months of EMI this corpus nominally covers" figure. */
  emiRunwayMonths: number;
  loanRatePercent: number;
  tenureMonths: number;
  extraMonthlyPrepayment: number;
  prepayStepUpPercent: number;
  /** Extra EMI-equivalent lump sums per year baked into this strategy's own search (0 for all but Tax-Optimized, which fixes it at 1). Safety First's card can still layer its own stepper on top of this at display time. */
  annualLumpSumCount: number;
  mfReturnPercent: number;
  corpusReturnPercent: number;
  emi: number;
  payoffMonths: number;
  totalInterestPaid: number;
  mfFutureValue: number;
  corpusDepletedAtMonth: number | null;
  /** MF future value + any surviving corpus balance, evaluated at THIS strategy's own actual payoff month — not a shared fixed tenure, since each card can pay off at a genuinely different time. */
  netWealthAtPayoff: number;
  /** (FV(MF) - MF lumpsum) / total interest, clamped at 0 with no upper clamp. */
  interestOffsetPercent: number;
  /** Tax-Optimized Payoff only: Sec 24(b) + 80C tax saved (Old Regime only) via calculateLoanTaxBenefitFromSchedule. */
  taxSavingsAmount?: number;
  /** Tax-Optimized Payoff only: totalInterestPaid - taxSavingsAmount. */
  netEffectiveInterestCost?: number;
}

// Matches the Planner's own defaults in calculatorTypes.ts (DEFAULT_INPUTS) — the
// strategy engine deliberately reuses these rather than inventing new assumptions.
const DEFAULT_MF_RETURN_PERCENT = 12;
const DEFAULT_INCOME_TAX_RATE_PERCENT = 30;
const DEFAULT_SWP_RETURN_PERCENT = 7.5;
const DEFAULT_BANK_RETURN_PERCENT = 6.5;
const DEFAULT_SWP_CAPITAL_GAINS_TAX_PERCENT = 12.5;

/** Hard floor every model's down payment must respect — never go below 20% of property price. */
export const DOWN_PAYMENT_FLOOR_PERCENT = 0.2;

// Realistic annual prepay step-ups — nobody bumps their EMI by 5-7.5%/yr in
// practice. Safety First stays at 0% (no step-up at all); Balanced and
// Aggressive use fixed, more plausible rates instead of the old 5%/7.5%.
export const BALANCED_STEP_UP_PERCENT = 3;
export const AGGRESSIVE_STEP_UP_PERCENT = 5;

export function computeStrategies(input: StrategyEngineInput): StrategyResult[] {
  const {
    propertyPrice,
    ownFunds,
    loanRatePercent,
    tenureYears,
    mfReturnPercent = DEFAULT_MF_RETURN_PERCENT,
    incomeTaxRatePercent = DEFAULT_INCOME_TAX_RATE_PERCENT,
  } = input;

  const ctx: StrategyContext = {
    propertyPrice,
    ownFunds,
    loanRatePercent,
    tenureMonths: tenureYears * 12,
    mfReturnPercent,
    incomeTaxRatePercent,
  };

  return [runSafetyFirst(ctx), runBalanced(ctx), runAggressive(ctx), runTaxOptimized(ctx)];
}

// ---------------------------------------------------------------------------
// Capital-stack sizing
// ---------------------------------------------------------------------------

interface StrategyContext {
  propertyPrice: number;
  ownFunds: number;
  loanRatePercent: number;
  tenureMonths: number;
  mfReturnPercent: number;
  incomeTaxRatePercent: number;
}

interface ResolvedStack {
  downPaymentPercent: number;
  downPayment: number;
  loanAmount: number;
  emi: number;
  corpus: number;
  mfLumpsum: number;
  emiRunwayMonths: number;
}

/**
 * Down payment is a percentage of property price (clamped to the 20% floor),
 * chosen per-model. The corpus is sized directly by `corpusFn` (in rupees,
 * typically expressed as a multiple of the resulting EMI — "months of
 * runway"); everything left over after down payment and corpus goes to the
 * MF lumpsum. There's no separate held-back reserve bucket in this model —
 * own funds split exactly three ways.
 */
function resolveStack(
  ctx: StrategyContext,
  downPaymentPercent: number,
  corpusFn: (emi: number, remaining: number) => number,
): ResolvedStack {
  const downPayment = Math.max(DOWN_PAYMENT_FLOOR_PERCENT, downPaymentPercent) * ctx.propertyPrice;
  const loanAmount = Math.max(0, ctx.propertyPrice - downPayment);
  const emi = calculateEmi({ principal: loanAmount, annualRatePercent: ctx.loanRatePercent, tenureMonths: ctx.tenureMonths });

  const remaining = Math.max(0, ctx.ownFunds - downPayment);
  const corpus = Math.min(Math.max(0, corpusFn(emi, remaining)), remaining);
  const mfLumpsum = Math.max(0, remaining - corpus);

  return {
    downPaymentPercent: downPayment / ctx.propertyPrice,
    downPayment,
    loanAmount,
    emi,
    corpus,
    mfLumpsum,
    emiRunwayMonths: emi > 0 ? corpus / emi : 0,
  };
}

// ---------------------------------------------------------------------------
// Search grid helpers
// ---------------------------------------------------------------------------

/** Inclusive, evenly-spaced points from start to end. */
function linspace(start: number, end: number, points: number): number[] {
  if (points <= 1) return [start];
  const step = (end - start) / (points - 1);
  return Array.from({ length: points }, (_, i) => start + step * i);
}

/** Nearest ₹100 — keeps every search-derived rupee figure looking like a plausible human-chosen amount (₹9,800, not ₹9,836). */
function roundToHundred(n: number): number {
  return Math.round(n / 100) * 100;
}

/**
 * Extra monthly prepay is expressed and capped as a percentage of the
 * strategy's own EMI (not an unbounded rupee search) — keeps the resulting
 * rupee figures in the range a real salaried person could plausibly commit
 * to, rather than an outlier like ₹30,000/mo on a ₹70,000 EMI. Each grid
 * point is rounded to the nearest ₹100 before it ever reaches simulation,
 * so the simulated interest/payoff figures always match the rupee amount
 * actually displayed — never simulate one number and show a rounded other.
 */
function extraPrepayGrid(emi: number, capPercentOfEmi: number, points: number): number[] {
  return linspace(0, capPercentOfEmi, points).map((pct) => roundToHundred((pct / 100) * emi));
}

// ---------------------------------------------------------------------------
// Simulate one candidate via the existing tested engine
// ---------------------------------------------------------------------------

interface SimulatedCandidate extends ResolvedStack {
  extraMonthlyPrepayment: number;
  prepayStepUpPercent: number;
  annualLumpSumCount: number;
  payoffMonths: number;
  totalInterestPaid: number;
  corpusDepletedAtMonth: number | null;
  corpusFinalBalance: number;
  mfFutureValue: number;
  netWealthAtPayoff: number;
  schedule: AmortizationRow[];
}

function simulateCandidate(
  ctx: StrategyContext,
  stack: ResolvedStack,
  fundingMode: FundingMode,
  corpusReturnPercent: number,
  extraMonthlyPrepayment: number,
  prepayStepUpPercent: number,
  annualLumpSumCount: number,
): SimulatedCandidate {
  const amortization = generateAmortizationSchedule({
    principal: stack.loanAmount,
    annualRatePercent: ctx.loanRatePercent,
    tenureMonths: ctx.tenureMonths,
    extraMonthlyPrepayment,
    annualPrepayStepUpPercent: prepayStepUpPercent,
    annualLumpSumCount,
  });

  const emiSchedule = amortization.schedule.map((row) => row.emi);
  // Corpus is only checked for depletion through payoff — what happens after
  // the loan is repaid doesn't bear on "did it fund every EMI."
  const corpusSim =
    fundingMode === "swp"
      ? simulateSwpCorpus({
          initialCorpus: stack.corpus,
          annualReturnPercent: corpusReturnPercent,
          emiSchedule,
          payoffMonths: amortization.payoffMonths,
          horizonMonths: amortization.payoffMonths,
          incomeTaxRatePercent: ctx.incomeTaxRatePercent,
          capitalGainsTaxRatePercent: DEFAULT_SWP_CAPITAL_GAINS_TAX_PERCENT,
        })
      : simulateBankCorpus({
          initialCorpus: stack.corpus,
          annualReturnPercent: corpusReturnPercent,
          emiSchedule,
          payoffMonths: amortization.payoffMonths,
          horizonMonths: amortization.payoffMonths,
          incomeTaxRatePercent: ctx.incomeTaxRatePercent,
        });

  // MF growth (and net wealth) is evaluated at THIS candidate's own actual
  // payoff month, not the loan's original nominal tenure — a strategy that
  // closes the loan in 9 years should have its wealth figure reflect 9
  // years of growth, not 20. Aggressive Payoff's selection no longer
  // depends on net wealth (see runAggressive — it directly minimizes
  // payoff time instead, precisely to avoid the perverse "shorter payoff
  // shrinks the reported compounding window" incentive that motivated
  // pinning this to a fixed horizon in an earlier pass), so it's safe to
  // report the more honest, per-candidate figure here.
  const mfFutureValue = calculateMfFutureValue(stack.mfLumpsum, ctx.mfReturnPercent, amortization.payoffMonths);
  const netWealthAtPayoff = mfFutureValue + Math.max(0, corpusSim.finalBalance);

  return {
    ...stack,
    extraMonthlyPrepayment,
    prepayStepUpPercent,
    annualLumpSumCount,
    payoffMonths: amortization.payoffMonths,
    totalInterestPaid: amortization.totalInterestPaid,
    corpusDepletedAtMonth: corpusSim.depletedAtMonth,
    corpusFinalBalance: corpusSim.finalBalance,
    mfFutureValue,
    netWealthAtPayoff,
    schedule: amortization.schedule,
  };
}

/**
 * Picks the best candidate (by `compareBest`, ascending — lower "wins")
 * among those satisfying `isFeasible`. If none satisfy it (the allocation
 * itself is too tight for these inputs), falls back to whichever candidate
 * depletes latest, breaking ties by the model's own objective — an honest
 * "safest/best available" choice rather than silently violating the rule.
 */
function pickBest<T extends { corpusDepletedAtMonth: number | null }>(
  candidates: T[],
  isFeasible: (c: T) => boolean,
  compareBest: (a: T, b: T) => number,
): T {
  const feasible = candidates.filter(isFeasible);
  if (feasible.length > 0) {
    return feasible.reduce((best, c) => (compareBest(c, best) < 0 ? c : best));
  }
  return candidates.reduce((best, c) => {
    const cMonth = c.corpusDepletedAtMonth ?? Infinity;
    const bestMonth = best.corpusDepletedAtMonth ?? Infinity;
    if (cMonth !== bestMonth) return cMonth > bestMonth ? c : best;
    return compareBest(c, best) < 0 ? c : best;
  });
}

function computeOffsetPercent(mfLumpsum: number, mfReturnPercent: number, months: number, totalInterestPaid: number): number {
  if (totalInterestPaid <= 0) return 0;
  const fv = calculateMfFutureValue(mfLumpsum, mfReturnPercent, months);
  return Math.max(0, ((fv - mfLumpsum) / totalInterestPaid) * 100);
}

/** All rupee-denominated fields are whole numbers by the time they leave this engine — no stray decimals on any card or once applied into the Planner's own inputs. */
function roundMoney(n: number): number {
  return Math.round(n);
}

function buildResult(
  id: StrategyId,
  name: string,
  subtitle: string,
  fundingMode: FundingMode,
  corpusReturnPercent: number,
  ctx: StrategyContext,
  chosen: SimulatedCandidate,
  extra?: { taxSavingsAmount: number; netEffectiveInterestCost: number },
): StrategyResult {
  return {
    id,
    name,
    subtitle,
    fundingMode,
    capitalStack: {
      downPayment: roundMoney(chosen.downPayment),
      mfLumpsum: roundMoney(chosen.mfLumpsum),
      corpus: roundMoney(chosen.corpus),
      loanAmount: roundMoney(chosen.loanAmount),
    },
    downPaymentPercent: chosen.downPaymentPercent,
    emiRunwayMonths: chosen.emiRunwayMonths,
    loanRatePercent: ctx.loanRatePercent,
    tenureMonths: ctx.tenureMonths,
    extraMonthlyPrepayment: roundMoney(chosen.extraMonthlyPrepayment),
    prepayStepUpPercent: chosen.prepayStepUpPercent,
    annualLumpSumCount: chosen.annualLumpSumCount,
    mfReturnPercent: ctx.mfReturnPercent,
    corpusReturnPercent,
    emi: roundMoney(chosen.emi),
    payoffMonths: chosen.payoffMonths,
    totalInterestPaid: roundMoney(chosen.totalInterestPaid),
    mfFutureValue: roundMoney(chosen.mfFutureValue),
    corpusDepletedAtMonth: chosen.corpusDepletedAtMonth,
    netWealthAtPayoff: roundMoney(chosen.netWealthAtPayoff),
    interestOffsetPercent: computeOffsetPercent(chosen.mfLumpsum, ctx.mfReturnPercent, chosen.payoffMonths, chosen.totalInterestPaid),
    ...(extra
      ? { taxSavingsAmount: roundMoney(extra.taxSavingsAmount), netEffectiveInterestCost: roundMoney(extra.netEffectiveInterestCost) }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// Model 1 — Safety First (Capital Preservation)
// ---------------------------------------------------------------------------

/**
 * Safety First's own capital-stack resolver — deliberately not the shared
 * `resolveStack`, because this model's shape is different: down payment and
 * MF lumpsum are both sized directly as a percentage of OWN FUNDS (not
 * property price), with the 20%-of-price floor still enforced underneath
 * as a hard safety rail. Everything left after those two goes to the bank
 * corpus, which naturally lands around ~12.5-15% of own funds when down
 * payment is ~80% and MF is ~5-7.5% — no separate leftover-absorption pass
 * needed, since the three percentages are designed to sum to ~100%.
 */
function resolveSafetyStack(
  ctx: StrategyContext,
  downPaymentPercentOfOwnFunds: number,
  mfPercentOfOwnFunds: number,
): ResolvedStack {
  const dpTarget = downPaymentPercentOfOwnFunds * ctx.ownFunds;
  const downPayment = Math.min(ctx.propertyPrice, Math.max(DOWN_PAYMENT_FLOOR_PERCENT * ctx.propertyPrice, dpTarget));
  const loanAmount = Math.max(0, ctx.propertyPrice - downPayment);
  const emi = calculateEmi({ principal: loanAmount, annualRatePercent: ctx.loanRatePercent, tenureMonths: ctx.tenureMonths });

  const remaining = Math.max(0, ctx.ownFunds - downPayment);
  const mfLumpsum = Math.min(mfPercentOfOwnFunds * ctx.ownFunds, remaining);
  const corpus = Math.max(0, remaining - mfLumpsum);

  return {
    downPaymentPercent: downPayment / ctx.propertyPrice,
    downPayment,
    loanAmount,
    emi,
    corpus,
    mfLumpsum,
    emiRunwayMonths: emi > 0 ? corpus / emi : 0,
  };
}

function runSafetyFirst(ctx: StrategyContext): StrategyResult {
  const candidates: SimulatedCandidate[] = [];
  // ~80% of own funds to down payment (the primary lever that keeps EMI
  // low), ~5-7.5% to a small, low-key MF lumpsum (not zero — a little
  // market exposure is still part of this model), remainder (~12.5-15%)
  // to the bank corpus.
  for (const dpPercentOfOwnFunds of linspace(0.775, 0.825, 3)) {
    for (const mfPercentOfOwnFunds of linspace(0.05, 0.075, 3)) {
      const stack = resolveSafetyStack(ctx, dpPercentOfOwnFunds, mfPercentOfOwnFunds);
      for (const extra of extraPrepayGrid(stack.emi, 5, 5)) {
        candidates.push(simulateCandidate(ctx, stack, "bank", DEFAULT_BANK_RETURN_PERCENT, extra, 0, 0));
      }
    }
  }

  // Hard constraint: corpus must never deplete before payoff, non-negotiable
  // for this model. Among survivors, minimize total interest paid.
  const chosen = pickBest(
    candidates,
    (c) => c.corpusDepletedAtMonth === null,
    (a, b) => a.totalInterestPaid - b.totalInterestPaid,
  );

  return buildResult(
    "safety",
    "Safety First",
    "Maximum cushion — a heavy down payment and a genuine buffer, built to never run dry",
    "bank",
    DEFAULT_BANK_RETURN_PERCENT,
    ctx,
    chosen,
  );
}

// ---------------------------------------------------------------------------
// Model 2 — Balanced (Recommended default)
// ---------------------------------------------------------------------------

/**
 * Balanced's own resolver — down payment is a medium ~40-50% of own funds
 * (between Safety's ~80% and Aggressive's ~20% floor), the corpus is sized
 * to the existing 36-48mo runway target, and only a modest share of
 * whatever's left goes to the MF lumpsum. The rest is deliberately left
 * undeployed here (still within `ownFunds`, per the capital-stack
 * invariant) rather than forced into MF — this model's interest reduction
 * is meant to come from a bigger monthly prepayment search budget (see
 * `runBalanced`'s higher `extraPrepayGrid` cap), not from a large lumpsum's
 * paper growth.
 */
function resolveBalancedStack(ctx: StrategyContext, downPaymentPercentOfOwnFunds: number, runwayMonths: number): ResolvedStack {
  const dpTarget = downPaymentPercentOfOwnFunds * ctx.ownFunds;
  const downPayment = Math.min(ctx.propertyPrice, Math.max(DOWN_PAYMENT_FLOOR_PERCENT * ctx.propertyPrice, dpTarget));
  const loanAmount = Math.max(0, ctx.propertyPrice - downPayment);
  const emi = calculateEmi({ principal: loanAmount, annualRatePercent: ctx.loanRatePercent, tenureMonths: ctx.tenureMonths });

  const remaining = Math.max(0, ctx.ownFunds - downPayment);
  const corpus = Math.min(runwayMonths * emi, remaining);
  const afterCorpus = Math.max(0, remaining - corpus);
  const mfLumpsum = BALANCED_MF_SHARE_OF_REMAINDER * afterCorpus;

  return {
    downPaymentPercent: downPayment / ctx.propertyPrice,
    downPayment,
    loanAmount,
    emi,
    corpus,
    mfLumpsum,
    emiRunwayMonths: emi > 0 ? corpus / emi : 0,
  };
}

/** A modest, not-100%, share of what's left after down payment and corpus — the rest funds a bigger monthly-prepay search budget instead of a large MF lumpsum. */
const BALANCED_MF_SHARE_OF_REMAINDER = 0.45;

function runBalanced(ctx: StrategyContext): StrategyResult {
  const candidates: SimulatedCandidate[] = [];
  for (const dpPercentOfOwnFunds of linspace(0.4, 0.5, 3)) {
    for (const runwayMonths of linspace(36, 48, 4)) {
      const stack = resolveBalancedStack(ctx, dpPercentOfOwnFunds, runwayMonths);
      // Cap raised from the old 10% to 12.5% of EMI — with less going to
      // the MF lumpsum, this model leans more on real monthly prepayment to
      // cut interest, while staying below Aggressive Payoff's 15% cap.
      for (const extra of extraPrepayGrid(stack.emi, 12.5, 5)) {
        candidates.push(simulateCandidate(ctx, stack, "swp", DEFAULT_SWP_RETURN_PERCENT, extra, BALANCED_STEP_UP_PERCENT, 0));
      }
    }
  }

  // Soft constraint: prefer the corpus lasting at least 5 years (60mo, the
  // low end of the 5-7yr guidance) — a preference, not a hard requirement.
  // Minimize total interest among whichever set satisfies it.
  const chosen = pickBest(
    candidates,
    (c) => c.corpusDepletedAtMonth === null || c.corpusDepletedAtMonth >= 60,
    (a, b) => a.totalInterestPaid - b.totalInterestPaid,
  );

  return buildResult(
    "balanced",
    "Balanced",
    "Strong prepayment without starving the SWP corpus",
    "swp",
    DEFAULT_SWP_RETURN_PERCENT,
    ctx,
    chosen,
  );
}

// ---------------------------------------------------------------------------
// Model 3 — Aggressive Payoff (Wealth Maximizer)
// ---------------------------------------------------------------------------

function runAggressive(ctx: StrategyContext): StrategyResult {
  const candidates: SimulatedCandidate[] = [];
  for (const downPaymentPercent of linspace(DOWN_PAYMENT_FLOOR_PERCENT, 0.25, 3)) {
    // Thin, fixed 12-month runway buffer; everything else after down
    // payment and that buffer goes to the MF lumpsum.
    const stack = resolveStack(ctx, downPaymentPercent, (emi) => 12 * emi);
    for (const extra of extraPrepayGrid(stack.emi, 15, 5)) {
      candidates.push(simulateCandidate(ctx, stack, "swp", DEFAULT_SWP_RETURN_PERCENT, extra, AGGRESSIVE_STEP_UP_PERCENT, 0));
    }
  }

  // No depletion constraint. Primary objective is the model's own name:
  // minimize payoff time (tie-broken by total interest paid). Net wealth is
  // still computed and reported on the card, but isn't the selector here —
  // with this model's corpus deliberately thin and fixed (12mo runway), it
  // reliably drains to zero within the first year regardless of how
  // aggressively the loan is prepaid, so "maximize net wealth" degenerates
  // into a no-op across the prepay dimension (MF growth is now reported at
  // a fixed horizon too — see simulateCandidate) and can't actually
  // differentiate candidates the way minimizing payoff time does.
  const chosen = pickBest(
    candidates,
    () => true,
    (a, b) => a.payoffMonths - b.payoffMonths || a.totalInterestPaid - b.totalInterestPaid,
  );

  return buildResult(
    "aggressive",
    "Aggressive Payoff",
    "Fastest payoff and least interest — corpus depletion is an accepted tradeoff",
    "swp",
    DEFAULT_SWP_RETURN_PERCENT,
    ctx,
    chosen,
  );
}

// ---------------------------------------------------------------------------
// Model 4 — Tax-Optimized Payoff (Bonus)
// ---------------------------------------------------------------------------

function runTaxOptimized(ctx: StrategyContext): StrategyResult {
  // Every parameter here is fixed, not searched: 20% down payment, a 24-
  // month runway corpus, zero monthly extra prepay, and exactly 1 extra
  // EMI-equivalent lump sum per year — a defining, non-adjustable
  // characteristic of this model (distinct from Safety First's user-facing
  // stepper).
  const stack = resolveStack(ctx, DOWN_PAYMENT_FLOOR_PERCENT, (emi) => 24 * emi);
  const chosen = simulateCandidate(ctx, stack, "swp", DEFAULT_SWP_RETURN_PERCENT, 0, 0, 1);

  // Sec 24(b) (interest, capped ₹2L/yr) + 80C (principal, capped ₹1.5L/yr) —
  // only legally available under India's Old Tax Regime for a self-occupied
  // property. Reused verbatim, not reimplemented.
  const taxBenefit = calculateLoanTaxBenefitFromSchedule(chosen.schedule, ctx.incomeTaxRatePercent);
  const netEffectiveInterestCost = chosen.totalInterestPaid - taxBenefit.totalTaxSaved;

  return buildResult(
    "bonus",
    "Tax-Optimized Payoff",
    "One extra EMI a year, offset by Sec 24(b) + 80C savings (assumes Old Tax Regime)",
    "swp",
    DEFAULT_SWP_RETURN_PERCENT,
    ctx,
    chosen,
    { taxSavingsAmount: taxBenefit.totalTaxSaved, netEffectiveInterestCost },
  );
}
