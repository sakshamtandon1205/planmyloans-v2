import { create } from "zustand";

/** Whether the home page's strategies section (form + 4-card grid) has been revealed yet — hidden until the hero's "See 4 strategies" CTA is clicked. */
interface StrategiesVisibleState {
  visible: boolean;
  show: () => void;
}

export const useStrategiesVisibleStore = create<StrategiesVisibleState>((set) => ({
  visible: false,
  show: () => set({ visible: true }),
}));
