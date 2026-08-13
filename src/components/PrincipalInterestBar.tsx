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
  const interestPct = 100 - principalPct;

  return (
    <div>
      <div className="flex h-[13px] overflow-hidden rounded-[7px]">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: `${principalPct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-[linear-gradient(90deg,var(--indigo),var(--jade))]"
        />
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: `${interestPct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-surface-2"
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
