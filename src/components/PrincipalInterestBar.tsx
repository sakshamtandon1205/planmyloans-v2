"use client";

import { motion } from "framer-motion";
import { formatLakh } from "@/lib/format";

interface PrincipalInterestBarProps {
  principal: number;
  interest: number;
}

interface Segment {
  key: string;
  label: string;
  value: number;
  className: string;
}

const MIN_LABEL_PERCENT = 12;

/**
 * Two-segment sibling of CapitalStack, for the Quick Estimate card: just
 * principal vs. interest, same bar anatomy (rounded track, inline
 * label+amount once a segment is wide enough) so the two read as one
 * visual language across the page.
 */
export function PrincipalInterestBar({ principal, interest }: PrincipalInterestBarProps) {
  const total = principal + interest;
  const segments: Segment[] = [
    { key: "principal", label: "Principal", value: principal, className: "bg-indigo-solid text-white" },
    { key: "interest", label: "Interest", value: interest, className: "bg-amber-solid text-white" },
  ];

  return (
    <div>
      <div className="flex h-[52px] overflow-hidden rounded">
        {segments.map((s, i) => {
          const pct = total > 0 ? (s.value / total) * 100 : 0;
          return (
            <motion.div
              key={s.key}
              initial={{ width: "0%" }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.1 }}
              className={`flex flex-col justify-center overflow-hidden whitespace-nowrap px-3 ${s.className}`}
            >
              {pct > MIN_LABEL_PERCENT && (
                <>
                  <span className="truncate text-label font-semibold normal-case">{s.label}</span>
                  <span className="truncate font-mono text-mono-sm font-bold">{formatLakh(s.value)}</span>
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-3.5 flex flex-wrap gap-5 text-body-sm text-ink-2">
        <LegendDot className="bg-indigo-solid" label="Principal" />
        <LegendDot className="bg-amber-solid" label="Interest" />
      </div>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <i className={`inline-block size-2.5 rounded-sm ${className}`} />
      {label}
    </span>
  );
}
