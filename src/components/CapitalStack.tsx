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
  label: string;
  value: number;
  className: string;
}

export function CapitalStack({ price, downPayment, mfLumpsum, corpus, loan, corpusLabel }: CapitalStackProps) {
  const segments: Segment[] = [
    { key: "dp", label: "Down payment", value: downPayment, className: "bg-indigo-solid text-white" },
    { key: "mf", label: "MF lumpsum", value: mfLumpsum, className: "bg-jade-solid text-white" },
    { key: "corpus", label: corpusLabel, value: corpus, className: "bg-jade-soft text-jade" },
    {
      key: "loan",
      label: "Home loan",
      value: loan,
      className: "bg-[repeating-linear-gradient(135deg,var(--surface-2)_0,var(--surface-2)_8px,var(--line)_8px,var(--line)_16px)] text-ink-2",
    },
  ];

  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <span className="font-heading text-h3 text-ink">Capital stack</span>
        <span className="text-body-sm font-semibold text-ink-2">Total {formatLakh(price)}</span>
      </div>

      <div className="flex h-[52px] overflow-hidden rounded">
        {segments.map((s, i) => {
          const pct = price > 0 ? (s.value / price) * 100 : 0;
          return (
            <motion.div
              key={s.key}
              initial={{ width: "0%" }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.1 }}
              className={`@container/segment flex flex-col justify-center overflow-hidden whitespace-nowrap px-3 ${s.className}`}
            >
              {/* Below ~76px of actual rendered width, "Down payment" / "MF
                  lumpsum" etc. can't fit legibly even truncated to 1
                  character — so instead of clipping to an unreadable sliver,
                  the label is hidden outright and the color-coded legend
                  below the bar carries identification instead. Driven by a
                  container query keyed to the segment's OWN rendered box
                  (not the viewport), so this responds correctly to any
                  combination of viewport width and segment proportion,
                  unlike a percentage-of-parent guess. */}
              <span className="hidden truncate text-label font-semibold normal-case @min-[76px]/segment:block">
                {s.label}
              </span>
              <span className="hidden truncate font-mono text-mono-sm font-bold @min-[76px]/segment:block">
                {formatLakh(s.value)}
              </span>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-3.5 flex flex-wrap gap-5 text-body-sm text-ink-2">
        <LegendDot className="bg-indigo-solid" label="Down payment" />
        <LegendDot className="bg-jade-solid" label="Mutual fund lumpsum" />
        <LegendDot className="bg-jade-soft" label={corpusLabel} />
        <LegendDot className="bg-line-2" label="Home loan" />
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
