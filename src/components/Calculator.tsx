"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { calculatePayoffMonths, generateAmortizationSchedule } from "@/lib/calculations/emi";
import { simulateBankCorpus, simulateSwpCorpus } from "@/lib/calculations/swp";
import { calculateLoanTaxBenefitFromSchedule } from "@/lib/calculations/tax";
import type { AmortizationResult, CorpusSimulationResult } from "@/lib/calculations/types";
import { AmortizationChart, BalanceChart } from "./BalanceChart";
import { CapitalStack } from "./CapitalStack";
import { ControlPanel } from "./ControlPanel";
import { ResultCards } from "./ResultCards";
import { SustainabilityGauge } from "./SustainabilityGauge";
import { DEFAULT_INPUTS, type CalculatorInputs, type CalculatorResults, type ChartPoint } from "./calculatorTypes";

/** Keeps down payment + MF lumpsum from exceeding own funds, mirroring the original dashboard's clamp. */
function resolveOwnFundsSplit(inputs: CalculatorInputs): { dp: number; mf: number } {
  let { dp, mf } = inputs;
  if (dp + mf > inputs.own) {
    if (dp > inputs.own) dp = inputs.own;
    mf = Math.max(0, inputs.own - dp);
  }
  return { dp, mf };
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export function Calculator() {
  const [inputs, setInputs] = useState<CalculatorInputs>(DEFAULT_INPUTS);
  const [horizonAuto, setHorizonAuto] = useState(true);

  const updateInput = <K extends keyof CalculatorInputs>(key: K, value: CalculatorInputs[K]) => {
    setInputs((prev) => {
      const next = { ...prev, [key]: value };
      const { dp, mf } = resolveOwnFundsSplit(next);
      return { ...next, dp, mf };
    });
  };

  const handleHorizonChange = (value: number) => {
    setHorizonAuto(false);
    setInputs((prev) => ({ ...prev, horizon: value }));
  };

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
    setHorizonAuto(true);
  };

  const results = useMemo<CalculatorResults>(() => computeResults(inputs, horizonAuto), [inputs, horizonAuto]);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={stagger}
      className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-6 px-6 py-10"
    >
      <motion.div variants={fadeUp} className="min-w-0">
        <ResultCards inputs={inputs} results={results} />
      </motion.div>

      <motion.div variants={fadeUp} className="min-w-0">
        <CapitalStack
          price={inputs.price}
          downPayment={inputs.dp}
          mfLumpsum={inputs.mf}
          corpus={results.corpus}
          loan={results.loan}
          corpusLabel={results.corpusLabel}
        />
      </motion.div>

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[340px_1fr] lg:items-start">
        <motion.div variants={fadeUp} className="min-w-0 lg:sticky lg:top-4">
          <ControlPanel
            inputs={inputs}
            onInputChange={updateInput}
            corpus={results.corpus}
            corpusLabel={results.corpusLabel}
            displayHorizon={results.horizonYears}
            onHorizonChange={handleHorizonChange}
            onReset={handleReset}
          />
        </motion.div>

        <div className="flex min-w-0 flex-col gap-6">
          <motion.div variants={fadeUp} className="min-w-0">
            <SustainabilityGauge
              isRisky={results.isRisky}
              corpusLabel={results.corpusLabel}
              corpus={results.corpus}
              annualWithdrawRate={results.annualWithdrawRate}
              returnPct={results.corpusReturnPercent}
              gaugePct={results.gaugePct}
              depletedAtMonth={results.corpusSim.depletedAtMonth}
              payoffYears={results.payoffYears}
              finalBalance={results.corpusSim.finalBalance}
            />
          </motion.div>

          <motion.div variants={fadeUp} className="min-w-0">
            <BalanceChart series={results.chartSeries} corpusLabel={results.corpusLabel} />
          </motion.div>

          <motion.div variants={fadeUp} className="min-w-0">
            <AmortizationChart series={results.chartSeries} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function computeResults(inputs: CalculatorInputs, horizonAuto: boolean): CalculatorResults {
  const { price, own, mfr, mode, swr, bankr, lr, tenure, extra, stepup, stepupemi, swptax, taxrate, horizon } =
    inputs;
  const { dp, mf } = resolveOwnFundsSplit(inputs);

  const loan = Math.max(0, price - dp);
  const corpus = Math.max(0, own - dp - mf);
  const corpusReturnPercent = mode === "bank" ? bankr : swr;
  const corpusLabel = mode === "bank" ? "Bank account" : "SWP corpus";

  const tenureMonths = tenure * 12;

  // Fast pass over the full tenure to find the natural payoff month, used to
  // auto-follow the horizon slider until the user overrides it directly.
  const naturalPayoffMonths = calculatePayoffMonths({
    principal: loan,
    annualRatePercent: lr,
    tenureMonths,
    extraMonthlyPrepayment: extra,
    annualPrepayStepUpPercent: stepup,
    annualEmiStepUpPercent: stepupemi,
  });

  const horizonYears = horizonAuto ? Math.min(30, Math.max(1, Math.ceil(naturalPayoffMonths / 12))) : horizon;
  const horizonMonths = horizonYears * 12;

  const amortization = generateAmortizationSchedule({
    principal: loan,
    annualRatePercent: lr,
    tenureMonths,
    extraMonthlyPrepayment: extra,
    annualPrepayStepUpPercent: stepup,
    annualEmiStepUpPercent: stepupemi,
    simulationMonths: horizonMonths,
  });

  const emiSchedule = amortization.schedule.map((row) => row.emi);

  const corpusSim =
    mode === "swp"
      ? simulateSwpCorpus({
          initialCorpus: corpus,
          annualReturnPercent: swr,
          emiSchedule,
          payoffMonths: amortization.payoffMonths,
          horizonMonths,
          incomeTaxRatePercent: taxrate,
          capitalGainsTaxRatePercent: swptax,
        })
      : simulateBankCorpus({
          initialCorpus: corpus,
          annualReturnPercent: bankr,
          emiSchedule,
          payoffMonths: amortization.payoffMonths,
          horizonMonths,
          incomeTaxRatePercent: taxrate,
        });

  const taxBenefit = calculateLoanTaxBenefitFromSchedule(amortization.schedule, taxrate);

  const mfMonthlyRate = Math.pow(1 + mfr / 100, 1 / 12) - 1;
  const mfFutureValue = mf * Math.pow(1 + mfMonthlyRate, horizonMonths);

  const interestSaved = amortization.baselineInterest - amortization.totalInterestPaid;
  const netInterest = amortization.totalInterestPaid - taxBenefit.totalTaxSaved;
  const totalWealth = mfFutureValue + Math.max(0, corpusSim.finalBalance);
  const payoffYears = amortization.payoffMonths / 12;
  const withdrawMonthsDisplay = Math.min(horizonMonths, amortization.payoffMonths);

  const annualWithdrawRate = corpus > 0 ? ((amortization.emi * 12) / corpus) * 100 : 0;
  const gaugePct = Math.min(100, (annualWithdrawRate / (corpusReturnPercent * 2 || 1)) * 100);
  const isRisky = corpusSim.depletedAtMonth !== null || annualWithdrawRate > corpusReturnPercent + 2;

  const chartSeries = buildChartSeries(mf, corpus, loan, mfMonthlyRate, amortization, corpusSim, horizonMonths);

  return {
    loan,
    corpus,
    corpusLabel,
    corpusReturnPercent,
    horizonYears,
    amortization,
    corpusSim,
    taxBenefit,
    interestSaved,
    netInterest,
    mfFutureValue,
    totalWealth,
    payoffYears,
    withdrawMonthsDisplay,
    annualWithdrawRate,
    isRisky,
    gaugePct,
    chartSeries,
  };
}

function buildChartSeries(
  mf: number,
  corpus: number,
  loan: number,
  mfMonthlyRate: number,
  amortization: AmortizationResult,
  corpusSim: CorpusSimulationResult,
  horizonMonths: number,
): ChartPoint[] {
  const sampleEvery = Math.max(1, Math.round(horizonMonths / 48));
  const points: ChartPoint[] = [{ month: 0, monthLabel: "0.0y", mf, corpus, loan, interest: 0, principal: 0 }];

  for (let month = 1; month <= horizonMonths; month++) {
    if (month % sampleEvery === 0 || month === horizonMonths) {
      const amortRow = amortization.schedule[month - 1];
      const corpusRow = corpusSim.schedule[month - 1];
      points.push({
        month,
        monthLabel: `${(month / 12).toFixed(1)}y`,
        mf: mf * Math.pow(1 + mfMonthlyRate, month),
        corpus: corpusRow.balance,
        loan: amortRow.balance,
        interest: amortRow.interestPortion,
        principal: amortRow.principalPortion,
      });
    }
  }

  return points;
}
