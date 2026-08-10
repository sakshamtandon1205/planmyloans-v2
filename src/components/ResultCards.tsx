import { motion } from "framer-motion";
import { formatINR, formatLakh } from "@/lib/format";
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

export function ResultCards({ inputs, results }: ResultCardsProps) {
  const { amortization, corpusSim, taxBenefit } = results;
  const { extra, stepup: stepupRate, stepupemi: stepupEmiRate, tenure, mf, mode } = inputs;

  const emiNoteParts: string[] = [];
  if (stepupEmiRate > 0) {
    emiNoteParts.push(`EMI itself rises ${stepupEmiRate}%/yr, to ${formatINR(amortization.lastEmiUsed)} by payoff`);
  }
  if (extra > 0) {
    emiNoteParts.push(
      `+ ${formatINR(extra)}/mo prepay${stepupRate > 0 ? `, +${stepupRate}%/yr` : ""} from salary`,
    );
  }
  const emiNote = emiNoteParts.length ? emiNoteParts.join("; ") : `over ${tenure} yr tenure (no prepay)`;

  const hasPrepay = extra > 0 || stepupEmiRate > 0;
  const payoffNote = hasPrepay
    ? `vs. ${tenure} yrs originally, ${(tenure - results.payoffYears).toFixed(1)} yrs earlier`
    : "matches original tenure";
  const interestNote = hasPrepay ? "actual, with prepayment" : "over full tenure";

  const corpusNote =
    corpusSim.depletedAtMonth !== null
      ? `depleted in month ${corpusSim.depletedAtMonth} of ${results.withdrawMonthsDisplay}`
      : `after funding ${results.withdrawMonthsDisplay} EMIs`;

  const swpTaxLabel = mode === "bank" ? "Tax paid on bank interest" : "Tax paid on SWP withdrawals";
  const withdrawnTotal = corpusSim.totalTaxPaid + results.withdrawMonthsDisplay * amortization.emi;
  const swpTaxNote =
    results.corpus > 0
      ? withdrawnTotal > 0
        ? `${((corpusSim.totalTaxPaid / withdrawnTotal) * 100).toFixed(1)}% of what you withdrew`
        : "0.0% of what you withdrew"
      : `no ${results.corpusLabel.toLowerCase()}`;

  return (
    <div className="space-y-6">
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

      <div>
        <div className="mb-3 text-label uppercase text-ink-3">Loan &amp; growth outcome</div>
        <motion.div initial="hidden" animate="show" variants={gridVariants} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card label="Loan amount" value={formatINR(results.loan)} note="at chosen down payment" />
          <Card label="Monthly EMI" value={`${formatINR(amortization.emi)}/mo`} tone="text-indigo" note={emiNote} />
          <Card
            label="Actual loan payoff"
            value={`${results.payoffYears.toFixed(1)} yrs (${amortization.payoffMonths} mo)`}
            tone="text-jade"
            note={payoffNote}
          />
          <Card
            label="MF corpus after horizon"
            value={formatINR(results.mfFutureValue)}
            tone="text-jade"
            note={`from ${formatLakh(mf)} lumpsum, untouched`}
          />
        </motion.div>
      </div>

      <motion.div initial="hidden" animate="show" variants={gridVariants} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card label="Total interest paid" value={formatINR(amortization.totalInterestPaid)} tone="text-amber" note={interestNote} />
        <Card
          label="Interest saved by prepaying"
          value={formatINR(Math.max(0, results.interestSaved))}
          tone="text-indigo"
          note="vs. EMI-only over full tenure"
        />
        <Card
          label={`${results.corpusLabel} after horizon`}
          value={formatINR(Math.max(0, corpusSim.finalBalance))}
          tone={corpusSim.finalBalance <= 0 && corpusSim.depletedAtMonth !== null ? "text-coral" : "text-jade"}
          note={corpusNote}
        />
        <Card label="Total wealth after horizon" value={formatINR(results.totalWealth)} tone="text-indigo" note={`MF + ${results.corpusLabel.toLowerCase()}, loan-adjusted`} />
      </motion.div>

      <div>
        <div className="mb-3 text-label uppercase text-ink-3">Tax impact</div>
        <motion.div initial="hidden" animate="show" variants={gridVariants} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card label={swpTaxLabel} value={formatINR(corpusSim.totalTaxPaid)} tone="text-amber" note={swpTaxNote} />
          <Card label="Tax saved via loan (24b + 80C)" value={formatINR(taxBenefit.totalTaxSaved)} tone="text-jade" note="Sec 24(b) ₹2L + 80C ₹1.5L annual caps" />
          <Card label="Net effective interest cost" value={formatINR(Math.max(0, results.netInterest))} tone="text-indigo" note="interest paid minus tax saved" />
        </motion.div>
      </div>
    </div>
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

function Card({
  label,
  value,
  note,
  tone = "text-ink",
}: {
  label: string;
  value: string;
  note?: string;
  tone?: string;
}) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -2, transition: hoverSpring }}
      className="min-w-0 rounded border border-line bg-surface p-4 shadow-sm"
    >
      <div className="mb-2.5 text-label uppercase leading-snug text-ink-3">{label}</div>
      <motion.div
        key={value}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={`break-words font-mono text-mono font-bold ${tone}`}
      >
        {value}
      </motion.div>
      {note && <p className="mt-2 text-caption leading-snug text-ink-3">{note}</p>}
    </motion.div>
  );
}
