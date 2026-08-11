import { create } from "zustand";
import { DEFAULT_INPUTS } from "@/components/calculatorTypes";
import type { FundingMode } from "@/lib/calculations/types";

/**
 * Full snapshot of a strategy card's chosen values, written by "Use this
 * plan" and pulled one-way into the Planner. Rate/tenure/price are included
 * even though a strategy's headline numbers are "down payment/MF/corpus/
 * funding mode" — without them the Planner would show that allocation
 * against a stale rate/tenure and no longer match the card. `ownFunds` is
 * derived as downPayment + mfLumpsum + corpus (the strategy engine's buffer
 * has no field in the real Planner, so it's absorbed rather than carried
 * over — the concrete dp/mf/corpus numbers are preserved exactly).
 */
export interface AppliedStrategy {
  price: number;
  ownFunds: number;
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
  extraPrepayment: number;
  prepayStepUpPercent: number;
  emiStepUpPercent: number;
  setRate: (rate: number) => void;
  setTenure: (tenure: number) => void;
  setLoanAmount: (loanAmount: number) => void;
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
  extraPrepayment: DEFAULT_INPUTS.extra,
  prepayStepUpPercent: DEFAULT_INPUTS.stepup,
  emiStepUpPercent: DEFAULT_INPUTS.stepupemi,
  setRate: (rate) => set({ rate }),
  setTenure: (tenure) => set({ tenure }),
  setLoanAmount: (loanAmount) => set({ loanAmount }),
  setExtraPrepayment: (extraPrepayment) => set({ extraPrepayment }),
  setPrepayStepUpPercent: (prepayStepUpPercent) => set({ prepayStepUpPercent }),
  setEmiStepUpPercent: (emiStepUpPercent) => set({ emiStepUpPercent }),
  appliedStrategy: null,
  applyStrategyToken: 0,
  applyStrategy: (strategy) => set((state) => ({ appliedStrategy: strategy, applyStrategyToken: state.applyStrategyToken + 1 })),
}));
