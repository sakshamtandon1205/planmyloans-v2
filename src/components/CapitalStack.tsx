import { formatLakh } from "@/lib/format";

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

const MIN_LABEL_PERCENT = 9;

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
    <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-baseline justify-between">
        <span className="font-heading text-h3 text-ink">Capital stack</span>
        <span className="text-body-sm font-semibold text-ink-2">Total {formatLakh(price)}</span>
      </div>

      <div className="flex h-[52px] overflow-hidden rounded">
        {segments.map((s) => {
          const pct = price > 0 ? (s.value / price) * 100 : 0;
          return (
            <div
              key={s.key}
              style={{ width: `${pct}%` }}
              className={`flex flex-col justify-center overflow-hidden whitespace-nowrap px-3 ${s.className}`}
            >
              {pct > MIN_LABEL_PERCENT && (
                <>
                  <span className="truncate text-label font-semibold normal-case">{s.label}</span>
                  <span className="truncate font-mono text-mono-sm font-bold">{formatLakh(s.value)}</span>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3.5 flex flex-wrap gap-5 text-body-sm text-ink-2">
        <LegendDot className="bg-indigo-solid" label="Down payment" />
        <LegendDot className="bg-jade-solid" label="Mutual fund lumpsum" />
        <LegendDot className="bg-jade-soft" label={corpusLabel} />
        <LegendDot className="bg-line-2" label="Home loan" />
      </div>
    </div>
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
