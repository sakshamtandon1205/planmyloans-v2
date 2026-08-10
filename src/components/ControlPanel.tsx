import type { ReactNode } from "react";
import { formatINR, formatLakh } from "@/lib/format";
import { FundingModeToggle } from "./FundingModeToggle";
import type { CalculatorInputs } from "./calculatorTypes";

interface ControlPanelProps {
  inputs: CalculatorInputs;
  onInputChange: <K extends keyof CalculatorInputs>(key: K, value: CalculatorInputs[K]) => void;
  corpus: number;
  corpusLabel: string;
  displayHorizon: number;
  onHorizonChange: (value: number) => void;
  onReset: () => void;
}

export function ControlPanel({
  inputs,
  onInputChange,
  corpus,
  corpusLabel,
  displayHorizon,
  onHorizonChange,
  onReset,
}: ControlPanelProps) {
  return (
    <div className="rounded-lg border border-line bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="font-heading text-h3 text-ink">Your inputs</h2>
        <button
          type="button"
          onClick={onReset}
          className="rounded-sm border border-line bg-surface-2 px-3 py-1.5 text-body-sm font-medium text-ink-2 transition-colors hover:border-indigo hover:bg-indigo-soft hover:text-indigo"
        >
          Reset
        </button>
      </div>

      <Group number={1} title="Property & funding" defaultOpen>
        <NumericSliderField
          label="Property price"
          value={inputs.price}
          min={5000000}
          max={50000000}
          step={100000}
          onChange={(v) => onInputChange("price", v)}
          formatValue={formatLakh}
        />
        <NumericSliderField
          label="Own funds available"
          value={inputs.own}
          min={2000000}
          max={20000000}
          step={100000}
          onChange={(v) => onInputChange("own", v)}
          formatValue={formatLakh}
        />
        <NumericSliderField
          label="Down payment"
          value={inputs.dp}
          min={500000}
          max={10000000}
          step={100000}
          onChange={(v) => onInputChange("dp", v)}
          formatValue={formatLakh}
        />
        <NumericSliderField
          label="MF lumpsum"
          value={inputs.mf}
          min={0}
          max={10000000}
          step={100000}
          onChange={(v) => onInputChange("mf", v)}
          formatValue={formatLakh}
        />
        <div>
          <div className="mb-2 flex items-center justify-between gap-2 text-body-sm text-ink-2">
            <span>{corpusLabel}</span>
            <span className="font-mono text-mono-sm font-bold text-ink">{formatLakh(corpus)}</span>
          </div>
          <p className="text-caption text-ink-3">Set automatically: own funds − down payment − MF lumpsum.</p>
        </div>
      </Group>

      <Group number={2} title="Growth & EMI funding" defaultOpen>
        <NumericSliderField
          label="MF expected return"
          value={inputs.mfr}
          min={4}
          max={20}
          step={0.5}
          onChange={(v) => onInputChange("mfr", v)}
          formatValue={(v) => `${v}%`}
        />
        <div className="mb-4">
          <label className="mb-2 block text-body-sm text-ink-2">Fund the EMI from</label>
          <FundingModeToggle mode={inputs.mode} onChange={(m) => onInputChange("mode", m)} />
        </div>
        {inputs.mode === "swp" ? (
          <NumericSliderField
            label="SWP expected return"
            value={inputs.swr}
            min={4}
            max={18}
            step={0.5}
            onChange={(v) => onInputChange("swr", v)}
            formatValue={(v) => `${v}%`}
          />
        ) : (
          <NumericSliderField
            label="Bank interest rate"
            value={inputs.bankr}
            min={2}
            max={9}
            step={0.05}
            onChange={(v) => onInputChange("bankr", v)}
            formatValue={(v) => `${v}%`}
            hint="Deposit insurance (DICGC) covers only ₹5L per bank. Split larger balances across banks to stay insured."
          />
        )}
      </Group>

      <Group number={3} title="Loan & prepayment" defaultOpen>
        <NumericSliderField
          label="Home loan interest"
          value={inputs.lr}
          min={6}
          max={13}
          step={0.05}
          onChange={(v) => onInputChange("lr", v)}
          formatValue={(v) => `${v}%`}
        />
        <NumericSliderField
          label="Loan tenure"
          value={inputs.tenure}
          min={5}
          max={30}
          step={1}
          onChange={(v) => onInputChange("tenure", v)}
          formatValue={(v) => `${v} yrs`}
        />
        <NumericSliderField
          label="Extra monthly prepay"
          value={inputs.extra}
          min={0}
          max={100000}
          step={1000}
          onChange={(v) => onInputChange("extra", v)}
          formatValue={(v) => (v > 0 ? `${formatINR(v)}/mo` : "none")}
          hint="Paid from salary straight onto principal, on top of the EMI. Separate from your corpus."
        />
        <NumericSliderField
          label="Step up prepay yearly"
          value={inputs.stepup}
          min={0}
          max={25}
          step={1}
          onChange={(v) => onInputChange("stepup", v)}
          formatValue={(v) => (v > 0 ? `${v}%/yr` : "none")}
          hint="Prepay rises by this % each year on the loan anniversary. Mirrors an annual salary hike."
        />
        <NumericSliderField
          label="Step up EMI yearly"
          value={inputs.stepupemi}
          min={0}
          max={25}
          step={1}
          onChange={(v) => onInputChange("stepupemi", v)}
          formatValue={(v) => (v > 0 ? `${v}%/yr` : "none")}
          hint="The EMI itself rises by this % each year on the anniversary, shortening the payoff. Separate from the extra prepay above."
        />
      </Group>

      <Group number={4} title="Tax assumptions">
        {inputs.mode === "swp" && (
          <NumericSliderField
            label="SWP capital gains tax"
            value={inputs.swptax}
            min={0}
            max={30}
            step={0.5}
            onChange={(v) => onInputChange("swptax", v)}
            formatValue={(v) => `${v}%`}
            tip="Approx. equity LTCG rate, applied only to the gains portion of each withdrawal. The annual ₹1.25L exemption is ignored here for simplicity."
          />
        )}
        <NumericSliderField
          label="Marginal income tax rate"
          value={inputs.taxrate}
          min={0}
          max={42.7}
          step={0.5}
          onChange={(v) => onInputChange("taxrate", v)}
          formatValue={(v) => `${v}%`}
          tip="Values the Sec 24(b) interest and 80C principal deductions on the loan. In bank mode, taxes interest fully as it accrues."
        />
      </Group>

      <Group number={5} title="Time horizon" defaultOpen last>
        <NumericSliderField
          label="View results after"
          value={displayHorizon}
          min={1}
          max={30}
          step={1}
          onChange={onHorizonChange}
          formatValue={(v) => `${v} yrs`}
          hint="Follows the loan's payoff automatically. Drag it yourself to look further out."
        />
      </Group>
    </div>
  );
}

