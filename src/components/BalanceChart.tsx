import { motion } from "framer-motion";
import { GlassCard } from "./GlassCard";
import type { ChartPoint } from "./calculatorTypes";

interface BalanceChartProps {
  series: ChartPoint[];
  corpusLabel: string;
  horizonMonths: number;
}

const VIEW_W = 480;
const VIEW_H = 200;
const Y_TOP = 8;
const Y_BOTTOM = 195;

/** month -> x, value -> y, scaled into the 480x200 viewBox — same raw-SVG-polyline recipe as the design spec, fed real simulation data instead of illustrative points. */
function toPoints(series: ChartPoint[], horizonMonths: number, maxValue: number, key: "mf" | "corpus" | "loan"): string {
  return series
    .map((point) => {
      const x = horizonMonths > 0 ? (point.month / horizonMonths) * VIEW_W : 0;
      const ratio = maxValue > 0 ? Math.min(1, Math.max(0, point[key] / maxValue)) : 0;
      const y = Y_TOP + (1 - ratio) * (Y_BOTTOM - Y_TOP);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

/**
 * "Balances over time" — a plain 3-line SVG chart with no axes, gridlines,
 * or fills, matching the design spec's raw-polyline recipe exactly (rather
 * than a fuller chart-library rendering). Fed the real simulation series.
 * Lines draw themselves in once scrolled into view.
 */
export function BalanceChart({ series, corpusLabel, horizonMonths }: BalanceChartProps) {
  const maxValue = Math.max(1, ...series.map((p) => Math.max(p.mf, p.corpus, p.loan)));
  const mfPoints = toPoints(series, horizonMonths, maxValue, "mf");
  const corpusPoints = toPoints(series, horizonMonths, maxValue, "corpus");
  const loanPoints = toPoints(series, horizonMonths, maxValue, "loan");

  return (
    <GlassCard className="flex h-full flex-col p-[22px]">
      <div className="mb-1 font-heading text-[14px] font-bold text-ink">Balances over time</div>
      <div className="mb-4 text-[12px] text-ink-3">
        MF grows untouched · {corpusLabel.toLowerCase()} funds the EMI monthly · loan amortises
      </div>
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="none" className="min-h-[140px] w-full flex-1">
        <motion.polyline
          points={mfPoints}
          fill="none"
          stroke="var(--indigo)"
          strokeWidth={3}
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
        <motion.polyline
          points={corpusPoints}
          fill="none"
          stroke="var(--jade)"
          strokeWidth={3}
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
        />
        <motion.polyline
          points={loanPoints}
          fill="none"
          stroke="var(--ink-4)"
          strokeWidth={2}
          strokeDasharray="6,6"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
        />
      </svg>
      <div className="mt-2 flex flex-wrap gap-4">
        <LegendLine color="var(--indigo)" label="MF corpus" />
        <LegendLine color="var(--jade)" label={corpusLabel} />
        <LegendLine color="var(--ink-4)" label="Loan balance" />
      </div>
    </GlassCard>
  );
}

const EMI_BAR_COUNT = 12;

/**
 * "EMI breakup" — a plain CSS stacked-bar chart (12 bars, principal at the
 * bottom, interest on top), matching the spec exactly. Bars are sampled
 * evenly across the real amortization series rather than the spec's fixed
 * illustrative percentages. Bars grow from 0 once scrolled into view.
 */
export function AmortizationChart({ series }: { series: ChartPoint[] }) {
  const points = series.filter((p) => p.month > 0);
  const step = Math.max(1, Math.floor(points.length / EMI_BAR_COUNT));
  const bars = Array.from({ length: EMI_BAR_COUNT }, (_, i) => {
    const point = points[Math.min(points.length - 1, i * step)];
    const total = point.interest + point.principal;
    const principalPct = total > 0 ? (point.principal / total) * 100 : 0;
    return { principalPct, interestPct: 100 - principalPct };
  });

  return (
    <GlassCard className="flex h-full flex-col p-[22px]">
      <div className="mb-1 font-heading text-[14px] font-bold text-ink">EMI breakup</div>
      <div className="mb-4 text-[12px] text-ink-3">Interest vs. principal per payment</div>
      <div className="flex min-h-[140px] flex-1 items-end gap-[5px]">
        {bars.map((bar, i) => (
          <div key={i} className="flex h-full flex-1 flex-col-reverse overflow-hidden rounded-[3px]">
            <motion.div
              initial={{ height: "0%" }}
              whileInView={{ height: `${bar.principalPct}%` }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.04 }}
              className="bg-[var(--indigo)]"
            />
            <motion.div
              initial={{ height: "0%" }}
              whileInView={{ height: `${bar.interestPct}%` }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.04 }}
              className="bg-surface-2"
            />
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function LegendLine({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-3">
      <span className="inline-block h-[3px] w-4" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
