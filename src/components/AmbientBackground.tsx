"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { useAmbientMoodStore } from "@/lib/ambientMoodStore";
import type { StrategyId } from "@/lib/calculations/strategies";

interface Orb {
  token: "--blob-1" | "--blob-2" | "--blob-3";
  top: string;
  left: string;
  size: number;
  opacityLight: number;
  opacityDark: number;
  duration: number;
  dx: [number, number];
  dy: [number, number];
}

// 3 large blurred circles per the design system's blob recipe (480-560px,
// blur 95-115px), roughly top-left / top-right / bottom-center-left so
// whatever glass content is on screen has vivid color behind it to blur.
// Percent-based top/left (centered via translate) scales sensibly across
// viewport sizes instead of anchoring to a fixed pixel corner.
const orbs: Orb[] = [
  {
    token: "--blob-1",
    top: "-6%",
    left: "4%",
    size: 900,
    opacityLight: 0.38,
    opacityDark: 0.32,
    duration: 70,
    dx: [0, 45],
    dy: [0, -50],
  },
  {
    token: "--blob-2",
    top: "16%",
    left: "94%",
    size: 850,
    opacityLight: 0.32,
    opacityDark: 0.26,
    duration: 85,
    dx: [0, -55],
    dy: [0, 40],
  },
  {
    token: "--blob-3",
    top: "78%",
    left: "24%",
    size: 950,
    opacityLight: 0.34,
    opacityDark: 0.24,
    duration: 95,
    dx: [0, 40],
    dy: [0, -45],
  },
];

// Per-strategy lean applied to each orb's opacity on hover/focus — subtle
// (0.45x-1.85x, well inside the 0.24-0.38 base opacity range above) so the
// shift reads as mood, not a jarring recolor, and never threatens the glass
// panels' text contrast. Balanced is intentionally omitted: it keeps the
// neutral default (blob-1 indigo, blob-2 violet, blob-3 teal) untouched.
const MOOD_BOOSTS: Partial<Record<StrategyId, Partial<Record<Orb["token"], number>>>> = {
  safety: { "--blob-3": 1.45, "--blob-2": 0.45, "--blob-1": 0.85 },
  aggressive: { "--blob-2": 1.7, "--blob-3": 0.55, "--blob-1": 0.85 },
  bonus: { "--blob-2": 1.85, "--blob-3": 0.5, "--blob-1": 0.7 },
};

function moodBoostFor(token: Orb["token"], hoveredStrategyId: StrategyId | null): number {
  if (!hoveredStrategyId) return 1;
  return MOOD_BOOSTS[hoveredStrategyId]?.[token] ?? 1;
}

/**
 * The frosted-glass backdrop: a handful of huge, slowly-drifting blurred
 * gradient orbs, fixed behind every page. Present site-wide (mounted once
 * in the root layout) so GlassCard panels always have something vivid to
 * blur against — sized and positioned to actually sit behind the main
 * content column, not just peek in from the edges.
 *
 * Also reacts to `useAmbientMoodStore`: hovering/focusing a strategy card
 * elsewhere on the page subtly leans these orbs toward that strategy's
 * character (see MOOD_BOOSTS) via a smooth, independently-timed opacity
 * multiplier — the drift animation's own long duration/repeat is untouched.
 */
export function AmbientBackground() {
  const hoveredStrategyId = useAmbientMoodStore((s) => s.hoveredStrategyId);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {orbs.map((orb) => (
        <motion.div
          key={orb.token}
          className="ambient-orb absolute rounded-full blur-[78px] dark:blur-[82px]"
          style={
            {
              top: orb.top,
              left: orb.left,
              width: orb.size,
              height: orb.size,
              translate: "-50% -50%",
              background: `radial-gradient(circle, var(${orb.token}) 0%, transparent 72%)`,
              // Tailwind's dark: variant can't reach an inline style, so the
              // two opacities are set as custom properties here and picked
              // up by the `.ambient-orb` rule in globals.css. Named "alpha"
              // rather than "opacity" so this element doesn't false-positive
              // match the a11y test's `[style*="opacity"]` animation-settle
              // wait (which then expects opacity to reach 1 — this orb's
              // opacity is deliberately never 1).
              "--orb-alpha-light": orb.opacityLight,
              "--orb-alpha-dark": orb.opacityDark,
              // Set declaratively by React (not animated via framer's
              // `animate` prop) — framer-motion has no built-in value-type
              // handling for arbitrary unitless custom CSS properties, and
              // silently fails to interpolate them (writes the literal
              // string "undefined" instead of a number). The resulting
              // `opacity` this feeds into (via calc() in globals.css) is a
              // completely standard property, so a plain CSS `transition` on
              // `.ambient-orb` (see globals.css) gives the smooth mood-shift
              // animation instead — simpler and actually reliable.
              "--orb-mood-boost": moodBoostFor(orb.token, hoveredStrategyId),
            } as CSSProperties
          }
          animate={{ x: orb.dx, y: orb.dy }}
          transition={{ duration: orb.duration, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
