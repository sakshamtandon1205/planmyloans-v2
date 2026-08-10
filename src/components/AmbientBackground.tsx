"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";

interface Orb {
  token: "--indigo" | "--jade" | "--amber";
  top: string;
  left: string;
  size: number;
  opacityLight: number;
  opacityDark: number;
  duration: number;
  dx: [number, number];
  dy: [number, number];
}

// Spread across the viewport (not tucked into corners) and sized bigger
// than the viewport itself, so whatever content is on screen — Capital
// Stack, the control panel, the result-card grid — actually has vivid
// color behind it for the glass panels to blur. Percent-based top/left
// (centered via translate) means this scales sensibly across viewport
// sizes instead of anchoring to a fixed pixel corner.
const orbs: Orb[] = [
  {
    token: "--indigo",
    top: "12%",
    left: "18%",
    size: 1100,
    opacityLight: 0.38,
    opacityDark: 0.55,
    duration: 75,
    dx: [0, 70],
    dy: [0, 40],
  },
  {
    token: "--jade",
    top: "58%",
    left: "82%",
    size: 1200,
    opacityLight: 0.35,
    opacityDark: 0.52,
    duration: 90,
    dx: [0, -60],
    dy: [0, 50],
  },
  {
    token: "--amber",
    top: "88%",
    left: "35%",
    size: 850,
    opacityLight: 0.2,
    opacityDark: 0.32,
    duration: 100,
    dx: [0, 40],
    dy: [0, -45],
  },
];

/**
 * The frosted-glass backdrop: a handful of huge, slowly-drifting blurred
 * gradient orbs, fixed behind every page. Present site-wide (mounted once
 * in the root layout) so GlassCard panels always have something vivid to
 * blur against — sized and positioned to actually sit behind the main
 * content column, not just peek in from the edges.
 */
export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {orbs.map((orb) => (
        <motion.div
          key={orb.token}
          className="ambient-orb absolute rounded-full blur-[140px] dark:blur-[150px]"
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
            } as CSSProperties
          }
          animate={{ x: orb.dx, y: orb.dy }}
          transition={{ duration: orb.duration, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
