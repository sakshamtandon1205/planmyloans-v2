import type { StrategyResult } from "./calculations/strategies";
import { useSharedInputsStore } from "./sharedInputsStore";

/**
 * Writes a computed strategy's capital stack into the shared store (read by
 * the Planner's ControlPanel/MobileInputSheet) and scrolls to it — the
 * single "apply this plan" action shared by the rich StrategyCard's "Use
 * this plan" button and the home page's plain 4-card strategy teaser.
 */
export function applyStrategyResult(result: StrategyResult, annualLumpSumCount?: number) {
  const { downPayment, mfLumpsum, corpus, loanAmount } = result.capitalStack;
  useSharedInputsStore.getState().applyStrategy({
    price: loanAmount + downPayment,
    ownFunds: downPayment + mfLumpsum + corpus,
    downPayment,
    mfLumpsum,
    fundingMode: result.fundingMode,
    rate: result.loanRatePercent,
    tenure: result.tenureMonths / 12,
    extraPrepayment: result.extraMonthlyPrepayment,
    prepayStepUpPercent: result.prepayStepUpPercent,
    annualLumpSumCount: annualLumpSumCount ?? result.annualLumpSumCount,
  });
  document.getElementById("planner")?.scrollIntoView({ behavior: "smooth" });
}
