import { motion } from "framer-motion";
import { formatINR, formatLakh } from "@/lib/format";
import { useCountUp } from "@/lib/useCountUp";
import type { CalculatorInputs, CalculatorResults } from "./calculatorTypes";

interface ResultCardsProps {
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

const hoverSpring = { type: "spring" as const, stiffness: 300, damping: 20 };

/** The planner's 2x3 "Loan & growth outcome" metric grid — the SWP/bank corpus card gets an amber warning border once its funding runs risky. */
export function ResultCards({ inputs, results }: ResultCardsProps) {
  const { amortization, corpusSim } = results;
  const { extra, stepup: stepupRate, stepupemi: stepupEmiRate, tenure, mf } = inputs;

  const emiNoteParts: string[] = [];
  if (stepupEmiRate > 0) {
    emiNoteParts.push(`EMI itself rises ${stepupEmiRate}%/yr, to ${formatINR(amortization.lastEmiUsed)} by payoff`);
  }
  if (extra > 0) {
    emiNoteParts.push(`+ ${formatINR(extra)}/mo prepay${stepupRate > 0 ? `, +${stepupRate}%/yr` : ""} from salary`);
  }
  const emiNote = emiNoteParts.length ? emiNoteParts.join("; ") : `over ${tenure} yr tenure (no prepay)`;

  const hasPrepay = extra > 0 || stepupEmiRate > 0;
  const payoffNote = hasPrepay
    ? `vs. ${tenure} yrs originally, ${(tenure - results.payoffYears).toFixed(1)} yrs earlier`
    : "matches original tenure";

  const corpusNote =
    corpusSim.depletedAtMonth !== null
      ? `depleted in month ${corpusSim.depletedAtMonth} of ${results.withdrawMonthsDisplay}`
      : `after funding ${results.withdrawMonthsDisplay} EMIs`;

  return (
    <motion.div initial="hidden" animate="show" variants={gridVariants} className="grid grid-cols-2 gap-[11px]">
      <Card label="Loan amount" amount={results.loan} format={(v) => `₹${formatLakh(v)}`} sub="principal borrowed" testId="result-loan" />
      <Card
        label="Monthly EMI"
        amount={amortization.emi}
        format={(v) => `${formatINR(v)}/mo`}
        sub={emiNote}
        testId="result-emi"
      />
      <Card
        label="Loan payoff"
        value={`${results.payoffYears.toFixed(1)} yrs (${amortization.payoffMonths} mo)`}
        sub={payoffNote}
        testId="result-payoff"
      />
      <Card
        label="MF corpus after horizon"
        amount={results.mfFutureValue}
        format={(v) => `₹${formatLakh(v)}`}
        sub={`from ${formatLakh(mf)} lumpsum, untouched`}
        tone="text-jade"
      />
      <Card
        label="Interest saved"
        amount={Math.max(0, results.interestSaved)}
        format={(v) => `₹${formatLakh(v)}`}
        sub="vs. EMI-only over full tenure"
        testId="result-total-interest"
      />
      <Card
        label={`${results.corpusLabel} after horizon`}
        amount={Math.max(0, corpusSim.finalBalance)}
        format={(v) => `₹${formatLakh(v)}`}
        sub={corpusNote}
        tone={results.isRisky ? "text-warn-dot" : "text-jade"}
        warn={results.isRisky}
      />
      <Card
        label="Total wealth after horizon"
        amount={results.totalWealth}
        format={(v) => `₹${formatLakh(v)}`}
        sub={`MF + ${results.corpusLabel.toLowerCase()}, loan-adjusted`}
        tone="text-accent-text"
      />
    </motion.div>
  );
}

interface CardProps {
  label: string;
  /** A raw numeric quantity to count up smoothly on change — mutually exclusive with `value` (used for the one card, Loan payoff, whose text isn't a single number). */
  amount?: number;
  format?: (v: number) => string;
  value?: string;
  sub: string;
  tone?: string;
  warn?: boolean;
  testId?: string;
}

function Card({ label, amount, format, value, sub, tone = "text-ink", warn = false, testId }: CardProps) {
  const displayAmount = useCountUp(amount ?? 0);
  const shown = amount !== undefined && format ? format(displayAmount) : value;

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -3, scale: 1.015, transition: hoverSpring }}
      style={warn ? { borderColor: "var(--warn-border)" } : undefined}
      className="glass-panel-sm min-w-0 p-3.5"
    >
      <div className="mb-[7px] text-[11px] font-semibold leading-snug text-ink-3">{label}</div>
      <div data-testid={testId} className={`break-words font-mono text-[19px] font-bold ${tone}`}>
        {shown}
      </div>
      <p className="mt-[3px] text-[11px] leading-snug text-ink-4">{sub}</p>
    </motion.div>
  );
}
