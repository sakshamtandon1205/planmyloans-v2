import { motion } from "framer-motion";
import { formatLakh } from "@/lib/format";
import { GlassCard } from "./GlassCard";

interface CapitalStackProps {
  price: number;
  downPayment: number;
  mfLumpsum: number;
  corpus: number;
  loan: number;
  corpusLabel: string;
}

interface Segment {
  key: string;
  value: number;
  className: string;
}

export function CapitalStack({ price, downPayment, mfLumpsum, corpus, loan, corpusLabel }: CapitalStackProps) {
  const segments: Segment[] = [
    { key: "dp", value: downPayment, className: "bg-surface-2" },
    { key: "mf", value: mfLumpsum, className: "bg-jade" },
    { key: "corpus", value: corpus, className: "bg-jade-light" },
    { key: "loan", value: loan, className: "bg-[linear-gradient(90deg,var(--indigo),var(--indigo-dark))]" },
  ];

  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <span className="font-heading text-h3 text-ink">Capital stack</span>
        <span className="text-body-sm font-semibold text-ink-2">Total {formatLakh(price)}</span>
      </div>

      {/* Plain color segments, no inline text — matches the design spec's
          bars exactly (a colored rectangle, nothing drawn on top of it).
          The summary row and legend below are the only place these figures
          are labeled, which also sidesteps ever needing to pick a text
          color that stays legible against a live, values-driven fill. */}
      <div className="flex h-[34px] overflow-hidden rounded-[9px]">
        {segments.map((s, i) => {
          const pct = price > 0 ? (s.value / price) * 100 : 0;
          return (
            <motion.div
              key={s.key}
              initial={{ width: "0%" }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4, ease: "easeOut", delay: i * 0.05 }}
              className={s.className}
            />
          );
        })}
      </div>

      {/* Explicit text values for all 4 figures, shown at every viewport
          width, since the bar itself carries no text — this row (plus the
          legend below) is the only place a user reads the real numbers. */}
      <p
        data-testid="capital-stack-summary"
        className="mt-3.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-1 font-mono text-mono-sm font-semibold text-ink-2"
      >
        <span>Down payment {formatLakh(downPayment)}</span>
        <span aria-hidden className="text-ink-3">·</span>
        <span>MF {formatLakh(mfLumpsum)}</span>
        <span aria-hidden className="text-ink-3">·</span>
        <span>
          {corpusLabel} {formatLakh(corpus)}
        </span>
        <span aria-hidden className="text-ink-3">·</span>
        <span>Loan {formatLakh(loan)}</span>
      </p>

      <div className="mt-3 flex flex-wrap gap-5 text-body-sm text-ink-2">
        <LegendDot className="bg-surface-2" label="Down payment" />
        <LegendDot className="bg-jade" label="Mutual fund lumpsum" />
        <LegendDot className="bg-jade-light" label={corpusLabel} />
        <LegendDot className="bg-indigo" label="Home loan" />
      </div>
    </GlassCard>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <i className={`inline-block size-2.5 rounded-sm ${className}`} />
      {label}
    </span>
  );
}
