"use client";

import { useTheme } from "next-themes";
import { useMounted } from "@/lib/useMounted";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle dark mode"
      aria-pressed={isDark}
      className="flex size-[38px] flex-none items-center justify-center rounded-[10px] border border-line-2 bg-chip text-ink transition-colors hover:text-indigo"
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-[16px]">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-[16px]">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      )}
    </button>
  );
}
