import { create } from "zustand";
import { DEFAULT_INPUTS } from "@/components/calculatorTypes";
import type { FundingMode } from "@/lib/calculations/types";

/**
 * Full snapshot of a strategy card's chosen values, written by "Use this
 * plan" and pulled one-way into the Planner. Rate/tenure/price are included
 * even though a strategy's headline numbers are "down payment/MF/corpus/
 * funding mode" — without them the Planner would show that allocation
 * against a stale rate/tenure and no longer match the card.
 *
 * Deliberately excludes "own funds available": that's the user's own raw
 * input, not a strategy output, and some models (Aggressive Payoff) don't
 * even allocate 100% of it into downPayment+mfLumpsum+corpus — a chunk goes
 * to extraMonthlyPrepayment instead, so reconstructing "own funds" from the
 * capital stack would silently corrupt the field with a wrong number. The
 * Planner's own-funds value is left untouched by applying a strategy;
 * `resolveOwnFundsSplit` in Calculator.tsx still clamps dp/mf against
 * whatever the user has actually entered there.
 */
export interface AppliedStrategy {
  price: number;
  downPayment: number;
  mfLumpsum: number;
  fundingMode: FundingMode;
  rate: number;
  tenure: number;
  extraPrepayment: number;
  prepayStepUpPercent: number;
  annualLumpSumCount: number;
}

/**
 * Fields QuickEstimate and the full Planner both edit live: home loan
 * interest rate, tenure, and loan amount. This store is the single source
 * of truth for them — QuickEstimate reads/writes it directly, and the
 * Planner (which has no direct "loan amount" field, only Property price
 * and Down payment) mirrors it via equality-gated effects in Calculator.tsx.
 * Gating every mirror write on "is this actually a change" is what keeps
 * the two-way sync from looping.
 *
 * price/ownFunds follow the exact same pattern, for StrategyTeaserGrid <->
 * Planner: StrategyTeaserGrid reads/writes them directly (no local draft
 * state of its own), Calculator.tsx mirrors them into inputs.price/inputs.own
 * via the same equality-gated push/pull effects as rate/tenure. Before this,
 * StrategyTeaserGrid held its own independent propertyPrice/ownFunds
 * useState — live within itself, but never connected to the Planner below,
 * so the Planner kept showing stale defaults no matter what was entered in
 * the teaser card.
 *
 * extraPrepayment/prepayStepUpPercent/emiStepUpPercent are one-way: the
 * Planner is their only editor (QuickEstimate has no prepayment inputs of
 * its own), so Calculator.tsx just pushes its current values in on change.
 * QuickEstimate reads them purely to compute the *actual* total interest
 * (via generateAmortizationSchedule, the same function the Planner itself
 * uses) instead of the naive no-prepayment baseline — so its "Total
 * interest"/"Total amount payable" always match the Planner's real numbers
 * once a prepayment plan is configured, rather than silently diverging.
 */
interface SharedInputsState {
  rate: number;
  tenure: number;
  /** Derived elsewhere as Property price − Down payment; stored directly so QuickEstimate has a single field to bind to. */
  loanAmount: number;
  price: number;
  ownFunds: number;
  extraPrepayment: number;
  prepayStepUpPercent: number;
  emiStepUpPercent: number;
  setRate: (rate: number) => void;
  setTenure: (tenure: number) => void;
  setLoanAmount: (loanAmount: number) => void;
  setPrice: (price: number) => void;
  setOwnFunds: (ownFunds: number) => void;
  setExtraPrepayment: (extraPrepayment: number) => void;
  setPrepayStepUpPercent: (prepayStepUpPercent: number) => void;
  setEmiStepUpPercent: (emiStepUpPercent: number) => void;
  /** Non-null once a strategy card's "Use this plan" has been clicked at least once. */
  appliedStrategy: AppliedStrategy | null;
  /** Increments on every applyStrategy call, so re-clicking the same card still re-triggers the Planner's pull effect. */
  applyStrategyToken: number;
  applyStrategy: (strategy: AppliedStrategy) => void;
}

export const useSharedInputsStore = create<SharedInputsState>((set) => ({
  rate: DEFAULT_INPUTS.lr,
  tenure: DEFAULT_INPUTS.tenure,
  loanAmount: DEFAULT_INPUTS.price - DEFAULT_INPUTS.dp,
  price: DEFAULT_INPUTS.price,
  ownFunds: DEFAULT_INPUTS.own,
  extraPrepayment: DEFAULT_INPUTS.extra,
  prepayStepUpPercent: DEFAULT_INPUTS.stepup,
  emiStepUpPercent: DEFAULT_INPUTS.stepupemi,
  setRate: (rate) => set({ rate }),
  setTenure: (tenure) => set({ tenure }),
  setLoanAmount: (loanAmount) => set({ loanAmount }),
  setPrice: (price) => set({ price }),
  setOwnFunds: (ownFunds) => set({ ownFunds }),
  setExtraPrepayment: (extraPrepayment) => set({ extraPrepayment }),
  setPrepayStepUpPercent: (prepayStepUpPercent) => set({ prepayStepUpPercent }),
  setEmiStepUpPercent: (emiStepUpPercent) => set({ emiStepUpPercent }),
  appliedStrategy: null,
  applyStrategyToken: 0,
  applyStrategy: (strategy) => set((state) => ({ appliedStrategy: strategy, applyStrategyToken: state.applyStrategyToken + 1 })),
}));
