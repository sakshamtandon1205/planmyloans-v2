import type { ReactNode } from "react";

interface BadgeProps {
  tone?: "indigo" | "jade" | "amber";
  children: ReactNode;
}

const TONE_STYLES: Record<NonNullable<BadgeProps["tone"]>, string> = {
  indigo: "bg-indigo-solid text-white",
  jade: "bg-jade-solid text-white",
  amber: "bg-amber-solid text-white",
};

export function Badge({ tone = "indigo", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-label font-semibold uppercase tracking-wide ${TONE_STYLES[tone]}`}
    >
      {children}
    </span>
  );
}
