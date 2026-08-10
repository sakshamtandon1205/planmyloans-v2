"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { calculateBaselineInterest, calculateEmi } from "@/lib/calculations/emi";
import { formatINR } from "@/lib/format";
import { useSharedInputsStore } from "@/lib/sharedInputsStore";
import { GlassCard } from "./GlassCard";
import { PrincipalInterestBar } from "./PrincipalInterestBar";
import { SliderField } from "./SliderField";

/** Smoothly counts a displayed number toward `value` instead of jumping on every keystroke/slider tick. */
function useCountUp(value: number) {
  const motionValue = useMotionValue(value);
  // Stiff and fast: a big jump (e.g. typing a whole new loan amount) should
  // read as "already updated" within a couple hundred ms, not visibly lag
  // behind the rest of the page while it counts up.
  const spring = useSpring(motionValue, { stiffness: 400, damping: 40, mass: 0.5 });
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => spring.on("change", (v) => setDisplay(v)), [spring]);

  return display;
}

export function QuickEstimate() {
  const loanAmount = useSharedInputsStore((s) => s.loanAmount);
  const rate = useSharedInputsStore((s) => s.rate);
  const tenure = useSharedInputsStore((s) => s.tenure);
  const setLoanAmount = useSharedInputsStore((s) => s.setLoanAmount);
  const setRate = useSharedInputsStore((s) => s.setRate);
  const setTenure = useSharedInputsStore((s) => s.setTenure);

  const { emi, totalInterest, totalPayable } = useMemo(() => {
    const tenureMonths = tenure * 12;
    const emi = calculateEmi({ principal: loanAmount, annualRatePercent: rate, tenureMonths });
    const totalInterest = calculateBaselineInterest(loanAmount, emi, tenureMonths);
    return { emi, totalInterest, totalPayable: loanAmount + totalInterest };
  }, [loanAmount, rate, tenure]);

  const displayEmi = useCountUp(emi);

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-10">
      <GlassCard className="p-5 sm:p-7">
        <h2 className="mb-5 font-heading text-h3 text-ink">Quick estimate</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SliderField
            label="Loan amount"
            value={loanAmount}
            min={500000}
            max={100000000}
            step={100000}
            onChange={setLoanAmount}
            formatValue={(v) => formatINR(v)}
          />
          <SliderField
            label="Interest rate"
            value={rate}
            min={6}
            max={13}
            step={0.05}
            onChange={setRate}
            formatValue={(v) => `${v}%`}
          />
          <SliderField
            label="Tenure"
            value={tenure}
            min={5}
            max={30}
            step={1}
            onChange={setTenure}
            formatValue={(v) => `${v} yrs`}
          />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 border-t border-line pt-8 sm:grid-cols-[auto_1fr] sm:items-end">
          <div className="relative min-w-0">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-6 -inset-y-8 -z-10 rounded-full opacity-70 blur-3xl"
              style={{ background: "radial-gradient(circle, var(--indigo) 0%, transparent 65%)" }}
            />
            <div className="mb-1.5 text-label uppercase text-ink-3">Monthly EMI</div>
            <motion.div
              data-testid="quick-emi"
              className="break-words font-mono text-[clamp(2.5rem,7vw,4rem)] font-bold leading-none text-indigo"
            >
              {formatINR(displayEmi)}
            </motion.div>
          </div>

          <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
            <div className="min-w-0">
              <div className="mb-1 text-label uppercase text-ink-3">Total interest</div>
              <div className="whitespace-nowrap font-mono text-mono-lg font-bold text-amber">{formatINR(totalInterest)}</div>
            </div>
            <div className="min-w-0">
              <div className="mb-1 text-label uppercase text-ink-3">Total amount payable</div>
              <div className="whitespace-nowrap font-mono text-mono-lg font-bold text-ink">{formatINR(totalPayable)}</div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <PrincipalInterestBar principal={loanAmount} interest={totalInterest} />
        </div>

        <p className="mt-5 text-caption text-ink-3">
          Simple estimate — see the full planner below for prepayment savings and tax impact.
        </p>
      </GlassCard>

      <a
        href="#planner"
        className="group mt-6 flex flex-col items-center gap-1.5 text-center text-body-sm font-medium text-ink-2 transition-colors hover:text-indigo"
      >
        Want to plan this against your own savings and investments?
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          className="size-5 animate-bounce text-indigo transition-transform group-hover:translate-y-0.5"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </a>
    </section>
  );
}
