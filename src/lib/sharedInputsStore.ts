import { create } from "zustand";
import { DEFAULT_INPUTS } from "@/components/calculatorTypes";

/**
 * Fields QuickEstimate and the full Planner both edit live: home loan
 * interest rate, tenure, and loan amount. This store is the single source
 * of truth for them — QuickEstimate reads/writes it directly, and the
 * Planner (which has no direct "loan amount" field, only Property price
 * and Down payment) mirrors it via equality-gated effects in Calculator.tsx.
 * Gating every mirror write on "is this actually a change" is what keeps
 * the two-way sync from looping.
 */
interface SharedInputsState {
  rate: number;
  tenure: number;
  /** Derived elsewhere as Property price − Down payment; stored directly so QuickEstimate has a single field to bind to. */
  loanAmount: number;
  setRate: (rate: number) => void;
  setTenure: (tenure: number) => void;
  setLoanAmount: (loanAmount: number) => void;
}

export const useSharedInputsStore = create<SharedInputsState>((set) => ({
  rate: DEFAULT_INPUTS.lr,
  tenure: DEFAULT_INPUTS.tenure,
  loanAmount: DEFAULT_INPUTS.price - DEFAULT_INPUTS.dp,
  setRate: (rate) => set({ rate }),
  setTenure: (tenure) => set({ tenure }),
  setLoanAmount: (loanAmount) => set({ loanAmount }),
}));
