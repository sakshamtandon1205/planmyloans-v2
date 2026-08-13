import type { ReactNode } from "react";
import { formatINR, formatLakh } from "@/lib/format";
import { FundingModeToggle } from "./FundingModeToggle";
import { GlassCard } from "./GlassCard";
import { SliderField } from "./SliderField";
import type { CalculatorInputs } from "./calculatorTypes";

interface ControlPanelFieldsProps {
  inputs: CalculatorInputs;
  onInputChange: <K extends keyof CalculatorInputs>(key: K, value: CalculatorInputs[K]) => void;
  corpus: number;
  corpusLabel: string;
  displayHorizon: number;
  onHorizonChange: (value: number) => void;
}

/**
 * The actual input groups — property/funding, growth, loan/prepayment, tax,
 * horizon. Extracted from `ControlPanel` so both the desktop sidebar card
 * and the mobile bottom sheet (which each supply their own outer chrome)
 * can render the exact same live-bound fields rather than duplicating them.
 */
export function ControlPanelFields({
  inputs,
  onInputChange,
  corpus,
  corpusLabel,
  displayHorizon,
  onHorizonChange,
}: ControlPanelFieldsProps) {
  return (
    <>
      <Group icon={<HomeIcon />} title="Property & funding" defaultOpen>
        <SliderField
          label="Property price"
          value={inputs.price}
          min={5000000}
          max={200000000}
          step={100000}
          onChange={(v) => onInputChange("price", v)}
          formatValue={formatLakh}
        />
        <SliderField
          label="Own funds available"
          value={inputs.own}
          min={2000000}
          max={20000000}
          step={100000}
          onChange={(v) => onInputChange("own", v)}
          formatValue={formatLakh}
        />
        <SliderField
          label="Down payment"
          value={inputs.dp}
          min={500000}
          max={10000000}
          step={100000}
          onChange={(v) => onInputChange("dp", v)}
          formatValue={formatLakh}
        />
        <SliderField
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

      <Group icon={<TrendIcon />} title="Growth & EMI funding" defaultOpen>
        <SliderField
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
          <SliderField
            label="SWP expected return"
            value={inputs.swr}
            min={4}
            max={18}
            step={0.5}
            onChange={(v) => onInputChange("swr", v)}
            formatValue={(v) => `${v}%`}
          />
        ) : (
          <SliderField
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

      <Group icon={<BankIcon />} title="Loan & prepayment" defaultOpen>
        <SliderField
          label="Home loan interest"
          value={inputs.lr}
          min={6}
          max={13}
          step={0.05}
          onChange={(v) => onInputChange("lr", v)}
          formatValue={(v) => `${v}%`}
        />
        <SliderField
          label="Loan tenure"
          value={inputs.tenure}
          min={5}
          max={30}
          step={1}
          onChange={(v) => onInputChange("tenure", v)}
          formatValue={(v) => `${v} yrs`}
        />
        <SliderField
          label="Extra monthly prepay"
          value={inputs.extra}
          min={0}
          max={100000}
          step={1000}
          onChange={(v) => onInputChange("extra", v)}
          formatValue={(v) => (v > 0 ? `${formatINR(v)}/mo` : "none")}
          hint="Paid from salary straight onto principal, on top of the EMI. Separate from your corpus."
        />
        <SliderField
          label="Step up prepay yearly"
          value={inputs.stepup}
          min={0}
          max={25}
          step={1}
          onChange={(v) => onInputChange("stepup", v)}
          formatValue={(v) => (v > 0 ? `${v}%/yr` : "none")}
          hint="Prepay rises by this % each year on the loan anniversary. Mirrors an annual salary hike."
        />
        <SliderField
          label="Step up EMI yearly"
          value={inputs.stepupemi}
          min={0}
          max={25}
          step={1}
          onChange={(v) => onInputChange("stepupemi", v)}
          formatValue={(v) => (v > 0 ? `${v}%/yr` : "none")}
          hint="The EMI itself rises by this % each year on the anniversary, shortening the payoff. Separate from the extra prepay above."
        />
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-body-sm font-medium text-ink">Extra EMIs/year</div>
            <p className="mt-1 text-caption text-ink-3">
              N full EMIs paid as a lump sum every 12 months, on top of the extra prepay and step-up above.
            </p>
          </div>
          <div className="flex flex-none items-center gap-1.5">
            <button
              type="button"
              onClick={() => onInputChange("annualLumpSumCount", Math.max(0, inputs.annualLumpSumCount - 1))}
              aria-label="Decrease extra EMIs per year"
              className="hover-icon-btn flex size-7 items-center justify-center rounded-sm border border-line bg-surface-2 text-ink-2 transition-colors hover:bg-indigo-soft hover:text-indigo"
            >
              −
            </button>
            <span className="w-5 text-center font-mono text-mono-sm font-bold text-ink">
              {inputs.annualLumpSumCount}
            </span>
            <button
              type="button"
              onClick={() => onInputChange("annualLumpSumCount", Math.min(6, inputs.annualLumpSumCount + 1))}
              aria-label="Increase extra EMIs per year"
              className="hover-icon-btn flex size-7 items-center justify-center rounded-sm border border-line bg-surface-2 text-ink-2 transition-colors hover:bg-indigo-soft hover:text-indigo"
            >
              +
            </button>
          </div>
        </div>
      </Group>

      <Group icon={<ReceiptIcon />} title="Tax assumptions">
        {inputs.mode === "swp" && (
          <SliderField
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
        <SliderField
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

      <Group icon={<ClockIcon />} title="Time horizon" defaultOpen last>
        <SliderField
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
    </>
  );
}

interface ControlPanelProps extends ControlPanelFieldsProps {
  onReset: () => void;
}

/** Desktop sidebar chrome around ControlPanelFields — a glass card with a "Your inputs" header + Reset. */
export function ControlPanel({ onReset, ...fields }: ControlPanelProps) {
  return (
    <GlassCard>
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="font-heading text-h3 text-ink">Your inputs</h2>
        <button
          type="button"
          onClick={onReset}
          className="hover-cta-secondary rounded-sm border border-line bg-surface-2 px-3 py-1.5 text-body-sm font-medium text-ink-2 transition-colors hover:bg-indigo-soft hover:text-indigo"
        >
          Reset
        </button>
      </div>
      <ControlPanelFields {...fields} />
    </GlassCard>
  );
}

function Group({
  icon,
  title,
  defaultOpen,
  last,
  children,
}: {
  icon: ReactNode;
  title: string;
  defaultOpen?: boolean;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={defaultOpen} className={`group ${last ? "" : "border-b border-line"}`}>
      <summary className="flex cursor-pointer list-none items-center gap-2.5 px-5 py-3.5 text-body-sm font-semibold text-ink transition-colors hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
        <span className="flex size-[26px] flex-none items-center justify-center rounded-sm bg-indigo-soft text-indigo">
          {icon}
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

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  className: "size-3.5",
} as const;

function HomeIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  );
}

function BankIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 10l9-6 9 6" />
      <path d="M5 10v9M10 10v9M14 10v9M19 10v9" />
      <path d="M3 21h18" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg {...iconProps}>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
