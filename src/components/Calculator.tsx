"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useIsMobile } from "@/lib/useIsMobile";
import { calculatePayoffMonths, generateAmortizationSchedule } from "@/lib/calculations/emi";
import { calculateMfFutureValue } from "@/lib/calculations/mf";
import { simulateBankCorpus, simulateSwpCorpus } from "@/lib/calculations/swp";
import { useSharedInputsStore } from "@/lib/sharedInputsStore";
import { calculateLoanTaxBenefitFromSchedule } from "@/lib/calculations/tax";
import type { AmortizationResult, CorpusSimulationResult } from "@/lib/calculations/types";
import { AmortizationChart, BalanceChart } from "./BalanceChart";
import { AmortizationTable } from "./AmortizationTable";
import { CapitalStack } from "./CapitalStack";
import { ControlPanel } from "./ControlPanel";
import { MobileInputSheet } from "./MobileInputSheet";
import { ResultCards } from "./ResultCards";
import { SustainabilityGauge } from "./SustainabilityGauge";
import { TaxImpactCard } from "./TaxImpactCard";
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

  const updateInput = useCallback(<K extends keyof CalculatorInputs>(key: K, value: CalculatorInputs[K]) => {
    setInputs((prev) => {
      const next = { ...prev, [key]: value };
      const { dp, mf } = resolveOwnFundsSplit(next);
      return { ...next, dp, mf };
    });
  }, []);

  // Home loan interest rate, tenure, and loan amount (= price − down
  // payment) are shared live with QuickEstimate via a Zustand store.
  //
  // Each direction is its OWN effect, triggered ONLY by its own source of
  // truth changing — never by the value it's writing to. The "push to
  // store" effects below read the store with getState() (a snapshot, not a
  // subscription) so they don't re-fire when the store changes; the "pull
  // from store" effects use setInputs' functional form to read the latest
  // local state without needing it in the dependency array. An earlier
  // version subscribed to *both* values in *both* effects and compared
  // them — that makes each effect fire on the other's write too, and since
  // they disagree about which side is authoritative, they fight forever
  // ("Maximum update depth exceeded", caught by hand-testing the sync).
  const storeRate = useSharedInputsStore((s) => s.rate);
  const storeTenure = useSharedInputsStore((s) => s.tenure);
  const storeLoanAmount = useSharedInputsStore((s) => s.loanAmount);

  useEffect(() => {
    const { rate, setRate } = useSharedInputsStore.getState();
    if (inputs.lr !== rate) setRate(inputs.lr);
  }, [inputs.lr]);
  useEffect(() => {
    const { tenure, setTenure } = useSharedInputsStore.getState();
    if (inputs.tenure !== tenure) setTenure(inputs.tenure);
  }, [inputs.tenure]);
  useEffect(() => {
    const { loanAmount, setLoanAmount } = useSharedInputsStore.getState();
    const derivedLoan = inputs.price - inputs.dp;
    if (derivedLoan !== loanAmount) setLoanAmount(derivedLoan);
  }, [inputs.price, inputs.dp]);

  // One-way: QuickEstimate has no prepayment inputs of its own, it only
  // reads these to compute its actual (not baseline) totals — see the
  // store's doc comment.
  useEffect(() => {
    const { extraPrepayment, setExtraPrepayment } = useSharedInputsStore.getState();
    if (inputs.extra !== extraPrepayment) setExtraPrepayment(inputs.extra);
  }, [inputs.extra]);
  useEffect(() => {
    const { prepayStepUpPercent, setPrepayStepUpPercent } = useSharedInputsStore.getState();
    if (inputs.stepup !== prepayStepUpPercent) setPrepayStepUpPercent(inputs.stepup);
  }, [inputs.stepup]);
  useEffect(() => {
    const { emiStepUpPercent, setEmiStepUpPercent } = useSharedInputsStore.getState();
    if (inputs.stepupemi !== emiStepUpPercent) setEmiStepUpPercent(inputs.stepupemi);
  }, [inputs.stepupemi]);

  // One-way, store -> Planner: a strategy card's "Use this plan" writes a
  // full snapshot into the store and bumps applyStrategyToken. Gated on the
  // token (not the payload's identity) so re-applying the *same* strategy
  // still re-triggers this pull — matching the reasoning documented on the
  // store itself for why each sync direction is its own effect.
  const appliedStrategy = useSharedInputsStore((s) => s.appliedStrategy);
  const applyStrategyToken = useSharedInputsStore((s) => s.applyStrategyToken);
  useEffect(() => {
    if (applyStrategyToken === 0 || !appliedStrategy) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot pull from an external store write, token-gated so it fires exactly once per "Use this plan" click.
    setInputs((prev) => {
      const next: CalculatorInputs = {
        ...prev,
        price: appliedStrategy.price,
        own: appliedStrategy.ownFunds,
        dp: appliedStrategy.downPayment,
        mf: appliedStrategy.mfLumpsum,
        mode: appliedStrategy.fundingMode,
        lr: appliedStrategy.rate,
        tenure: appliedStrategy.tenure,
        extra: appliedStrategy.extraPrepayment,
        stepup: appliedStrategy.prepayStepUpPercent,
        annualLumpSumCount: appliedStrategy.annualLumpSumCount,
      };
      const { dp, mf } = resolveOwnFundsSplit(next);
      return { ...next, dp, mf };
    });
    setHorizonAuto(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally token-gated: appliedStrategy is read but must not be a dep, or re-applying an identical-looking payload wouldn't be distinguishable from "already handled".
  }, [applyStrategyToken]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pulls the shared store (an external system) into local state; bails via `return prev` when already equal, so it settles rather than looping (see the pairing effects above).
    setInputs((prev) => {
      if (prev.lr === storeRate) return prev;
      const next = { ...prev, lr: storeRate };
      const { dp, mf } = resolveOwnFundsSplit(next);
      return { ...next, dp, mf };
    });
  }, [storeRate]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- same external-store pull as above.
    setInputs((prev) => {
      if (prev.tenure === storeTenure) return prev;
      const next = { ...prev, tenure: storeTenure };
      const { dp, mf } = resolveOwnFundsSplit(next);
      return { ...next, dp, mf };
    });
  }, [storeTenure]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- same external-store pull as above.
    setInputs((prev) => {
      if (prev.price - prev.dp === storeLoanAmount) return prev;
      const next = { ...prev, price: storeLoanAmount + prev.dp };
      const { dp, mf } = resolveOwnFundsSplit(next);
      return { ...next, dp, mf };
    });
  }, [storeLoanAmount]);

  const handleHorizonChange = (value: number) => {
    setHorizonAuto(false);
    setInputs((prev) => ({ ...prev, horizon: value }));
  };

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
    setHorizonAuto(true);
  };

  const results = useMemo<CalculatorResults>(() => computeResults(inputs, horizonAuto), [inputs, horizonAuto]);
  const isMobile = useIsMobile();

  const controlPanelProps = {
    inputs,
    onInputChange: updateInput,
    corpus: results.corpus,
    corpusLabel: results.corpusLabel,
    displayHorizon: results.horizonYears,
    onHorizonChange: handleHorizonChange,
  };

  return (
    <motion.div
      id="planner"
      initial="hidden"
      animate="show"
      variants={stagger}
      className={`mx-auto flex w-full min-w-0 max-w-6xl scroll-mt-6 flex-col gap-6 px-6 py-10 ${isMobile ? "pb-[76px]" : ""}`}
    >
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

      {isMobile ? (
        <>
          <h2 className="font-heading text-h2 text-ink">Loan &amp; growth outcome</h2>
          <motion.div variants={fadeUp} className="min-w-0">
            <ResultCards inputs={inputs} results={results} />
          </motion.div>

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
            <TaxImpactCard inputs={inputs} results={results} />
          </motion.div>

          <h2 className="font-heading text-h2 font-extrabold text-ink">Charts</h2>
          <div className="grid min-w-0 grid-cols-1 gap-4">
            <motion.div variants={fadeUp} className="min-w-0">
              <BalanceChart series={results.chartSeries} corpusLabel={results.corpusLabel} horizonMonths={results.horizonMonths} />
            </motion.div>

            <motion.div variants={fadeUp} className="min-w-0">
              <AmortizationChart series={results.chartSeries} />
            </motion.div>
          </div>

          <motion.div variants={fadeUp} className="min-w-0">
            <AmortizationTable schedule={results.amortization.schedule} />
          </motion.div>

          <MobileInputSheet {...controlPanelProps} onReset={handleReset} />
        </>
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-[26px] lg:grid-cols-[1fr_0.82fr] lg:items-start">
          <motion.div variants={fadeUp} className="min-w-0">
            <ControlPanel {...controlPanelProps} onReset={handleReset} />
          </motion.div>

          <motion.div variants={fadeUp} className="min-w-0 lg:sticky lg:top-[90px]">
            <h2 className="mb-3 font-heading text-h1 font-extrabold text-ink">Loan &amp; growth outcome</h2>
            <div className="mb-4">
              <ResultCards inputs={inputs} results={results} />
            </div>

            <div className="mb-4">
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
            </div>

            <TaxImpactCard inputs={inputs} results={results} />
          </motion.div>
        </div>
      )}

      {!isMobile && (
        <>
          <h2 className="font-heading text-h2 font-extrabold text-ink">Charts</h2>
          <div className="grid min-w-0 grid-cols-2 gap-4">
            <motion.div variants={fadeUp} className="min-w-0">
              <BalanceChart series={results.chartSeries} corpusLabel={results.corpusLabel} horizonMonths={results.horizonMonths} />
            </motion.div>

            <motion.div variants={fadeUp} className="min-w-0">
              <AmortizationChart series={results.chartSeries} />
            </motion.div>
          </div>

          <motion.div variants={fadeUp} className="min-w-0">
            <AmortizationTable schedule={results.amortization.schedule} />
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

function computeResults(inputs: CalculatorInputs, horizonAuto: boolean): CalculatorResults {
  const {
    price,
    own,
    mfr,
    mode,
    swr,
    bankr,
    lr,
    tenure,
    extra,
    stepup,
    stepupemi,
    annualLumpSumCount,
    swptax,
    taxrate,
    horizon,
  } = inputs;
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
    annualLumpSumCount,
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
    annualLumpSumCount,
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

  const mfFutureValue = calculateMfFutureValue(mf, mfr, horizonMonths);

  const interestSaved = amortization.baselineInterest - amortization.totalInterestPaid;
  const netInterest = amortization.totalInterestPaid - taxBenefit.totalTaxSaved;
  const totalWealth = mfFutureValue + Math.max(0, corpusSim.finalBalance);
  const payoffYears = amortization.payoffMonths / 12;
  const withdrawMonthsDisplay = Math.min(horizonMonths, amortization.payoffMonths);

  const annualWithdrawRate = corpus > 0 ? ((amortization.emi * 12) / corpus) * 100 : 0;
  const gaugePct = Math.min(100, (annualWithdrawRate / (corpusReturnPercent * 2 || 1)) * 100);
  const isRisky = corpusSim.depletedAtMonth !== null || annualWithdrawRate > corpusReturnPercent + 2;

  const chartSeries = buildChartSeries(mf, corpus, loan, mfr, amortization, corpusSim, horizonMonths);

  // generateAmortizationSchedule falls back to simulationMonths when the balance
  // never actually hits zero within the window (a horizon shorter than payoff) —
  // check the real balance so the chart doesn't claim a payoff that hasn't happened.
  const loanClearedWithinHorizon = amortization.schedule[amortization.payoffMonths - 1]?.balance === 0;

  return {
    loan,
    corpus,
    corpusLabel,
    corpusReturnPercent,
    horizonYears,
    horizonMonths,
    loanClearedWithinHorizon,
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
  mfr: number,
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
        mf: calculateMfFutureValue(mf, mfr, month),
        corpus: corpusRow.balance,
        loan: amortRow.balance,
        interest: amortRow.interestPortion,
        principal: amortRow.principalPortion,
      });
    }
  }

  return points;
}
