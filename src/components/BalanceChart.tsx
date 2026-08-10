"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatINR, formatLakh } from "@/lib/format";
import type { ChartPoint } from "./calculatorTypes";

interface BalanceChartProps {
  series: ChartPoint[];
  corpusLabel: string;
}

export function BalanceChart({ series, corpusLabel }: BalanceChartProps) {
  return (
    <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
      <h3 className="font-heading text-h3 text-ink">Balances over time</h3>
      <p className="mb-4 text-body-sm text-ink-3">
        MF grows untouched · {corpusLabel.toLowerCase()} funds the EMI monthly · loan balance amortises
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey="monthLabel" tick={{ fill: "var(--ink-3)", fontSize: 11 }} axisLine={{ stroke: "var(--line)" }} tickLine={false} />
          <YAxis
            tick={{ fill: "var(--ink-3)", fontSize: 11 }}
            tickFormatter={(v: number) => formatLakh(v)}
            axisLine={{ stroke: "var(--line)" }}
            tickLine={false}
            width={56}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend content={<ChartLegend />} />
          <Line type="monotone" dataKey="mf" name="MF corpus" stroke="var(--jade)" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="corpus" name={corpusLabel} stroke="var(--indigo)" strokeWidth={2.5} dot={false} />
          <Line
            type="monotone"
            dataKey="loan"
            name="Loan outstanding"
            stroke="var(--amber)"
            strokeWidth={2.5}
            strokeDasharray="5 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AmortizationChart({ series }: { series: ChartPoint[] }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
      <h3 className="font-heading text-h3 text-ink">EMI breakup: interest vs. principal</h3>
      <p className="mb-4 text-body-sm text-ink-3">
        Exactly how a bank amortises each payment: early EMIs are mostly interest, later ones mostly principal,
        until the two swap.
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey="monthLabel" tick={{ fill: "var(--ink-3)", fontSize: 11 }} axisLine={{ stroke: "var(--line)" }} tickLine={false} />
          <YAxis
            tick={{ fill: "var(--ink-3)", fontSize: 11 }}
            tickFormatter={(v: number) => formatLakh(v)}
            axisLine={{ stroke: "var(--line)" }}
            tickLine={false}
            width={56}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend content={<ChartLegend />} />
          <Area
            type="monotone"
            dataKey="interest"
            name="Interest portion"
            stroke="var(--amber)"
            fill="var(--amber)"
            fillOpacity={0.13}
            strokeWidth={2.5}
          />
          <Area
            type="monotone"
            dataKey="principal"
            name="Principal portion"
            stroke="var(--jade)"
            fill="var(--jade)"
            fillOpacity={0.13}
            strokeWidth={2.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: { dataKey?: string; name?: string; value?: number }[];
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-line-2 bg-ink px-3 py-2.5 text-caption shadow">
      <div className="mb-1.5 font-medium text-paper">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="font-mono text-paper/85">
          {p.name}: {formatINR(p.value)}
        </div>
      ))}
    </div>
  );
}

interface ChartLegendEntry {
  value?: string;
  color?: string;
  dataKey?: string;
}

function ChartLegend({ payload }: { payload?: ChartLegendEntry[] }) {
  if (!payload?.length) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
      {payload.map((entry) => (
        <span key={entry.dataKey ?? entry.value} className="inline-flex items-center gap-1.5">
          <span className="inline-block h-[3px] w-4 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="font-mono text-mono-sm text-ink-2">{entry.value}</span>
        </span>
      ))}
    </div>
  );
}
