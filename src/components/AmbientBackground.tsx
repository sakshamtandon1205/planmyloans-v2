"use client";

import { motion } from "framer-motion";

interface Orb {
  token: "--indigo" | "--jade" | "--amber";
  className: string;
  duration: number;
  dx: [number, number];
  dy: [number, number];
}

// Positioned toward the corners, mostly outside the centered max-w-6xl
// content column, so glass panels sit in each orb's soft falloff rather
// than its saturated core — keeps the "glass over something" effect
// without fighting text contrast (see the --glass-* tokens in globals.css).
const orbs: Orb[] = [
  {
    token: "--indigo",
    className: "-left-56 -top-48 size-[640px] opacity-[0.12] dark:opacity-[0.26]",
    duration: 75,
    dx: [0, 60],
    dy: [0, 34],
  },
  {
    token: "--jade",
    className: "-right-48 -bottom-56 size-[700px] opacity-[0.12] dark:opacity-[0.26]",
    duration: 90,
    dx: [0, -46],
    dy: [0, 42],
  },
  {
    token: "--amber",
    className: "-right-32 top-1/3 size-[420px] opacity-[0.06] dark:opacity-[0.16]",
    duration: 100,
    dx: [0, 32],
    dy: [0, -38],
  },
];

/**
 * The frosted-glass backdrop: a handful of huge, slowly-drifting blurred
 * gradient orbs, fixed behind every page. Present site-wide (mounted once
 * in the root layout) so GlassCard panels always have something to blur
 * against, not just on the homepage.
 */
export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {orbs.map((orb) => (
        <motion.div
          key={orb.token}
          className={`absolute rounded-full blur-[110px] ${orb.className}`}
          style={{ background: `radial-gradient(circle, var(${orb.token}) 0%, transparent 70%)` }}
          animate={{ x: orb.dx, y: orb.dy }}
          transition={{ duration: orb.duration, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
