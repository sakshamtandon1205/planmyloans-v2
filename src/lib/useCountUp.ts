import { useEffect, useState } from "react";
import { useMotionValue, useSpring } from "framer-motion";

/** Smoothly counts a displayed number toward `value` instead of jumping on every input change. */
export function useCountUp(value: number) {
  const motionValue = useMotionValue(value);
  // Stiff and fast: a big jump should read as "already updated" within a
  // couple hundred ms, not visibly lag behind the rest of the page.
  const spring = useSpring(motionValue, { stiffness: 400, damping: 40, mass: 0.5 });
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => spring.on("change", (v) => setDisplay(v)), [spring]);

  return display;
}
