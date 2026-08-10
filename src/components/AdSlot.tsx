interface AdSlotProps {
  /** Shown as a small eyebrow label so the reserved space reads as intentional, not a bug. */
  label?: string;
  className?: string;
}

/**
 * Reserved space for a future ad unit. Deliberately NOT glass — a
 * transparent, blurred panel with nothing in it yet would look broken.
 * This stays a plain, solid module so it reads as intentional whitespace
 * until real ad code fills it in.
 */
export function AdSlot({ label = "Advertisement", className = "" }: AdSlotProps) {
  return (
    <div
      className={`ad-slot flex min-h-[100px] flex-col items-center justify-center gap-1 px-4 py-6 text-center ${className}`}
    >
      {/* text-ink-2, not text-ink-3: ink-3 was only ever contrast-tuned against
          --surface/--paper, and .ad-slot's background is --surface-2 — a
          combination axe caught failing AA (4.32:1 light / 4.18:1 dark, both
          under 4.5:1). ink-2 clears both comfortably. */}
      <span className="text-caption uppercase tracking-wide text-ink-2">{label}</span>
    </div>
  );
}
