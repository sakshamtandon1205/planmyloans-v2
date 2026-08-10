import { motion } from "framer-motion";
import { formatINR } from "@/lib/format";
import type { CalculatorInputs, CalculatorResults } from "./calculatorTypes";

interface HeroStatsProps {
  inputs: CalculatorInputs;
  results: CalculatorResults;
}

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

export function HeroStats({ inputs, results }: HeroStatsProps) {
  const { amortization } = results;
  const { tenure } = inputs;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={gridVariants}
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      <HeroCell
        label="Monthly EMI"
        value={formatINR(amortization.emi)}
        tone="text-indigo"
        sub={`for ${tenure} yr tenure`}
        testId="result-emi"
      />
      <HeroCell
        label="Loan clears in"
        value={`${results.payoffYears.toFixed(1)} yrs`}
        tone="text-jade"
        sub={`${amortization.payoffMonths} months`}
        testId="result-payoff"
      />
      <HeroCell
        label="Total interest"
        value={formatINR(amortization.totalInterestPaid)}
        tone="text-amber"
        sub={`net ${formatINR(Math.max(0, results.netInterest))} after tax`}
      />
      <HeroCell
        label="Wealth after horizon"
        value={formatINR(results.totalWealth)}
        tone="text-indigo"
        sub={`at ${results.horizonYears} yr horizon`}
      />
    </motion.div>
  );
}

function HeroCell({
  label,
  value,
  sub,
  tone,
  testId,
}: {
  label: string;
  value: string;
  sub: string;
  tone: string;
  testId?: string;
}) {
  return (
    <motion.div variants={cardVariants} className="min-w-0 rounded-lg border border-line bg-surface p-4 shadow-sm">
      <div className="mb-1.5 text-label uppercase text-ink-3">{label}</div>
      <motion.div
        key={value}
        data-testid={testId}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={`break-words font-mono text-mono-lg font-bold ${tone}`}
      >
        {value}
      </motion.div>
      <div className="mt-1.5 font-mono text-caption text-ink-3">{sub}</div>
    </motion.div>
  );
}
