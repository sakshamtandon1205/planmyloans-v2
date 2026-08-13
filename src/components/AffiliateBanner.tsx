interface AffiliateBannerProps {
  title: string;
  description: string;
}

/**
 * Not wired to BankBazaar (or any redirect) yet — kept as an inert button
 * until that affiliate link is ready to go live.
 */
export function AffiliateBanner({ title, description }: AffiliateBannerProps) {
  return (
    <div className="glass-panel flex flex-wrap items-center gap-5 rounded-[18px] px-6 py-5">
      <div className="flex size-[46px] flex-none items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--indigo),var(--jade))] font-heading text-lg font-extrabold text-white">
        ✓
      </div>
      <div className="min-w-[200px] flex-1">
        <div className="mb-0.5 font-heading text-[15.5px] font-bold text-ink">{title}</div>
        <div className="text-[13.5px] text-ink-3">{description}</div>
      </div>
      <button
        type="button"
        className="cta-tap whitespace-nowrap rounded-[10px] bg-ink px-5 py-3 font-heading text-[14px] font-bold text-paper"
      >
        Check eligibility →
      </button>
    </div>
  );
}
