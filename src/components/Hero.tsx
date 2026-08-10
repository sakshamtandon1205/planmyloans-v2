"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  // As the hero scrolls past (before the calculator comes into view), it
  // recedes gently rather than just cutting off — one continuous, restrained
  // motion, not a separate animated stage.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.35]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -24]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.98]);

  return (
    <motion.section ref={ref} style={{ opacity, y, scale }} className="mx-auto w-full max-w-6xl px-6 pt-10 pb-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <span className="mb-3 inline-flex items-center gap-2 text-label uppercase text-indigo">
          <span className="inline-flex size-4 items-center justify-center rounded-sm bg-indigo-solid text-caption leading-none text-white">
            ◆
          </span>
          Property Financing Model
        </span>
        <h1 className="mb-3 font-heading text-display font-semibold text-ink">
          Plan your home loan <span className="text-indigo">against your own capital</span>
        </h1>
        <p className="max-w-2xl text-body text-ink-2">
          See how your funds, split across a lumpsum mutual fund, an EMI-funding corpus, and a down payment, plus
          any monthly prepayment from salary, stack up against a home loan. Every figure recalculates live.
        </p>
      </motion.div>
    </motion.section>
  );
}
