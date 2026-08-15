interface AffiliateBannerProps {
  title: string;
  description: string;
}

export function AffiliateBanner({ title, description }: AffiliateBannerProps) {
  return (
    <div className="glass-panel flex flex-wrap items-center gap-3 rounded-[18px] px-4 py-5 sm:gap-5 sm:px-6">
      <div className="flex size-9 flex-none items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--indigo),var(--jade))] font-heading text-lg font-extrabold text-white sm:size-[46px]">
        ✓
      </div>
      <div className="min-w-[200px] flex-1">
        <div className="mb-0.5 whitespace-nowrap font-heading text-[15px] font-bold text-ink sm:text-[15.5px]">
          {title}
        </div>
        {/* Slight negative tracking (imperceptible at this size) buys back
            just enough width for the mobile card's narrower text column to
            wrap at 2 lines instead of 3 — see AGENTS.md-adjacent history:
            font-size here has an established 14px legibility floor, so this
            and the smaller icon/gap/padding above (mobile only, sm: restores
            the original sizing) are the fix instead of shrinking text. */}
        <div className="text-[14px] tracking-[-0.4px] text-ink-3">{description}</div>
      </div>
      <a
        href="https://www.bankbazaar.com/credit-score.html"
        target="_blank"
        rel="noopener noreferrer"
        className="cta-tap hover-cta-primary whitespace-nowrap rounded-[10px] bg-ink px-5 py-3 font-heading text-[14px] font-bold text-paper"
      >
        Check eligibility →
      </a>
    </div>
  );
}
