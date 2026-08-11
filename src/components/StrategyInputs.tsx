"use client";

import { useState } from "react";
import { formatLakh } from "@/lib/format";
import { GlassCard } from "./GlassCard";
import { SliderField } from "./SliderField";

export interface StrategyFormValues {
  propertyPrice: number;
  ownFunds: number;
}

const DEFAULT_VALUES: StrategyFormValues = {
  propertyPrice: 14000000,
  ownFunds: 10000000,
};

interface StrategyInputsProps {
  onSubmit: (values: StrategyFormValues) => void;
}

export function StrategyInputs({ onSubmit }: StrategyInputsProps) {
  // Collapsed by default so Quick Estimate (above) still lands above the
  // fold on a typical desktop viewport — this section is opt-in, not a
  // mandatory step in the way down the page.
  const [expanded, setExpanded] = useState(false);
  const [values, setValues] = useState<StrategyFormValues>(DEFAULT_VALUES);

  const update = <K extends keyof StrategyFormValues>(key: K, value: StrategyFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  if (!expanded) {
    return (
      <section className="mx-auto w-full max-w-6xl px-6 pb-6">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="glass-panel flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:brightness-105"
        >
          <span className="text-body-sm font-medium text-ink sm:text-body">
            Not sure how to split your funds?{" "}
            <span className="font-normal text-ink-2">See 4 tailored strategies</span>
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            className="size-5 flex-none text-indigo"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-6">
      <GlassCard className="p-5 sm:p-7">
        <h2 className="mb-1.5 font-heading text-h3 text-ink">4 strategies for your situation</h2>
        <p className="mb-5 text-body-sm text-ink-2">
          We&apos;ll reuse the interest rate and tenure from Quick Estimate above — just tell us the property price
          and what you have available, and we&apos;ll compute 4 distinct ways to split it.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SliderField
            label="Property price"
            value={values.propertyPrice}
            min={5000000}
            max={200000000}
            step={100000}
            onChange={(v) => update("propertyPrice", v)}
            formatValue={formatLakh}
          />
          <SliderField
            label="Own funds available"
            value={values.ownFunds}
            min={2000000}
            max={20000000}
            step={100000}
            onChange={(v) => update("ownFunds", v)}
            formatValue={formatLakh}
          />
        </div>

        <button
          type="button"
          onClick={() => onSubmit(values)}
          className="mt-6 w-full rounded-sm bg-indigo-solid px-5 py-3 text-body font-semibold text-white transition-colors hover:brightness-110 sm:w-auto"
        >
          Show me strategies
        </button>
      </GlassCard>
    </section>
  );
}
