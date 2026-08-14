import { GlassCard } from "./GlassCard";

/**
 * Static placeholders for CapitalStack/BalanceChart/AmortizationChart while
 * their code-split chunks load (see the `dynamic(..., { ssr: false })`
 * wrapping in Calculator.tsx). Each mirrors its real component's GlassCard
 * padding and heading so the swap-in doesn't shift layout — the whole point
 * is to reserve the space the real chart will occupy instead of collapsing
 * to 0 height until it mounts.
 *
 * The fixed heights below aren't guesses — each was measured directly
 * (`getBoundingClientRect`) against the real, mounted component at the
 * homepage's default inputs (1 Cr loan, 7.5% rate, 20yr tenure), both at a
 * true 375px mobile viewport (327px content width after the 24px side
 * padding — where Lighthouse's mobile CLS run actually samples) and at a
 * 1440px desktop viewport. The two differ structurally, not just by
 * scale: on mobile, Capital Stack's summary line and legend row wrap
 * (taller); on desktop they don't (shorter), while Balances-over-time and
 * EMI-breakup sit in a 2-column CSS Grid row with default `align-items:
 * stretch`, so both get forced to the SAME height (the taller of the two)
 * regardless of their own content. Reproducing any of that wrap/stretch
 * behavior inside a skeleton is fragile — pinning each outer card to its
 * measured height per breakpoint is exact and doesn't drift if copy
 * changes. The `min-[860px]:` breakpoint matches useIsMobile's threshold
 * exactly, so the skeleton switches at the same width the real layout does.
 */

export function CapitalStackSkeleton() {
  return (
    <GlassCard className="h-[236px] p-5 min-[860px]:h-[177px]">
      <div className="mb-4 flex items-baseline justify-between">
        <span className="font-heading text-h3 text-ink">Capital stack</span>
      </div>
      <div className="h-[34px] animate-pulse rounded-[9px] bg-surface-2" />
      <div className="mt-3.5 h-[18px] w-2/3 animate-pulse rounded bg-surface-2" />
      <div className="mt-3 h-[20px] w-full animate-pulse rounded bg-surface-2" />
    </GlassCard>
  );
}

function ChartCardSkeleton({ title, subtitle, heightClass }: { title: string; subtitle: string; heightClass: string }) {
  return (
    <GlassCard className={`flex flex-col p-[22px] ${heightClass}`}>
      <div className="mb-1 font-heading text-[14px] font-bold text-ink">{title}</div>
      <div className="mb-4 text-[12px] text-ink-3">{subtitle}</div>
      <div className="w-full flex-1 animate-pulse rounded bg-surface-2" />
      <div className="mt-2 h-[16px] w-3/4 animate-pulse rounded bg-surface-2" />
    </GlassCard>
  );
}

export function BalanceChartSkeleton() {
  return (
    <ChartCardSkeleton
      title="Balances over time"
      subtitle="MF grows untouched · corpus funds the EMI monthly · loan amortises"
      heightClass="h-[289px] min-[860px]:h-[339px]"
    />
  );
}

export function AmortizationChartSkeleton() {
  return (
    <ChartCardSkeleton
      title="EMI breakup"
      subtitle="Interest vs. principal per payment"
      heightClass="h-[245px] min-[860px]:h-[339px]"
    />
  );
}
