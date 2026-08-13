import { useDraftNumberInput } from "@/lib/useDraftNumberInput";

interface InfoTipProps {
  text: string;
}

function InfoTip({ text }: InfoTipProps) {
  return (
    <span className="group/tip relative inline-flex size-4 cursor-help items-center justify-center rounded-full border border-line-2 bg-indigo-soft text-caption leading-none font-bold text-indigo">
      ?
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded border border-line-2 bg-ink px-3 py-2 text-caption leading-normal font-normal text-paper opacity-0 shadow transition-opacity group-hover/tip:opacity-100">
        {text}
      </span>
    </span>
  );
}

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatValue: (value: number) => string;
  hint?: string;
  tip?: string;
}

/**
 * Paired range slider + number input. The number input is the source of
 * truth: typing a value outside [min, max] is honored as-is (never clamped
 * back), and the slider's own visible range grows to keep the thumb valid
 * rather than pinning it to an end-stop — symmetrically in both directions,
 * since a typed value can fall on either side of the configured range.
 */
export function SliderField({ label, value, min, max, step, onChange, formatValue, hint, tip }: SliderFieldProps) {
  const effectiveMin = Math.min(min, value);
  const effectiveMax = Math.max(max, value);
  const pct = effectiveMax > effectiveMin ? ((value - effectiveMin) / (effectiveMax - effectiveMin)) * 100 : 0;
  const numberInput = useDraftNumberInput(value, onChange);

  return (
    <div>
      <label className="mb-2 flex items-center justify-between gap-2 text-body-sm text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          {label}
          {tip && <InfoTip text={tip} />}
        </span>
        <b className="font-mono text-mono-sm font-bold text-ink">{formatValue(value)}</b>
      </label>
      <div className="flex flex-wrap items-center gap-2.5">
        <input
          type="range"
          aria-label={label}
          min={effectiveMin}
          max={effectiveMax}
          step={step}
          value={value}
          onChange={(e) => onChange(+e.target.value)}
          style={{ background: `linear-gradient(90deg, var(--indigo) ${pct}%, var(--surface-2) ${pct}%)` }}
          className="h-1.5 min-w-[80px] flex-1 basis-[140px]"
        />
        {/* useDraftNumberInput hands back plain functions that close over a ref
            internally (see its doc comment) — only ever called from these event
            handlers, never dereferenced during render — but the react-compiler
            lint can't see through that indirection, hence the disables below. */}
        <input
          type="number"
          inputMode="decimal"
          aria-label={`${label} (exact value)`}
          // eslint-disable-next-line react-hooks/refs
          ref={numberInput.ref}
          // eslint-disable-next-line react-hooks/refs
          defaultValue={numberInput.defaultValue}
          step={step}
          onFocus={(e) => numberInput.onFocus(e)}
          onChange={(e) => numberInput.onChange(e.target.value)}
          onBlur={(e) => numberInput.onBlur(e)}
          className="w-[92px] flex-none rounded-sm border border-line-2 bg-surface px-2 py-1.5 font-mono text-mono-sm font-semibold text-ink focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo-soft"
        />
      </div>
      {hint && <p className="mt-2 text-caption text-ink-3">{hint}</p>}
    </div>
  );
}
