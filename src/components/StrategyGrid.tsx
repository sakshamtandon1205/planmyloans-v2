"use client";

import { useEffect, useRef, useState } from "react";
import type { StrategyResult } from "@/lib/calculations/strategies";
import { StrategyCard, type UsePlanOptions } from "./StrategyCard";

interface StrategyGridProps {
  results: StrategyResult[];
  onUsePlan: (result: StrategyResult, options: UsePlanOptions) => void;
}

export function StrategyGrid({ results, onUsePlan }: StrategyGridProps) {
  const safetyResult = results.find((r) => r.id === "safety");
  const balanced = results.find((r) => r.id === "balanced");
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Below `lg` the grid becomes a swipeable single-card carousel (native
  // scroll-snap, not a reimplemented gesture handler) — track which card is
  // centered so the dots and arrow disabled-states stay in sync with
  // whatever the user actually swiped to.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const onScroll = () => {
      const index = Math.round(scroller.scrollLeft / Math.max(1, scroller.clientWidth));
      setActiveIndex((prev) => (prev === index ? prev : Math.max(0, Math.min(results.length - 1, index))));
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [results.length]);

  const scrollToIndex = (index: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const clamped = Math.max(0, Math.min(results.length - 1, index));
    const card = scroller.children[clamped] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-10">
      {/* Desktop (lg+): unchanged 4-in-a-row grid. */}
      <div className="hidden min-w-0 lg:grid lg:grid-cols-4 lg:gap-4">
        {results.map((result) => (
          <StrategyCard key={result.id} result={result} safetyResult={safetyResult} onUsePlan={onUsePlan} />
        ))}
      </div>

      {/* Below lg: one card fully visible at a time, horizontal swipe (or
          the arrows/dots below) to move between the 4 strategies. */}
      <div className="lg:hidden">
        <div
          ref={scrollerRef}
          data-testid="strategy-carousel"
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {results.map((result) => (
            <div key={result.id} className="w-full flex-none snap-center">
              <StrategyCard result={result} safetyResult={safetyResult} onUsePlan={onUsePlan} />
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label="Previous strategy"
            className="flex size-8 flex-none items-center justify-center rounded-full border border-line-2 text-ink-2 transition-colors hover:border-indigo hover:text-indigo disabled:opacity-30"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className="flex items-center gap-2" role="tablist" aria-label="Strategy card">
            {results.map((result, i) => (
              <button
                key={result.id}
                type="button"
                role="tab"
                aria-selected={i === activeIndex}
                aria-label={`Show ${result.name}`}
                onClick={() => scrollToIndex(i)}
                className={`size-2 rounded-full transition-colors ${i === activeIndex ? "bg-indigo-solid" : "bg-line-2"}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex + 1)}
            disabled={activeIndex === results.length - 1}
            aria-label="Next strategy"
            className="flex size-8 flex-none items-center justify-center rounded-full border border-line-2 text-ink-2 transition-colors hover:border-indigo hover:text-indigo disabled:opacity-30"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      <p className="mt-5 text-caption leading-relaxed text-ink-3">
        Assumes a {balanced?.loanRatePercent ?? "–"}% loan rate, a {balanced?.mfReturnPercent ?? 12}% mutual fund
        return, and a {balanced?.corpusReturnPercent ?? "–"}% SWP/bank corpus return, all from Quick Estimate above.
        Down payment is searched or fixed per strategy but never below the 20% floor; each corpus is sized to a
        target months-of-EMI runway. Tax-Optimized Payoff assumes the Old Tax Regime. Illustrative model only, not
        financial advice — see the full planner below to adjust every assumption yourself.
      </p>
    </section>
  );
}
