"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { generateAmortizationSchedule } from "@/lib/calculations/emi";
import { formatINR, formatLakh } from "@/lib/format";
import { useCountUp } from "@/lib/useCountUp";
import { useDraftNumberInput } from "@/lib/useDraftNumberInput";
import { useSharedInputsStore } from "@/lib/sharedInputsStore";
import { useThrottledRangeInput } from "@/lib/useThrottledRangeInput";
import { PrincipalInterestBar } from "./PrincipalInterestBar";

const LOAN_MIN = 1000000; // 10L
const LOAN_MAX = 50000000; // 5Cr
const LOAN_STEP = 100000;

/** label + right-aligned editable number + unit suffix, with a gradient-fill range below. */
function EstimateRow({
  label,
  hint,
  value,
  min,
  max,
  step,
  onChange,
  inputValue,
  inputStep,
  suffix,
  onInputChange,
}: {
  label: string;
  /** Small formatted readout next to the label (e.g. "1.40 Cr") for a field whose exact-value box takes raw units. */
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  inputValue: number;
  inputStep: number;
  suffix: string;
  onInputChange: (raw: number) => void;
}) {
  // Same effective-range-expansion approach as SliderField: the number
  // input is the source of truth and is never clamped mid-typing (fighting
  // a user/test typing digit-by-digit is what previously turned "12" into
  // "30" — the first "1" would clamp to the min, then "2" appended to the
  // clamped display). The range's own visible bounds grow to keep the
  // thumb valid instead.
  const { displayValue, handleChange } = useThrottledRangeInput(value, onChange);
  const effectiveMin = Math.min(min, displayValue);
  const effectiveMax = Math.max(max, displayValue);
  const pct = effectiveMax > effectiveMin ? ((displayValue - effectiveMin) / (effectiveMax - effectiveMin)) * 100 : 0;
  const numberInput = useDraftNumberInput(inputValue, onInputChange);

  return (
    <div className="mb-[15px]">
      <div className="mb-[7px] flex items-center justify-between">
        <span className="text-[13.5px] font-semibold text-ink-2">
          {label}
          {hint && <span className="ml-1.5 font-mono text-[11.5px] font-medium text-ink-3">{hint}</span>}
        </span>
        <div className="flex items-center gap-[5px]">
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
            step={inputStep}
            onFocus={() => numberInput.onFocus()}
            onChange={(e) => numberInput.onChange(e.target.value)}
            onBlur={() => numberInput.onBlur()}
            className="w-[92px] rounded-xs border border-line-2 bg-surface-2 px-1.5 py-1 text-right font-mono text-[13px] font-semibold text-ink focus:border-indigo focus:outline-none"
          />
          <span className="text-[12px] font-semibold text-ink-3">{suffix}</span>
        </div>
      </div>
      <input
        type="range"
        aria-label={label}
        min={effectiveMin}
        max={effectiveMax}
        step={step}
        value={displayValue}
        onChange={(e) => handleChange(+e.target.value)}
        style={{ background: `linear-gradient(90deg, var(--indigo) ${pct}%, var(--surface-2) ${pct}%)` }}
        className="h-1.5 w-full"
      />
    </div>
  );
}

export function QuickEstimate() {
  const loanAmount = useSharedInputsStore((s) => s.loanAmount);
  const rate = useSharedInputsStore((s) => s.rate);
  const tenure = useSharedInputsStore((s) => s.tenure);
  const extraPrepayment = useSharedInputsStore((s) => s.extraPrepayment);
  const prepayStepUpPercent = useSharedInputsStore((s) => s.prepayStepUpPercent);
  const emiStepUpPercent = useSharedInputsStore((s) => s.emiStepUpPercent);
  const setLoanAmount = useSharedInputsStore((s) => s.setLoanAmount);
  const setRate = useSharedInputsStore((s) => s.setRate);
  const setTenure = useSharedInputsStore((s) => s.setTenure);

  const hasPrepayPlan = extraPrepayment > 0 || prepayStepUpPercent > 0 || emiStepUpPercent > 0;

  // Same function the full Planner uses for its "Total interest paid" card,
  // fed the same prepayment/step-up state (shared via the store) — so these
  // numbers are always the Planner's real, current numbers, not a
  // simplified baseline that silently drifts once prepayment is configured.
  const { emi, totalInterest } = useMemo(() => {
    const tenureMonths = tenure * 12;
    const amortization = generateAmortizationSchedule({
      principal: loanAmount,
      annualRatePercent: rate,
      tenureMonths,
      extraMonthlyPrepayment: extraPrepayment,
      annualPrepayStepUpPercent: prepayStepUpPercent,
      annualEmiStepUpPercent: emiStepUpPercent,
    });
    // amortization.emi is the original/starting EMI (pre-step-up) — the
    // Planner's own "Monthly EMI" card shows this same starting figure.
    return { emi: amortization.emi, totalInterest: amortization.totalInterestPaid };
  }, [loanAmount, rate, tenure, extraPrepayment, prepayStepUpPercent, emiStepUpPercent]);

  const displayEmi = useCountUp(emi);

  return (
    <div className="glass-panel p-6">
      <div className="mb-4 text-[12px] font-bold uppercase tracking-[.06em] text-ink-3">Quick estimate</div>

      <EstimateRow
        label="Loan amount"
        hint={formatLakh(loanAmount)}
        value={loanAmount}
        min={LOAN_MIN}
        max={LOAN_MAX}
        step={LOAN_STEP}
        onChange={setLoanAmount}
        inputValue={loanAmount}
        inputStep={LOAN_STEP}
        suffix=""
        onInputChange={(raw) => setLoanAmount(Math.max(0, raw))}
      />
      <EstimateRow
        label="Interest rate"
        value={rate}
        min={5}
        max={15}
        step={0.1}
        onChange={setRate}
        inputValue={rate}
        inputStep={0.1}
        suffix="%"
        onInputChange={setRate}
      />
      <EstimateRow
        label="Tenure"
        value={tenure}
        min={5}
        max={30}
        step={1}
        onChange={setTenure}
        inputValue={tenure}
        inputStep={1}
        suffix="yrs"
        onInputChange={setTenure}
      />

      <div className="my-[18px] flex gap-3.5 border-y border-line-2 py-[18px]">
        <div className="flex-1">
          <div className="text-[11.5px] font-semibold text-ink-3">Monthly EMI</div>
          <motion.div data-testid="quick-emi" className="break-words font-mono text-[25px] font-bold text-accent-text">
            {formatINR(displayEmi)}
          </motion.div>
        </div>
        <div className="w-px bg-line-2" />
        <div className="flex-1">
          <div className="text-[11.5px] font-semibold text-ink-3">Total interest</div>
          <div data-testid="quick-total-interest" className="break-words font-mono text-[25px] font-bold text-ink">
            ₹{formatLakh(totalInterest)}
          </div>
        </div>
      </div>

      <PrincipalInterestBar principal={loanAmount} interest={totalInterest} />

      <p className="mt-5 text-caption text-ink-3">
        {hasPrepayPlan
          ? "Includes your prepayment plan set below — see the full planner for the tax and payoff-time impact."
          : "Simple estimate — see the full planner below for prepayment savings and tax impact."}
      </p>
    </div>
  );
}
