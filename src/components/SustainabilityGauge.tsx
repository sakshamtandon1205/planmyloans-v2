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

  const warnText = isRisky ? (
    <>
      <b className="text-amber">{corpusLabel} runs dry.</b> The EMI draws about {annualWithdrawRate.toFixed(1)}
      %/year from a {formatLakh(corpus)} corpus, against a {returnPct.toFixed(1)}% return.{" "}
      {depletedAtMonth !== null
        ? `It hits zero around month ${depletedAtMonth} (year ${(depletedAtMonth / 12).toFixed(1)}), before the loan is repaid (payoff at ${payoffYears.toFixed(1)} yrs). The EMI must come from other income after that.`
        : "The draw outpaces growth, so the corpus shrinks over time. Set aside more, lower the EMI, or fund part of it from salary."}
    </>
  ) : null;

  const okText = !isRisky ? (
    <>
      <b className="text-jade">{corpusLabel} holds up.</b> At {annualWithdrawRate.toFixed(1)}%/year drawn against a{" "}
      {returnPct.toFixed(1)}% return, it funds every EMI and still closes at {formatINR(Math.max(0, finalBalance))}.
    </>
  ) : null;

  const tone = isRisky
    ? { border: "border-amber/40", bg: "bg-amber-soft/75 dark:bg-amber-soft/65", text: "text-ink", fill: "bg-amber" }
    : { border: "border-jade/40", bg: "bg-jade-soft/75 dark:bg-jade-soft/65", text: "text-ink", fill: "bg-jade" };

  return (
    <div
      className={`flex gap-4 rounded-lg border ${tone.border} ${tone.bg} p-5 shadow-sm backdrop-blur-[14px] [-webkit-backdrop-filter:blur(14px)]`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className={`mt-0.5 size-8 flex-none ${isRisky ? "text-amber" : "text-jade"}`}
      >
        {isRisky ? (
          <>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <path d="M12 9v4M12 17h.01" />
          </>
        ) : (
          <>
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <path d="M22 4L12 14.01l-3-3" />
          </>
        )}
      </svg>

      <div className="flex-1">
        <p className={`text-body leading-relaxed ${tone.text}`}>{isRisky ? warnText : okText}</p>

        <div className="mt-4">
          <div className="h-3 overflow-hidden rounded-full bg-ink/[0.07] shadow-inner">
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
