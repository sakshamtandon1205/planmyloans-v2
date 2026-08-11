"use client";

import { useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { generateAmortizationSchedule } from "@/lib/calculations/emi";
import type { StrategyResult } from "@/lib/calculations/strategies";
import { useAmbientMoodStore } from "@/lib/ambientMoodStore";
import { formatINR, formatLakh } from "@/lib/format";
import { Badge } from "./Badge";

export interface UsePlanOptions {
  annualLumpSumCount: number;
}

const MAX_ANNUAL_LUMP_SUM_COUNT = 6;
const hoverSpring = { type: "spring" as const, stiffness: 300, damping: 20 };

interface StrategyCardProps {
  result: StrategyResult;
  /** Safety First's own result, for the "vs. Safety First" delta line (Balanced/Aggressive only). */
  safetyResult?: StrategyResult;
  onUsePlan: (result: StrategyResult, options: UsePlanOptions) => void;
}

function formatMonths(months: number): string {
  const years = Math.floor(months / 12);
  const rem = Math.round(months % 12);
  if (years === 0) return `${rem} mo`;
  if (rem === 0) return `${years} yr`;
  return `${years} yr ${rem} mo`;
}

function riskProfile(result: StrategyResult) {
  const { emi, capitalStack, corpusReturnPercent, corpusDepletedAtMonth } = result;
  const annualWithdrawRate = capitalStack.corpus > 0 ? ((emi * 12) / capitalStack.corpus) * 100 : 0;
  const gaugePct = Math.min(100, (annualWithdrawRate / (corpusReturnPercent * 2 || 1)) * 100);
  const isRisky = corpusDepletedAtMonth !== null || annualWithdrawRate > corpusReturnPercent + 2;
  return { gaugePct, isRisky };
}

// What each strategy is actually doing with the money — shown as a single
// line under the mini capital stack, distinct from the header tagline above.
const ALLOCATION_INTENT: Record<StrategyResult["id"], string> = {
  safety: "Minimal market exposure — funds held in bank, larger buffer for certainty.",
  balanced: "Down payment held at the 20% floor, the rest split between equity growth and a resilient SWP cushion.",
  aggressive: "Maximum capital working in equity — fastest payoff, more volatility.",
  bonus: "One bonus EMI a year, funded by tax savings rather than extra monthly cash flow.",
};

const STACK_SEGMENTS = [
  { key: "dp", label: "DP", className: "bg-indigo-solid text-white" },
  { key: "mf", label: "MF", className: "bg-jade-solid text-white" },
  { key: "corpus", className: "bg-jade-soft text-jade" },
  {
    key: "loan",
    label: "Loan",
    className:
      "bg-[repeating-linear-gradient(135deg,var(--surface-2)_0,var(--surface-2)_6px,var(--line)_6px,var(--line)_12px)] text-ink-2",
  },
] as const;

function MiniCapitalStack({ result }: { result: StrategyResult }) {
  const { downPayment, mfLumpsum, corpus, loanAmount } = result.capitalStack;
  const total = downPayment + mfLumpsum + corpus + loanAmount;
  const corpusLabel = result.fundingMode === "bank" ? "Bank" : "SWP";
  const values: Record<(typeof STACK_SEGMENTS)[number]["key"], number> = {
    dp: downPayment,
    mf: mfLumpsum,
    corpus,
    loan: loanAmount,
  };

  return (
    <div className="flex h-[22px] overflow-hidden rounded-sm" aria-hidden>
      {STACK_SEGMENTS.map((s) => {
        const pct = total > 0 ? (values[s.key] / total) * 100 : 0;
        const label = s.key === "corpus" ? corpusLabel : s.label;
        return (
          <div
            key={s.key}
            style={{ width: `${pct}%` }}
            className={`@container/miniseg flex items-center justify-center overflow-hidden ${s.className}`}
          >
            {/* Same width-aware hide (not truncate) as the main Capital
                Stack bar — at this scale even a 2-3 letter abbreviation
                needs ~26px to read cleanly. */}
            <span className="hidden truncate text-[9px] font-bold uppercase tracking-wide @min-[26px]/miniseg:block">
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const ICONS: Record<StrategyResult["id"], ReactNode> = {
  safety: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
    </svg>
  ),
  balanced: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
      <path d="M12 3v18M5 8l-3 5a4 4 0 008 0l-3-5zM19 8l-3 5a4 4 0 008 0l-3-5zM5 8h14M9 21h6" />
    </svg>
  ),
  aggressive: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
      <path d="M12 2c3 2 5 6 5 10 0 2-1 4-2 5l-3 3-3-3c-1-1-2-3-2-5 0-4 2-8 5-10z" />
      <path d="M9 15l-3 3 1 3 3-1M15 15l3 3-1 3-3-1" />
    </svg>
  ),
  bonus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-5">
      <path d="M20.59 13.41L13.42 20.58a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <circle cx="7" cy="7" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
};

export function StrategyCard({ result, safetyResult, onUsePlan }: StrategyCardProps) {
  const [lumpSumCount, setLumpSumCount] = useState(1);
  const [lumpSumOn, setLumpSumOn] = useState(false);
  const setHoveredStrategyId = useAmbientMoodStore((s) => s.setHoveredStrategyId);
  const clearHoveredStrategyId = useAmbientMoodStore((s) => s.clearHoveredStrategyId);

  const isBonus = result.id === "bonus";
  const isSafety = result.id === "safety";
  const isBalanced = result.id === "balanced";

  // Safety First's stepper recomputes locally via the same tested engine
  // function, on top of the card's own base allocation — no full-page recompute.
  const lumpSumRecompute = useMemo(() => {
    if (!isSafety || !lumpSumOn || lumpSumCount <= 0) return null;
    return generateAmortizationSchedule({
      principal: result.capitalStack.loanAmount,
      annualRatePercent: result.loanRatePercent,
      tenureMonths: result.tenureMonths,
      extraMonthlyPrepayment: result.extraMonthlyPrepayment,
      annualPrepayStepUpPercent: result.prepayStepUpPercent,
      annualLumpSumCount: lumpSumCount,
    });
  }, [isSafety, lumpSumOn, lumpSumCount, result]);

  const displayPayoffMonths = lumpSumRecompute?.payoffMonths ?? result.payoffMonths;
  const displayTotalInterest = lumpSumRecompute?.totalInterestPaid ?? result.totalInterestPaid;
  const lumpSumInterestSaved = lumpSumRecompute ? result.totalInterestPaid - lumpSumRecompute.totalInterestPaid : 0;

  const { gaugePct, isRisky } = riskProfile(result);

  const interestSavedVsSafety =
    safetyResult && !isSafety && !isBonus ? safetyResult.totalInterestPaid - result.totalInterestPaid : null;

  const offsetLabel =
    result.interestOffsetPercent >= 100 ? "100%+" : `${result.interestOffsetPercent.toFixed(0)}%`;

  return (
    <motion.div
      data-testid={`strategy-card-${result.id}`}
      className={`@container/card glass-panel-sm flex h-full min-w-0 flex-col gap-3 p-3 @min-[220px]/card:p-4 ${isBonus ? "border border-amber/35" : isBalanced ? "border-2 border-jade/40" : ""}`}
      whileHover={{ y: -4, scale: 1.015, transition: hoverSpring }}
      onHoverStart={() => setHoveredStrategyId(result.id)}
      onHoverEnd={() => clearHoveredStrategyId(result.id)}
      onFocus={() => setHoveredStrategyId(result.id)}
      onBlur={() => clearHoveredStrategyId(result.id)}
    >
      {/* The badge gets its own row, always above icon+title in normal
          document flow — never side-by-side with them. Side-by-side (even
          with flex-wrap) let "RECOMMENDED"'s pill width compete with the
          title for space on narrow cards, which is exactly what read as
          "overlapping" at the 2x2 mobile grid width. */}
      {isBalanced && (
        <div>
          <Badge tone="jade">Recommended</Badge>
        </div>
      )}
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="mt-0.5 flex size-8 flex-none items-center justify-center rounded-sm bg-indigo-soft text-indigo">
          {ICONS[result.id]}
        </span>
        <div className="min-w-0">
          <div className="font-heading text-body font-bold text-ink">{result.name}</div>
          <p className="min-h-[2.75em] text-caption leading-snug text-ink-2 line-clamp-2">{result.subtitle}</p>
        </div>
      </div>

      <MiniCapitalStack result={result} />

      <p className="text-caption leading-snug text-ink-2">{ALLOCATION_INTENT[result.id]}</p>

      {/* Stacked to a single column on narrow cards — the 2x2 mobile grid's
          card width halves this again for each stat, which was forcing
          numbers like "₹84,587/mo" to wrap mid-word inside a ~60px column.
          Giving each stat the card's full width lets it sit on one line;
          side-by-side only kicks in once the card is wide enough to afford
          it (container query on the card itself, not the viewport, so this
          holds for any card width, not just the 2x2 mobile breakpoint). */}
      <div className="grid grid-cols-1 gap-2 @min-[200px]/card:grid-cols-2">
        <Stat
          label="Down payment"
          value={`${(result.downPaymentPercent * 100).toFixed(0)}% · ${formatLakh(result.capitalStack.downPayment)}`}
          testId={`strategy-downpayment-${result.id}`}
        />
        <Stat label="EMI runway" value={formatMonths(result.emiRunwayMonths)} testId={`strategy-runway-${result.id}`} />
      </div>

      <div className="grid grid-cols-1 gap-2 @min-[200px]/card:grid-cols-2">
        <Stat label="EMI" value={`${formatINR(result.emi)}/mo`} testId={`strategy-emi-${result.id}`} />
        <Stat label="Payoff" value={formatMonths(displayPayoffMonths)} testId={`strategy-payoff-${result.id}`} />
      </div>

      {isBonus ? (
        <div className="grid grid-cols-1 gap-2 @min-[200px]/card:grid-cols-2">
          <Stat
            label="Tax saved"
            value={formatINR(result.taxSavingsAmount ?? 0)}
            tone="text-jade"
            testId={`strategy-taxsaved-${result.id}`}
          />
          <Stat
            label="Net effective cost"
            value={formatINR(result.netEffectiveInterestCost ?? result.totalInterestPaid)}
            tone="text-amber"
            testId={`strategy-neteffective-${result.id}`}
          />
        </div>
      ) : (
        <Stat label="Total interest" value={formatINR(displayTotalInterest)} testId={`strategy-interest-${result.id}`} />
      )}

      <Stat label="Net wealth at horizon" value={formatINR(result.netWealthAtHorizon)} testId={`strategy-wealth-${result.id}`} />

      {isBonus && (
        <p className="text-caption text-amber">
          Assumes Old Tax Regime — Sec 24(b) and 80C deductions aren&apos;t available to New Regime taxpayers.
        </p>
      )}

      {interestSavedVsSafety !== null && interestSavedVsSafety > 0 && (
        <p className="text-caption text-jade">Saves {formatINR(interestSavedVsSafety)} in interest vs. Safety First</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-jade-soft px-2 py-0.5 text-caption font-semibold text-jade">
          MF growth offsets {offsetLabel} of interest
        </span>
      </div>

      <div>
        <div className="h-1.5 overflow-hidden rounded-full bg-ink/[0.07]">
          <div
            style={{ width: `${Math.min(100, Math.max(0, gaugePct))}%` }}
            className={`h-full rounded-full ${isRisky ? "bg-amber" : "bg-jade"}`}
          />
        </div>
        <div className="mt-1 flex justify-between text-caption text-ink-3">
          <span>sustainable</span>
          <span>draining fast</span>
        </div>
      </div>

      {isSafety && (
        <div className="flex items-center gap-2 text-caption text-ink-2">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={lumpSumOn}
              onChange={(e) => setLumpSumOn(e.target.checked)}
              data-testid="strategy-lumpsum-toggle"
              className="size-3.5 accent-indigo"
            />
            <span>Extra EMIs/year</span>
          </label>
          <div className="flex flex-none items-center gap-1">
            <button
              type="button"
              disabled={!lumpSumOn}
              onClick={() => setLumpSumCount((n) => Math.max(1, n - 1))}
              aria-label="Decrease extra EMIs per year"
              className="flex size-5 items-center justify-center rounded-sm border border-line-2 text-ink-2 transition-colors hover:border-indigo hover:text-indigo disabled:opacity-40"
            >
              −
            </button>
            <span data-testid="strategy-lumpsum-count" className="w-4 text-center font-mono font-bold text-ink">
              {lumpSumCount}
            </span>
            <button
              type="button"
              disabled={!lumpSumOn}
              onClick={() => setLumpSumCount((n) => Math.min(MAX_ANNUAL_LUMP_SUM_COUNT, n + 1))}
              aria-label="Increase extra EMIs per year"
              className="flex size-5 items-center justify-center rounded-sm border border-line-2 text-ink-2 transition-colors hover:border-indigo hover:text-indigo disabled:opacity-40"
            >
              +
            </button>
          </div>
          {lumpSumOn && lumpSumInterestSaved > 0 && (
            <span className="text-jade">(saves {formatINR(lumpSumInterestSaved)})</span>
          )}
        </div>
      )}

      <div className="mt-auto pt-1">
        <button
          type="button"
          onClick={() =>
            onUsePlan(result, { annualLumpSumCount: isSafety && lumpSumOn ? lumpSumCount : result.annualLumpSumCount })
          }
          data-testid={`strategy-use-plan-${result.id}`}
          className={`w-full rounded-sm px-3 py-2 text-body-sm font-semibold transition-colors ${
            isBonus
              ? "border border-amber/60 bg-amber-soft text-amber hover:bg-amber/20"
              : "bg-indigo-solid text-white hover:brightness-110"
          }`}
        >
          Use this plan
        </button>
      </div>
    </motion.div>
  );
}

function Stat({
  label,
  value,
  tone = "text-ink",
  testId,
}: {
  label: string;
  value: string;
  tone?: string;
  testId?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="text-caption uppercase leading-tight text-ink-3">{label}</div>
      {/* break-all (not just break-words) guarantees a wrap even for a
          single unbroken run like "₹1,54,587/mo" — on the narrow 2x2 mobile
          grid a stat column can be under 65px, too tight for that string to
          find a natural break point otherwise, which is what was clipping
          numbers mid-digit. The smaller base size (bumped back up via
          container query once the card itself has room) keeps the wrapped
          result to 2 lines instead of 3-4 at that width. */}
      <div
        data-testid={testId}
        className={`break-all font-mono text-[11px] leading-snug font-bold @min-[220px]/card:text-mono-sm ${tone}`}
      >
        {value}
      </div>
    </div>
  );
}
