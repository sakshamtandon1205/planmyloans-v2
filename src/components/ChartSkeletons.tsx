import { GlassCard } from "./GlassCard";

/**
 * Static placeholders for CapitalStack/BalanceChart/AmortizationChart while
 * their code-split chunks load (see the `dynamic(..., { ssr: false })`
 * wrapping in Calculator.tsx). Each mirrors its real component's GlassCard
 * padding and heading so the swap-in doesn't shift layout — the whole point
 * is to reserve the space the real chart will occupy instead of collapsing
 * to 0 height until it mounts.
 */

export function CapitalStackSkeleton() {
  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <span className="font-heading text-h3 text-ink">Capital stack</span>
      </div>
      <div className="h-[34px] animate-pulse rounded-[9px] bg-surface-2" />
      <div className="mt-3.5 h-[18px] w-2/3 animate-pulse rounded bg-surface-2" />
      <div className="mt-3 h-[20px] w-full animate-pulse rounded bg-surface-2" />
    </GlassCard>
  );
}

function ChartCardSkeleton({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <GlassCard className="flex h-full flex-col p-[22px]">
      <div className="mb-1 font-heading text-[14px] font-bold text-ink">{title}</div>
      <div className="mb-4 text-[12px] text-ink-3">{subtitle}</div>
      <div className="min-h-[140px] w-full flex-1 animate-pulse rounded bg-surface-2" />
      <div className="mt-2 h-[16px] w-3/4 animate-pulse rounded bg-surface-2" />
    </GlassCard>
  );
}

export function BalanceChartSkeleton() {
  return (
    <ChartCardSkeleton
      title="Balances over time"
      subtitle="MF grows untouched · corpus funds the EMI monthly · loan amortises"
    />
  );
}

export function AmortizationChartSkeleton() {
  return <ChartCardSkeleton title="EMI breakup" subtitle="Interest vs. principal per payment" />;
}
