import type { StrategyResult } from "@/lib/calculations/strategies";
import { StrategyCard, type UsePlanOptions } from "./StrategyCard";

interface StrategyGridProps {
  results: StrategyResult[];
  onUsePlan: (result: StrategyResult, options: UsePlanOptions) => void;
}

export function StrategyGrid({ results, onUsePlan }: StrategyGridProps) {
  const safetyResult = results.find((r) => r.id === "safety");
  const balanced = results.find((r) => r.id === "balanced");

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-10">
      <div className="grid min-w-0 grid-cols-2 gap-4 lg:grid-cols-4">
        {results.map((result) => (
          <StrategyCard key={result.id} result={result} safetyResult={safetyResult} onUsePlan={onUsePlan} />
        ))}
      </div>

      <p className="mt-5 text-caption leading-relaxed text-ink-3">
        Assumes a {balanced?.loanRatePercent ?? "–"}% loan rate, a {balanced?.mfReturnPercent ?? 12}% mutual fund
        return, and a {balanced?.corpusReturnPercent ?? "–"}% SWP/bank corpus return. Buffer targets: Safety First
        holds back ~6 months of EMI, Balanced and Interest Offset ~4 months, Aggressive Payoff a flat ₹1.5L floor.
        Illustrative model only, not financial advice — see the full planner below to adjust every assumption
        yourself.
      </p>
    </section>
  );
}
