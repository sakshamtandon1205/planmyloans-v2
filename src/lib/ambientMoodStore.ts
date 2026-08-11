import { create } from "zustand";
import type { StrategyId } from "@/lib/calculations/strategies";

/**
 * Which strategy (if any) the user is currently hovering/focused on, so the
 * site-wide ambient background orbs (mounted once in the root layout) can
 * subtly lean toward that strategy's character. Decoupled via a store
 * rather than props since StrategyCard and AmbientBackground don't share a
 * common parent close enough to thread this through.
 */
interface AmbientMoodState {
  hoveredStrategyId: StrategyId | null;
  setHoveredStrategyId: (id: StrategyId) => void;
  /** Only clears if `id` is still the currently-hovered one, so a fast hover-out-then-into-another-card can't clobber the new hover. */
  clearHoveredStrategyId: (id: StrategyId) => void;
}

export const useAmbientMoodStore = create<AmbientMoodState>((set) => ({
  hoveredStrategyId: null,
  setHoveredStrategyId: (id) => set({ hoveredStrategyId: id }),
  clearHoveredStrategyId: (id) => set((state) => (state.hoveredStrategyId === id ? { hoveredStrategyId: null } : {})),
}));
