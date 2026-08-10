"use client";

import { useMemo, useState } from "react";
import { formatINR } from "@/lib/format";
import type { AmortizationRow } from "@/lib/calculations/types";
import { GlassCard } from "./GlassCard";

type Granularity = "yearly" | "monthly";

interface AmortizationTableProps {
  schedule: AmortizationRow[];
}

interface AggregatedRow {
  key: number;
  label: string;
  emiPaid: number;
  principal: number;
  interest: number;
  balance: number;
}

function toYearlyRows(schedule: AmortizationRow[]): AggregatedRow[] {
  const years: AggregatedRow[] = [];
  for (let i = 0; i < schedule.length; i += 12) {
    const block = schedule.slice(i, i + 12);
    years.push({
      key: i / 12 + 1,
      label: `Year ${i / 12 + 1}`,
      emiPaid: block.reduce((sum, r) => sum + r.emi, 0),
      principal: block.reduce((sum, r) => sum + r.principalPortion, 0),
      interest: block.reduce((sum, r) => sum + r.interestPortion, 0),
      balance: block[block.length - 1].balance,
    });
  }
  return years;
}

function toMonthlyRows(schedule: AmortizationRow[]): AggregatedRow[] {
  return schedule.map((r) => ({
    key: r.month,
    label: `Month ${r.month}`,
    emiPaid: r.emi,
    principal: r.principalPortion,
    interest: r.interestPortion,
    balance: r.balance,
  }));
}

/**
 * Collapsed by default (native <details>, controlled so the table body
 * only renders once actually opened — up to 360 monthly rows is cheap to
 * hold in the DOM, but there's no reason to pay for it before anyone
 * looks).
 */
export function AmortizationTable({ schedule }: AmortizationTableProps) {
  const [open, setOpen] = useState(false);
  const [granularity, setGranularity] = useState<Granularity>("yearly");

  const rows = useMemo(
    () => (open ? (granularity === "yearly" ? toYearlyRows(schedule) : toMonthlyRows(schedule)) : []),
    [open, granularity, schedule],
  );

  return (
    <GlassCard>
      <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)} className="group">
        <summary className="flex cursor-pointer list-none items-center gap-2.5 px-5 py-4 text-body-sm font-semibold text-ink transition-colors hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
          View full amortization schedule
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            className="ml-auto size-4 flex-none text-ink-3 transition-transform group-open:rotate-180"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </summary>

        <div className="border-t border-line px-5 pb-5 pt-4">
          <div className="mb-4 inline-flex gap-1.5 rounded bg-surface-2 p-1">
            {(["yearly", "monthly"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGranularity(g)}
                aria-pressed={granularity === g}
                className={`rounded-sm px-3 py-1.5 text-body-sm font-medium capitalize transition-colors ${
                  granularity === g ? "bg-surface text-indigo shadow-sm" : "text-ink-2 hover:text-ink"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="max-h-[420px] overflow-auto rounded border border-line">
            <table className="w-full min-w-[520px] border-collapse text-body-sm">
              <thead className="sticky top-0 bg-surface-2 text-label uppercase text-ink-3">
                <tr>
                  <th className="px-3 py-2.5 text-left font-semibold">{granularity === "yearly" ? "Year" : "Month"}</th>
                  <th className="px-3 py-2.5 text-right font-semibold">EMI paid</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Principal</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Interest</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody className="font-mono text-mono-sm text-ink">
                {rows.map((row) => (
                  <tr key={row.key} className="border-t border-line odd:bg-surface-2/40">
                    <td className="px-3 py-2 text-left font-sans text-body-sm text-ink-2">{row.label}</td>
                    <td className="px-3 py-2 text-right">{formatINR(row.emiPaid)}</td>
                    <td className="px-3 py-2 text-right text-indigo">{formatINR(row.principal)}</td>
                    <td className="px-3 py-2 text-right text-amber">{formatINR(row.interest)}</td>
                    <td className="px-3 py-2 text-right">{formatINR(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </details>
    </GlassCard>
  );
}
