import { motion } from "framer-motion";
import { formatINR, formatLakh } from "@/lib/format";

interface SustainabilityGaugeProps {
  isRisky: boolean;
  corpusLabel: string;
  corpus: number;
  annualWithdrawRate: number;
  returnPct: number;
  gaugePct: number;
  depletedAtMonth: number | null;
  payoffYears: number;
  finalBalance: number;
}

/**
 * The planner's warning callout — matches the design spec's SWP-depletion
 * card (amber dot + bold headline + prose) when risky, and a calmer jade
 * equivalent when the corpus holds up. Below the prose, an animated gauge
 * bar still shows drawn-vs-earned at a glance.
 */
export function SustainabilityGauge({
  isRisky,
  corpusLabel,
  corpus,
  annualWithdrawRate,
  returnPct,
  gaugePct,
  depletedAtMonth,
  payoffYears,
  finalBalance,
}: SustainabilityGaugeProps) {
  const gaugeLabel = `${annualWithdrawRate.toFixed(1)}% drawn vs ${returnPct.toFixed(1)}% earned`;

  const headline = isRisky ? `${corpusLabel} runs dry` : `${corpusLabel} holds up`;
  const body = isRisky ? (
    <>
      Draws ~{annualWithdrawRate.toFixed(1)}%/yr from a {formatLakh(corpus)} corpus against a {returnPct.toFixed(1)}%
      return.{" "}
      {depletedAtMonth !== null
        ? `Hits zero around month ${depletedAtMonth} (year ${(depletedAtMonth / 12).toFixed(1)}), before the loan is repaid at ${payoffYears.toFixed(1)} yrs. The EMI must come from other income after that.`
        : "The draw outpaces growth, so the corpus shrinks over time. Set aside more, lower the EMI, or fund part of it from salary."}
    </>
  ) : (
    <>
      At {annualWithdrawRate.toFixed(1)}%/yr drawn against a {returnPct.toFixed(1)}% return, it funds every EMI and
      still closes at {formatINR(Math.max(0, finalBalance))}.
    </>
  );

  const tone = isRisky
    ? { bg: "var(--warn-bg)", borderColor: "var(--warn-border)", text: "text-warn-text", textMuted: "text-warn-text-muted", dot: "bg-warn-dot", fill: "bg-warn-dot" }
    : { bg: "var(--jade-soft)", borderColor: "var(--jade)", text: "text-jade", textMuted: "text-ink-2", dot: "bg-jade", fill: "bg-jade" };

  return (
    <div
      style={{ borderColor: tone.borderColor, background: tone.bg }}
      className="glass-panel-sm flex gap-2.5 rounded-[13px] p-[15px]"
    >
      <div className={`mt-0.5 flex size-5 flex-none items-center justify-center rounded-full font-heading text-[12px] font-bold text-paper ${tone.dot}`}>
        !
      </div>
      <div className="flex-1">
        <div className={`mb-[3px] font-heading text-[13.5px] font-bold ${tone.text}`}>{headline}</div>
        <p className={`text-[12.5px] leading-[1.5] ${tone.textMuted}`}>{body}</p>

        <div className="mt-3.5">
          <div className="h-2.5 overflow-hidden rounded-full bg-ink/[0.07] shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, gaugePct))}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={`h-full rounded-full ${tone.fill}`}
            />
          </div>
          <div className="mt-2 flex flex-wrap justify-between gap-x-2.5 gap-y-0.5 font-mono text-mono-sm text-ink-2">
            <span>sustainable</span>
            <span className="order-3 flex-1 basis-full text-center sm:order-none sm:basis-auto">{gaugeLabel}</span>
            <span>draining fast</span>
          </div>
        </div>
      </div>
    </div>
  );
}
