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

function formatPayoff(months: number): string {
  const years = Math.floor(months / 12);
  const rem = months % 12;
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

const STACK_SEGMENTS = [
  { key: "dp", className: "bg-indigo-solid" },
  { key: "mf", className: "bg-jade-solid" },
  { key: "corpus", className: "bg-jade-soft" },
  {
    key: "loan",
    className:
      "bg-[repeating-linear-gradient(135deg,var(--surface-2)_0,var(--surface-2)_6px,var(--line)_6px,var(--line)_12px)]",
  },
] as const;

function MiniCapitalStack({ result }: { result: StrategyResult }) {
  const { downPayment, mfLumpsum, corpus, loanAmount } = result.capitalStack;
  const total = downPayment + mfLumpsum + corpus + loanAmount;
  const values: Record<(typeof STACK_SEGMENTS)[number]["key"], number> = {
    dp: downPayment,
    mf: mfLumpsum,
    corpus,
    loan: loanAmount,
  };

  return (
    <div className="flex h-[18px] overflow-hidden rounded-sm" aria-hidden>
      {STACK_SEGMENTS.map((s) => {
        const pct = total > 0 ? (values[s.key] / total) * 100 : 0;
        return <div key={s.key} style={{ width: `${pct}%` }} className={s.className} />;
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
  offset: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 15l6-6M9.5 10a.5.5 0 100-1 .5.5 0 000 1zM14.5 15a.5.5 0 100-1 .5.5 0 000 1z" />
    </svg>
  ),
};

export function StrategyCard({ result, safetyResult, onUsePlan }: StrategyCardProps) {
  const [lumpSumCount, setLumpSumCount] = useState(1);
  const [lumpSumOn, setLumpSumOn] = useState(false);
  const [offsetExpanded, setOffsetExpanded] = useState(false);
  const setHoveredStrategyId = useAmbientMoodStore((s) => s.setHoveredStrategyId);
  const clearHoveredStrategyId = useAmbientMoodStore((s) => s.clearHoveredStrategyId);

  const isOffset = result.id === "offset";
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
    safetyResult && !isSafety && !isOffset ? safetyResult.totalInterestPaid - result.totalInterestPaid : null;

  const offsetLabel =
    result.interestOffsetPercent >= 100 ? "100%+" : `${result.interestOffsetPercent.toFixed(0)}%`;

  return (
    <motion.div
      data-testid={`strategy-card-${result.id}`}
      className={`glass-panel-sm flex h-full min-w-0 flex-col gap-3 p-4 ${isOffset ? "border-2 border-dashed border-amber/50" : isBalanced ? "border-2 border-jade/40" : ""}`}
      whileHover={{ y: -4, scale: 1.015, transition: hoverSpring }}
      onHoverStart={() => setHoveredStrategyId(result.id)}
      onHoverEnd={() => clearHoveredStrategyId(result.id)}
      onFocus={() => setHoveredStrategyId(result.id)}
      onBlur={() => clearHoveredStrategyId(result.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 flex size-8 flex-none items-center justify-center rounded-sm bg-indigo-soft text-indigo">
            {ICONS[result.id]}
          </span>
          <div className="min-w-0">
            <div className="font-heading text-body font-bold text-ink">{result.name}</div>
            <p className="min-h-[2.75em] text-caption leading-snug text-ink-2 line-clamp-2">{result.subtitle}</p>
          </div>
        </div>
        {isBalanced && (
          <div className="flex-none">
            <Badge tone="jade">Recommended</Badge>
          </div>
        )}
      </div>

      <MiniCapitalStack result={result} />

      <div className="grid grid-cols-2 gap-2">
        <Stat label="EMI" value={`${formatINR(result.emi)}/mo`} testId={`strategy-emi-${result.id}`} />
        <Stat label="Payoff" value={formatPayoff(displayPayoffMonths)} testId={`strategy-payoff-${result.id}`} />
      </div>
      {isOffset ? (
        <Stat
          label="Required MF return"
          value={`${result.requiredMfReturnPercent?.toFixed(1) ?? "–"}%`}
          tone="text-amber"
          testId={`strategy-required-return-${result.id}`}
        />
      ) : (
        <Stat
          label="Total interest"
          value={formatINR(displayTotalInterest)}
          testId={`strategy-interest-${result.id}`}
        />
      )}

      {isOffset && (
        <p className="text-caption text-ink-3">
          Total interest (at {result.mfReturnPercent}% MF return): {formatINR(result.totalInterestPaid)}. If actual
          return is 3 points lower, MF growth offsets ~{result.offsetPercentAt3PtsLower?.toFixed(0) ?? "–"}% of it.
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

      {isOffset && offsetExpanded && (
        <div className="rounded-sm bg-amber-soft/60 p-3 text-caption leading-relaxed text-ink">
          To fully cover this loan&apos;s interest via MF growth alone, the mutual fund lumpsum of{" "}
          {formatLakh(result.capitalStack.mfLumpsum)} needs to compound at{" "}
          <b>{result.requiredMfReturnPercent?.toFixed(1) ?? "–"}%</b> annually over the {formatPayoff(result.payoffMonths)}{" "}
          payoff window. At 3 points lower ({((result.requiredMfReturnPercent ?? 0) - 3).toFixed(1)}%), it would only
          offset ~{result.offsetPercentAt3PtsLower?.toFixed(0) ?? "–"}% of the interest instead.
        </div>
      )}

      <div className="mt-auto pt-1">
        {isOffset ? (
          offsetExpanded ? (
            <button
              type="button"
              onClick={() => onUsePlan(result, { annualLumpSumCount: 0 })}
              data-testid={`strategy-use-plan-${result.id}`}
              className="w-full rounded-sm border border-amber bg-amber-soft px-3 py-2 text-body-sm font-semibold text-amber transition-colors hover:bg-amber/20"
            >
              Use this plan
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setOffsetExpanded(true)}
              data-testid="strategy-see-sensitivity"
              className="w-full rounded-sm border border-line-2 bg-surface-2 px-3 py-2 text-body-sm font-semibold text-ink-2 transition-colors hover:border-amber hover:text-amber"
            >
              See sensitivity
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={() => onUsePlan(result, { annualLumpSumCount: isSafety && lumpSumOn ? lumpSumCount : 0 })}
            data-testid={`strategy-use-plan-${result.id}`}
            className="w-full rounded-sm bg-indigo-solid px-3 py-2 text-body-sm font-semibold text-white transition-colors hover:brightness-110"
          >
            Use this plan
          </button>
        )}
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
      <div data-testid={testId} className={`break-words font-mono text-mono-sm font-bold ${tone}`}>
        {value}
      </div>
    </div>
  );
}
