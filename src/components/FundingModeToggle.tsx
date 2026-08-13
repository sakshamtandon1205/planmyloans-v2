import type { FundingMode } from "@/lib/calculations/types";

interface FundingModeToggleProps {
  mode: FundingMode;
  onChange: (mode: FundingMode) => void;
}

export function FundingModeToggle({ mode, onChange }: FundingModeToggleProps) {
  return (
    <div className="flex gap-1.5 rounded bg-surface-2 p-1">
      <button
        type="button"
        onClick={() => onChange("swp")}
        aria-pressed={mode === "swp"}
        className={`hover-segment flex-1 rounded-sm px-2 py-2 text-body-sm font-medium transition-colors ${
          mode === "swp" ? "bg-surface text-indigo shadow-sm" : "text-ink-2 hover:text-ink"
        }`}
      >
        SWP (mutual fund)
      </button>
      <button
        type="button"
        onClick={() => onChange("bank")}
        aria-pressed={mode === "bank"}
        className={`hover-segment flex-1 rounded-sm px-2 py-2 text-body-sm font-medium transition-colors ${
          mode === "bank" ? "bg-surface text-indigo shadow-sm" : "text-ink-2 hover:text-ink"
        }`}
      >
        Bank account
      </button>
    </div>
  );
}
