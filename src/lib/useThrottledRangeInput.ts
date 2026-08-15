import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Rapidly dragging a native range input fires many `input` events per
 * frame. Every slider on this page wires `onChange` straight into a Zustand
 * store write and/or Calculator's full recalculation (EMI schedule, corpus
 * simulation, chart series, amortization table) — calling that synchronously
 * on every single event lets a fast back-and-forth drag queue up dozens of
 * store writes before React ever gets a frame to flush them. That's what let
 * the store↔Calculator sync effects (see the comment above them in
 * Calculator.tsx) observe a stale closure mid-storm and ping-pong into
 * "Maximum update depth exceeded" instead of settling after one hop.
 *
 * This coalesces rapid-fire input into at most one committed `onChange` per
 * animation frame, so downstream state (and the effects reading it) only
 * ever sees one settled value per frame instead of racing several. The
 * slider's own visual position (`displayValue`) still updates on every
 * event, so dragging remains instantly responsive — only the expensive
 * propagation is throttled, not the handle itself.
 */
export function useThrottledRangeInput(value: number, onChange: (value: number) => void) {
  const [displayValue, setDisplayValue] = useState(value);
  const pendingRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Follow external changes (store updates, reset, "use this plan", typing
  // in the paired number box) whenever nothing is actively being dragged.
  useEffect(() => {
    if (pendingRef.current === null) setDisplayValue(value);
  }, [value]);

  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  const handleChange = useCallback((next: number) => {
    setDisplayValue(next);
    pendingRef.current = next;
    if (frameRef.current === null) {
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        const committed = pendingRef.current;
        pendingRef.current = null;
        if (committed !== null) onChangeRef.current(committed);
      });
    }
  }, []);

  return { displayValue, handleChange };
}
