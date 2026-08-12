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
      className: "bg-[repeating-linear-gradient(135deg,var(--surface-2)_0,var(--surface-2)_8px,var(--line)_8px,var(--line)_16px)] text-ink",
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
                  the label is hidden outright and the text summary row below
                  (plus the color-coded legend) carries identification
                  instead. Driven by a container query keyed to the
                  segment's OWN rendered box (not the viewport), so this
                  responds correctly to any combination of viewport width
                  and segment proportion, unlike a percentage-of-parent
                  guess. The "Home loan" segment's label gets a translucent
                  solid backing (below) since its striped background alone
                  doesn't give text enough contrast in either theme. */}
              <span
                className={`hidden truncate text-label font-semibold normal-case @min-[76px]/segment:block ${s.key === "loan" ? "w-fit rounded-xs bg-surface/75 px-1 font-bold" : ""}`}
              >
                {s.label}
              </span>
              <span
                className={`hidden truncate font-mono text-mono-sm font-bold @min-[76px]/segment:block ${s.key === "loan" ? "w-fit rounded-xs bg-surface/75 px-1" : ""}`}
              >
                {formatLakh(s.value)}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Explicit text values for all 4 figures, shown at every viewport
          width — the bar's own segment labels hide below ~76px of rendered
          width (see above), which on a narrow phone screen can hide the
          SWP/bank corpus value entirely if its share is small. This row is
          the fallback source of truth a user can always read, regardless
          of how narrow any single segment renders. */}
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
