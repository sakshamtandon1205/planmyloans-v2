import { useEffect, useState } from "react";

/**
 * JS-measured breakpoint (window.innerWidth on mount + resize), not a CSS
 * media query — used where layout *structure* changes at 860px (planner
 * two-column vs. bottom-sheet, header nav-link visibility), not just
 * styling, so the branch has to be known in JS before render.
 */
export function useIsMobile(breakpoint = 860): boolean {
  // Starts false to match the server-rendered markup (no window on the
  // server) — corrected synchronously in the effect below right after
  // mount, same hydration-safety pattern as useMounted.
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < breakpoint);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [breakpoint]);

  return isMobile;
}
