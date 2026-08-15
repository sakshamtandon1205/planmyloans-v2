import { create } from "zustand";

/**
 * Bumped each time the hero's "See 4 strategies" CTA is clicked. The
 * strategies section is always rendered now, so this no longer gates its
 * existence — StrategyTeaserGrid watches this token to replay the same
 * recompute + glow-pulse its own "Show me strategies" button triggers, so
 * arriving via the hero shortcut looks and feels identical to submitting
 * the form directly.
 */
interface StrategiesVisibleState {
  revealToken: number;
  show: () => void;
}

export const useStrategiesVisibleStore = create<StrategiesVisibleState>((set) => ({
  revealToken: 0,
  show: () => set((s) => ({ revealToken: s.revealToken + 1 })),
}));
