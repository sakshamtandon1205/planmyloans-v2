import { formatINR } from "@/lib/format";
import type { CalculatorInputs, CalculatorResults } from "./calculatorTypes";

interface TaxImpactCardProps {
  inputs: CalculatorInputs;
  results: CalculatorResults;
}

/** Compact label/value list card — the planner's "Tax impact" summary, distinct from the metric-card grid above it. */
export function TaxImpactCard({ inputs, results }: TaxImpactCardProps) {
  const swpTaxLabel = inputs.mode === "bank" ? "Tax paid on bank interest" : "Tax paid on SWP withdrawals";

  const rows = [
    { label: swpTaxLabel, value: formatINR(results.corpusSim.totalTaxPaid) },
    { label: "Tax saved via loan (24b + 80C)", value: formatINR(results.taxBenefit.totalTaxSaved) },
    { label: "Net effective interest cost", value: formatINR(Math.max(0, results.netInterest)) },
  ];

  return (
    <div className="glass-panel-sm p-[17px]">
      <div className="mb-[11px] font-heading text-[13px] font-bold text-ink">Tax impact</div>
      <div>
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex justify-between gap-3 py-[7px] text-[12.5px] ${i < rows.length - 1 ? "border-b border-line" : ""}`}
          >
            <span className="font-medium text-ink-2">{row.label}</span>
            <span className="flex-none font-mono font-semibold text-ink">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
