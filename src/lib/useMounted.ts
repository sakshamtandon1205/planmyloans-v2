import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** True only after client hydration — avoids theme-dependent hydration mismatches. */
export function useMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
