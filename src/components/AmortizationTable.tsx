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

/** Row height (py-3 + text line height) — used to cap the scroll viewport to exactly 5 rows. */
const ROW_HEIGHT_PX = 45;
const VISIBLE_ROW_COUNT = 5;

/** Always shown open, matching the mock — only the Yearly/Monthly granularity is a toggle. Every row is present; only 5 are visible at once, the rest reachable by scrolling. */
export function AmortizationTable({ schedule }: AmortizationTableProps) {
  const [granularity, setGranularity] = useState<Granularity>("yearly");

  const rows = useMemo(
    () => (granularity === "yearly" ? toYearlyRows(schedule) : toMonthlyRows(schedule)),
    [granularity, schedule],
  );

  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-center justify-between gap-2.5">
        <span className="text-body-sm font-semibold text-ink">Amortization schedule</span>
        <div className="inline-flex gap-1.5 rounded-[9px] bg-surface-2 p-1">
          {(["yearly", "monthly"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGranularity(g)}
              aria-pressed={granularity === g}
              className={`hover-segment rounded-[7px] px-4 py-2 text-body-sm font-semibold capitalize transition-colors ${
                granularity === g ? "bg-surface text-ink" : "text-ink-3 hover:text-ink"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div tabIndex={0} role="region" aria-label="Amortization schedule table" className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="grid grid-cols-5 gap-2 border-b-2 border-line pb-[9px] text-label font-bold uppercase tracking-[.04em] text-ink-3">
            <span>{granularity === "yearly" ? "Year" : "Month"}</span>
            <span>EMI paid</span>
            <span>Principal</span>
            <span>Interest</span>
            <span>Balance</span>
          </div>
          <div
            tabIndex={0}
            role="region"
            aria-label="Amortization schedule rows"
            style={{ maxHeight: ROW_HEIGHT_PX * VISIBLE_ROW_COUNT }}
            className="overflow-y-auto"
          >
            {rows.map((row) => (
              <div key={row.key} className="grid grid-cols-5 gap-2 border-b border-line py-3 font-mono text-mono-sm text-ink-2">
                <span className="font-sans text-body-sm">{row.label}</span>
                <span>{formatINR(row.emiPaid)}</span>
                <span className="text-indigo">{formatINR(row.principal)}</span>
                <span className="text-amber">{formatINR(row.interest)}</span>
                <span>{formatINR(row.balance)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
