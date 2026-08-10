import type { ReactNode } from "react";

interface CalloutProps {
  tone?: "default" | "good" | "warn";
  children: ReactNode;
}

const TONE_STYLES: Record<NonNullable<CalloutProps["tone"]>, string> = {
  default: "border-indigo bg-indigo-soft",
  good: "border-jade bg-jade-soft",
  warn: "border-amber bg-amber-soft",
};

export function Callout({ tone = "default", children }: CalloutProps) {
  return (
    <div
      className={`my-6 rounded-sm border-l-[3px] px-5 py-4 text-body-sm text-ink [&>p]:mb-0 [&>p+p]:mt-2.5 ${TONE_STYLES[tone]}`}
    >
      {children}
    </div>
  );
}
