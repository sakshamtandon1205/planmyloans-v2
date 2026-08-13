"use client";

import { motion } from "framer-motion";
import { formatLakh } from "@/lib/format";

interface PrincipalInterestBarProps {
  principal: number;
  interest: number;
}

/**
 * Thin two-segment bar (principal vs. interest) for the Quick Estimate
 * card, matching the Capital Stack's visual language: a gradient-filled
 * "principal" segment against a flat neutral "interest" segment, with a
 * dot-legend row of exact figures below rather than in-bar labels (the bar
 * itself is too thin at 13px to hold readable text).
 */
export function PrincipalInterestBar({ principal, interest }: PrincipalInterestBarProps) {
  const total = principal + interest;
  const principalPct = total > 0 ? (principal / total) * 100 : 0;

  return (
    <div>
      {/* Interest is just the static full-width track showing through — since
          the two segments always sum to 100%, only the principal segment
          needs to move, and animating `scaleX` (a transform) instead of
          `width` keeps this off the layout/paint path entirely. That matters
          here specifically because this bar re-animates on every keystroke,
          not just once on mount. */}
      <div className="relative h-[13px] overflow-hidden rounded-[7px] bg-surface-2">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: principalPct / 100 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 w-full origin-left bg-[linear-gradient(90deg,var(--indigo),var(--jade))]"
        />
      </div>

      <div className="mt-2.5 flex flex-wrap justify-between gap-x-4 gap-y-1 text-[12px] font-medium text-ink-3">
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block size-2 rounded-xs bg-indigo" />
          Principal {formatLakh(principal)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block size-2 rounded-xs bg-surface-2" />
          Interest {formatLakh(interest)}
        </span>
      </div>
    </div>
  );
}
