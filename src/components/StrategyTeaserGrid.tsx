"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { useMemo, useRef, useState } from "react";
import { applyStrategyResult } from "@/lib/applyStrategy";
import { computeStrategies, type StrategyId } from "@/lib/calculations/strategies";
import { formatLakh } from "@/lib/format";
import { useSharedInputsStore } from "@/lib/sharedInputsStore";
import { useStrategiesVisibleStore } from "@/lib/strategiesVisibleStore";
import { DEFAULT_INPUTS } from "./calculatorTypes";
import { SliderField } from "./SliderField";

const CARD_TOKENS: Record<StrategyId, 1 | 2 | 3 | 4> = {
  aggressive: 1,
  balanced: 2,
  safety: 3,
  bonus: 4,
};

const CARD_ORDER: StrategyId[] = ["aggressive", "balanced", "safety", "bonus"];

const DEFAULT_PROPERTY_PRICE = 14000000;
const DEFAULT_OWN_FUNDS = 10000000;

export function StrategyTeaserGrid() {
  const visible = useStrategiesVisibleStore((s) => s.visible);
  const rate = useSharedInputsStore((s) => s.rate);
  const tenure = useSharedInputsStore((s) => s.tenure);

  const [propertyPrice, setPropertyPrice] = useState(DEFAULT_PROPERTY_PRICE);
  const [ownFunds, setOwnFunds] = useState(DEFAULT_OWN_FUNDS);
  const [submitted, setSubmitted] = useState({ propertyPrice: DEFAULT_PROPERTY_PRICE, ownFunds: DEFAULT_OWN_FUNDS });
  // Bumped on every "Show me strategies" click — remounts the 4 icon dots
  // (via their `key`) so they replay a glow pulse, and scrolls the grid
  // into view. Without either, recomputing silently reads as "nothing
  // happened" since the grid sits below the fold on mobile.
  const [submitCount, setSubmitCount] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);

  const results = useMemo(
    () =>
      computeStrategies({
        propertyPrice: submitted.propertyPrice,
        ownFunds: submitted.ownFunds,
        loanRatePercent: rate || DEFAULT_INPUTS.lr,
        tenureYears: tenure || DEFAULT_INPUTS.tenure,
      }),
    [submitted, rate, tenure],
  );

  if (!visible) return null;

  const handleApply = (id: StrategyId) => {
    const result = results.find((r) => r.id === id);
    if (result) applyStrategyResult(result);
  };

  const handleSubmit = () => {
    setSubmitted({ propertyPrice, ownFunds });
    setSubmitCount((c) => c + 1);
    requestAnimationFrame(() => {
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <motion.section
      id="strategies"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mx-auto w-full max-w-6xl px-6 py-8 scroll-mt-6"
    >
      <div className="glass-panel mb-6 rounded-[18px] p-5">
        <p className="mb-4 text-body-sm text-ink-2">
          We&apos;ll reuse the interest rate and tenure from Quick Estimate above — just tell us the property price
          and what you have available, and we&apos;ll compute 4 distinct ways to split it.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SliderField
            label="Property price"
            value={propertyPrice}
            min={2000000}
            max={50000000}
            step={100000}
            onChange={setPropertyPrice}
            formatValue={formatLakh}
          />
          <SliderField
            label="Own funds available"
            value={ownFunds}
            min={500000}
            max={40000000}
            step={100000}
            onChange={setOwnFunds}
            formatValue={formatLakh}
          />
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          className="cta-tap hover-cta-primary mt-4 rounded-xl bg-[linear-gradient(135deg,var(--indigo),var(--jade))] px-5 py-2.5 font-heading text-[14px] font-bold text-white"
        >
          Show me strategies
        </button>
      </div>

      <div ref={gridRef} className="scroll-mt-24">
        <div className="mb-[22px] flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-heading text-h2 font-extrabold tracking-[-0.01em] text-ink">
            Not sure how to split your funds?
          </h2>
          <span className="text-[13.5px] font-medium text-ink-3">4 tailored strategies</span>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {CARD_ORDER.map((id) => {
            const result = results.find((r) => r.id === id);
            if (!result) return null;
            const token = CARD_TOKENS[id];
            const { downPayment, mfLumpsum, corpus } = result.capitalStack;
            const ownFundsUsed = downPayment + mfLumpsum + corpus;
            const pct = (n: number) => (ownFundsUsed > 0 ? Math.round((n / ownFundsUsed) * 100) : 0);
            const splitLabel = `${pct(downPayment)}% DP · ${pct(mfLumpsum)}% MF · ${pct(corpus)}% ${result.fundingMode === "swp" ? "SWP" : "Bank"}`;

            return (
              <button
                type="button"
                key={id}
                onClick={() => handleApply(id)}
                data-testid={`strategy-teaser-${id}`}
                className="cta-tap hover-card-link glass-panel flex h-full flex-col p-5 text-left"
              >
                <div
                  key={submitCount}
                  className="teaser-glow mb-3 flex size-[34px] items-center justify-center rounded-[9px]"
                  style={
                    {
                      background: `var(--teaser-${token}-bg)`,
                      "--glow-color": `var(--teaser-${token}-dot)`,
                    } as CSSProperties
                  }
                >
                  <span className="size-3 rounded-xs" style={{ background: `var(--teaser-${token}-dot)` }} />
                </div>
                <div className="mb-1.5 min-h-[40px] font-heading text-[15.5px] font-bold text-ink">{result.name}</div>
                <p className="mb-3 text-[13px] leading-[1.5] text-ink-2">{result.subtitle}</p>
                <div className="mt-auto font-mono text-[12px] font-semibold text-accent-text">{splitLabel}</div>
              </button>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
