"use client";

import { useId } from "react";
import { useTheme } from "next-themes";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatINR, formatLakh } from "@/lib/format";
import { useMounted } from "@/lib/useMounted";
import { GlassCard } from "./GlassCard";
import type { ChartPoint } from "./calculatorTypes";

const yearTick = (month: number) => `${(month / 12).toFixed(1)}y`;

/** Dark gets a richer, more saturated fill; light stays soft/airy — tuned
 * per theme rather than reusing one fixed gradient for both. */
const FILL_PEAK_OPACITY = { light: 0.16, dark: 0.34 };

function useChartFillOpacity() {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  return mounted && resolvedTheme === "dark" ? FILL_PEAK_OPACITY.dark : FILL_PEAK_OPACITY.light;
}

interface BalanceChartProps {
  series: ChartPoint[];
  corpusLabel: string;
  horizonMonths: number;
  /** Month the loan balance hits zero, or null if it's still outstanding at the end of the horizon. */
  payoffMonth: number | null;
  /** Month the funding corpus hits zero, or null if it lasts the full horizon. */
  depletionMonth: number | null;
}

export function BalanceChart({ series, corpusLabel, horizonMonths, payoffMonth, depletionMonth }: BalanceChartProps) {
  const gradientId = useId();
  const mfGradient = `${gradientId}-mf`;
  const corpusGradient = `${gradientId}-corpus`;
  const loanGradient = `${gradientId}-loan`;
  const peakOpacity = useChartFillOpacity();

  return (
    <GlassCard className="p-5">
      <h3 className="font-heading text-h3 text-ink">Balances over time</h3>
      <p className="mb-4 text-body-sm text-ink-3">
        MF grows untouched · {corpusLabel.toLowerCase()} funds the EMI monthly · loan balance amortises
      </p>
      <ResponsiveContainer width="100%" height={340}>
        <AreaChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={mfGradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--jade)" stopOpacity={peakOpacity} />
              <stop offset="95%" stopColor="var(--jade)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id={corpusGradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--indigo)" stopOpacity={peakOpacity} />
              <stop offset="95%" stopColor="var(--indigo)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id={loanGradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--amber)" stopOpacity={peakOpacity * 0.9} />
              <stop offset="95%" stopColor="var(--amber)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis
            dataKey="month"
            type="number"
            domain={[0, horizonMonths]}
            tick={{ fill: "var(--ink-3)", fontSize: 11 }}
            tickFormatter={yearTick}
            axisLine={{ stroke: "var(--line)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--ink-3)", fontSize: 11 }}
            tickFormatter={(v: number) => formatLakh(v)}
            axisLine={{ stroke: "var(--line)" }}
            tickLine={false}
            // Recharts wraps a tick label onto multiple lines once its
            // measured width exceeds this allocation — 56px wasn't enough
            // for "50.00 L"/"2.00 Cr" and wrapped at every container width
            // tested (not just narrow ones), since the allocation itself,
            // not the container, was the constraint. 70px clears the widest
            // realistic label ("19.99 Cr") with room to spare.
            width={70}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend content={<ChartLegend />} />
          <Area type="monotone" dataKey="mf" name="MF corpus" stroke="var(--jade)" strokeWidth={2.5} fill={`url(#${mfGradient})`} dot={false} />
          <Area
            type="monotone"
            dataKey="corpus"
            name={corpusLabel}
            stroke="var(--indigo)"
            strokeWidth={2.5}
            fill={`url(#${corpusGradient})`}
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="loan"
            name="Loan outstanding"
            stroke="var(--amber)"
            strokeWidth={2.5}
            strokeDasharray="5 4"
            fill={`url(#${loanGradient})`}
            dot={false}
          />
          {payoffMonth !== null && (
            <ReferenceDot
              x={payoffMonth}
              y={0}
              r={4}
              fill="var(--amber)"
              stroke="var(--surface)"
              strokeWidth={2}
              ifOverflow="extendDomain"
              label={(props: CalloutLabelRenderProps) => (
                <CalloutLabel
                  {...props}
                  text={`Loan cleared: Year ${(payoffMonth / 12).toFixed(1)}`}
                  side={payoffMonth < horizonMonths / 2 ? "right" : "left"}
                  lift={42}
                />
              )}
            />
          )}
          {depletionMonth !== null && (
            <ReferenceDot
              x={depletionMonth}
              y={0}
              r={4}
              fill="var(--indigo)"
              stroke="var(--surface)"
              strokeWidth={2}
              ifOverflow="extendDomain"
              label={(props: CalloutLabelRenderProps) => (
                <CalloutLabel
                  {...props}
                  text={`Corpus depleted: Month ${depletionMonth}`}
                  side={depletionMonth < horizonMonths / 2 ? "right" : "left"}
                  lift={22}
                />
              )}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}

export function AmortizationChart({ series }: { series: ChartPoint[] }) {
  const peakOpacity = useChartFillOpacity();

  return (
    <GlassCard className="p-5">
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
            // Recharts wraps a tick label onto multiple lines once its
            // measured width exceeds this allocation — 56px wasn't enough
            // for "50.00 L"/"2.00 Cr" and wrapped at every container width
            // tested (not just narrow ones), since the allocation itself,
            // not the container, was the constraint. 70px clears the widest
            // realistic label ("19.99 Cr") with room to spare.
            width={70}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend content={<ChartLegend />} />
          <Area
            type="monotone"
            dataKey="interest"
            name="Interest portion"
            stroke="var(--amber)"
            fill="var(--amber)"
            fillOpacity={peakOpacity * 0.9}
            strokeWidth={2.5}
          />
          <Area
            type="monotone"
            dataKey="principal"
            name="Principal portion"
            stroke="var(--jade)"
            fill="var(--jade)"
            fillOpacity={peakOpacity}
            strokeWidth={2.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: { dataKey?: string; name?: string; value?: number }[];
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const displayLabel = typeof label === "number" ? yearTick(label) : label;
  return (
    <div className="rounded border border-line-2 bg-ink px-3 py-2.5 text-caption shadow">
      <div className="mb-1.5 font-medium text-paper">{displayLabel}</div>
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

interface CalloutLabelRenderProps {
  viewBox?: { x?: number; y?: number };
}

interface CalloutLabelProps extends CalloutLabelRenderProps {
  text: string;
  side: "left" | "right";
  /** Vertical distance (px) to lift the label above the marker, so nearby callouts can stack without overlapping. */
  lift: number;
}

/** A small marker + leader line + text bubble, "peak value"-annotation style, anchored to a ReferenceDot. */
function CalloutLabel({ viewBox, text, side, lift }: CalloutLabelProps) {
  if (viewBox?.x === undefined || viewBox?.y === undefined) return null;
  const { x, y } = viewBox;
  const dx = side === "right" ? 18 : -18;
  const labelX = x + dx;
  const labelY = y - lift;
  const textAnchor = side === "right" ? "start" : "end";
  const boxWidth = text.length * 5.5 + 14;
  const boxX = side === "right" ? labelX - 5 : labelX - boxWidth + 5;

  return (
    <g pointerEvents="none">
      <line x1={x} y1={y} x2={labelX} y2={labelY + 6} stroke="var(--ink-3)" strokeWidth={1} />
      <rect x={boxX} y={labelY - 11} width={boxWidth} height={16} rx={4} fill="var(--surface)" stroke="var(--line-2)" strokeWidth={1} />
      <text
        x={labelX}
        y={labelY - 3}
        textAnchor={textAnchor}
        fontSize={10}
        fontWeight={600}
        fontFamily="var(--font-jetbrains-mono)"
        fill="var(--ink)"
      >
        {text}
      </text>
    </g>
  );
}
