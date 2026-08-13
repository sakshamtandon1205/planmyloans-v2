"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useIsMobile } from "@/lib/useIsMobile";
import { useStrategiesVisibleStore } from "@/lib/strategiesVisibleStore";
import { QuickEstimate } from "./QuickEstimate";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const isMobile = useIsMobile();
  const showStrategies = useStrategiesVisibleStore((s) => s.show);

  const handleSeeStrategies = () => {
    showStrategies();
    requestAnimationFrame(() => {
      document.getElementById("strategies")?.scrollIntoView({ behavior: "smooth" });
    });
  };

  // As the hero scrolls past (before the calculator comes into view), it
  // recedes gently rather than just cutting off — one continuous, restrained
  // motion, not a separate animated stage.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.35]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -24]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.98]);

  return (
    <section
      ref={ref}
      className={`mx-auto grid w-full max-w-6xl items-center gap-11 px-6 pt-9 pb-8 ${
        isMobile ? "grid-cols-1" : "grid-cols-[1.05fr_0.95fr]"
      }`}
    >
      <motion.div
        style={{ opacity, y, scale }}
        initial={{ opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.32, ease: "easeOut" }}
      >
        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-chip px-3.5 py-[7px] text-[12.5px] font-semibold text-accent-text ring-1 ring-line-2">
          <span className="size-1.5 rounded-full bg-jade" />
          Free · No signup · Recalculates live
        </div>
        <h1 className="mb-[18px] font-heading text-display font-extrabold tracking-[-0.02em] text-ink">
          Plan your home loan{" "}
          <span className="bg-[linear-gradient(135deg,var(--indigo),var(--jade))] bg-clip-text text-transparent">
            against your own capital.
          </span>
        </h1>
        <p className="mb-7 max-w-[500px] text-body-lg leading-[1.6] text-ink-2">
          Split funds across a mutual fund lumpsum, an EMI-funding SWP, and a down payment — see prepayment savings
          and tax impact, live.
        </p>
        <div className="flex flex-wrap gap-3.5">
          <button
            type="button"
            onClick={handleSeeStrategies}
            className="cta-tap hover-cta-primary rounded-xl bg-[linear-gradient(135deg,var(--indigo),var(--jade))] px-6 py-3.5 font-heading text-[15.5px] font-bold text-white shadow-[0_8px_22px_-8px_var(--indigo)]"
          >
            See 4 strategies
          </button>
          <a
            href="#planner"
            className="cta-tap hover-cta-secondary rounded-xl border border-line-2 bg-chip px-6 py-3.5 font-heading text-[15.5px] font-bold text-ink"
          >
            Build my plan
          </a>
        </div>
      </motion.div>

      <QuickEstimate />
    </section>
  );
}