function Group({
  number,
  title,
  defaultOpen,
  last,
  children,
}: {
  number: number;
  title: string;
  defaultOpen?: boolean;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={defaultOpen} className={`group ${last ? "" : "border-b border-line"}`}>
      <summary className="flex cursor-pointer list-none items-center gap-2.5 px-5 py-3.5 text-body-sm font-semibold text-ink transition-colors hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
        <span className="flex size-[22px] flex-none items-center justify-center rounded-sm bg-indigo-soft font-mono text-mono-sm font-bold text-indigo">
          {number}
        </span>
        {title}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          className="ml-auto size-4 text-ink-3 transition-transform group-open:rotate-180"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <div className="space-y-4 px-5 pb-5">{children}</div>
    </details>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function NumericSliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue,
  hint,
  tip,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatValue: (value: number) => string;
  hint?: string;
  tip?: string;
}) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;

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
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(+e.target.value)}
          style={{ background: `linear-gradient(90deg, var(--indigo) ${pct}%, var(--surface-2) ${pct}%)` }}
          className="h-1.5 min-w-[80px] flex-1 basis-[140px]"
        />
        <input
          type="number"
          aria-label={`${label} (exact value)`}
          value={value}
          step={step}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") return;
            onChange(clamp(+raw, min, max));
          }}
          className="w-[92px] flex-none rounded-sm border border-line-2 bg-surface px-2 py-1.5 font-mono text-mono-sm font-semibold text-ink focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo-soft"
        />
      </div>
      {hint && <p className="mt-2 text-caption text-ink-3">{hint}</p>}
    </div>
  );
}

function InfoTip({ text }: { text: string }) {
  return (
    <span className="group/tip relative inline-flex size-4 cursor-help items-center justify-center rounded-full border border-line-2 bg-indigo-soft text-caption leading-none font-bold text-indigo">
      ?
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded border border-line-2 bg-ink px-3 py-2 text-caption leading-normal font-normal text-paper opacity-0 shadow transition-opacity group-hover/tip:opacity-100">
        {text}
      </span>
    </span>
  );
}
