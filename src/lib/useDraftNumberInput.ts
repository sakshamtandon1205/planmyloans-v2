import { useEffect, useRef } from "react";

/**
 * Uncontrolled numeric input backed by a ref, not React state. A controlled
 * `<input value={n}>` has to re-render on every keystroke (via setState) to
 * echo what was just typed, and that extra render is enough to perturb the
 * timing of Calculator's store-sync effects (see the comment above them in
 * Calculator.tsx) into fighting each other. Writing the DOM value directly
 * sidesteps that entirely: the browser already shows what the user typed
 * without React's help, so the field is only ever written to imperatively —
 * on blur (normalizing/defaulting to 0) or when an external change arrives
 * while the field isn't focused.
 */
export function useDraftNumberInput(value: number, onCommit: (value: number) => void) {
  const ref = useRef<HTMLInputElement>(null);
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current && ref.current) ref.current.value = String(value);
  }, [value]);

  return {
    ref,
    defaultValue: value,
    onFocus: () => {
      focused.current = true;
    },
    onChange: (raw: string) => {
      // Only digits and a single decimal point — these fields are all
      // non-negative (loan amount, rate, tenure, prepay %, etc.).
      const cleaned = raw.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
      if (ref.current && ref.current.value !== cleaned) ref.current.value = cleaned;
      if (cleaned !== "" && cleaned !== "." && !Number.isNaN(+cleaned)) onCommit(+cleaned);
    },
    onBlur: () => {
      focused.current = false;
      const current = ref.current?.value ?? "";
      if (current === "" || current === "." || Number.isNaN(+current)) {
        if (ref.current) ref.current.value = "0";
        onCommit(0);
      } else if (ref.current) {
        ref.current.value = String(+current);
      }
    },
  };
}
