import { describe, expect, it } from "vitest";
import { generateAmortizationSchedule } from "../emi";
import { simulateBankCorpus, simulateSwpCorpus } from "../swp";
import { calculateLoanTaxBenefitFromSchedule } from "../tax";

/**
 * Cross-checks the composed emi.ts + swp.ts + tax.ts pipeline against
 * reference numbers produced by running the original property-planner
 * dashboard's recalc() loop (extracted verbatim, minus DOM) on the same
 * inputs. See scratchpad/original_loop.js for the reference script.
 */
function runPipeline(opts: {
  price: number;
  dp: number;
  mf: number;
  own: number;
  mode: "swp" | "bank";
  corpusReturnPercent: number;
  lrPercent: number;
  tenureYears: number;
  extra: number;
  stepupPercent: number;
  stepupEmiPercent: number;
  swpTaxPercent: number;
  taxRatePercent: number;
  horizonYears: number;
}) {
  const loan = Math.max(0, opts.price - opts.dp);
  const corpus = Math.max(0, opts.own - opts.dp - opts.mf);
  const tenureMonths = opts.tenureYears * 12;
  const horizonMonths = opts.horizonYears * 12;

  const amortization = generateAmortizationSchedule({
    principal: loan,
    annualRatePercent: opts.lrPercent,
    tenureMonths,
    extraMonthlyPrepayment: opts.extra,
    annualPrepayStepUpPercent: opts.stepupPercent,
    annualEmiStepUpPercent: opts.stepupEmiPercent,
    simulationMonths: horizonMonths,
  });

  const emiSchedule = amortization.schedule.map((row) => row.emi);

  const corpusResult =
    opts.mode === "swp"
      ? simulateSwpCorpus({
          initialCorpus: corpus,
          annualReturnPercent: opts.corpusReturnPercent,
          emiSchedule,
          payoffMonths: amortization.payoffMonths,
          horizonMonths,
          incomeTaxRatePercent: opts.taxRatePercent,
          capitalGainsTaxRatePercent: opts.swpTaxPercent,
        })
      : simulateBankCorpus({
          initialCorpus: corpus,
          annualReturnPercent: opts.corpusReturnPercent,
          emiSchedule,
          payoffMonths: amortization.payoffMonths,
          horizonMonths,
          incomeTaxRatePercent: opts.taxRatePercent,
        });

  const taxBenefit = calculateLoanTaxBenefitFromSchedule(amortization.schedule, opts.taxRatePercent);

  return { amortization, corpusResult, taxBenefit };
}

describe("full pipeline vs. original dashboard loop", () => {
  it("matches the SWP-mode reference scenario (mid-horizon depletion)", () => {
    const { amortization, corpusResult, taxBenefit } = runPipeline({
      price: 14000000,
      dp: 4000000,
      mf: 2000000,
      own: 7000000,
      mode: "swp",
      corpusReturnPercent: 7.5,
      lrPercent: 7.5,
      tenureYears: 20,
      extra: 0,
      stepupPercent: 0,
      stepupEmiPercent: 0,
      swpTaxPercent: 12.5,
      taxRatePercent: 30,
      horizonYears: 20,
    });

    expect(amortization.emi).toBeCloseTo(80559.31935518023, 6);
    expect(amortization.payoffMonths).toBe(240);
    expect(amortization.totalInterestPaid).toBeCloseTo(9334236.64524351, 3);
    expect(corpusResult.depletedAtMonth).toBe(13);
    expect(corpusResult.finalBalance).toBe(0);
    expect(corpusResult.totalTaxPaid).toBeCloseTo(5411.385264352328, 3);
    expect(taxBenefit.totalTaxSaved).toBeCloseTo(2013096.448306288, 3);
  });

  it("matches the bank-mode reference scenario (ample corpus, no depletion)", () => {
    const { amortization, corpusResult, taxBenefit } = runPipeline({
      price: 14000000,
      dp: 4000000,
      mf: 2000000,
      own: 20000000,
      mode: "bank",
      corpusReturnPercent: 6.5,
      lrPercent: 7.5,
      tenureYears: 20,
      extra: 0,
      stepupPercent: 0,
      stepupEmiPercent: 0,
      swpTaxPercent: 12.5,
      taxRatePercent: 30,
      horizonYears: 20,
    });

    expect(amortization.emi).toBeCloseTo(80559.31935518023, 6);
    expect(amortization.payoffMonths).toBe(240);
    expect(amortization.totalInterestPaid).toBeCloseTo(9334236.64524351, 3);
    expect(corpusResult.depletedAtMonth).toBeNull();
    expect(corpusResult.finalBalance).toBeCloseTo(2848662.1336286766, 2);
    expect(corpusResult.totalTaxPaid).toBeCloseTo(3506956.619516559, 2);
    expect(taxBenefit.totalTaxSaved).toBeCloseTo(2013096.448306288, 3);
  });

  it("matches the reference scenario with extra prepay + annual step-ups", () => {
    const { amortization, corpusResult, taxBenefit } = runPipeline({
      price: 14000000,
      dp: 4000000,
      mf: 2000000,
      own: 12000000,
      mode: "swp",
      corpusReturnPercent: 7.5,
      lrPercent: 8.5,
      tenureYears: 20,
      extra: 5000,
      stepupPercent: 10,
      stepupEmiPercent: 5,
      swpTaxPercent: 12.5,
      taxRatePercent: 30,
      horizonYears: 20,
    });

    expect(amortization.emi).toBeCloseTo(86782.32333655341, 6);
    expect(amortization.payoffMonths).toBe(135);
    expect(amortization.totalInterestPaid).toBeCloseTo(6239258.04340219, 2);
    expect(corpusResult.depletedAtMonth).toBe(75);
    expect(corpusResult.finalBalance).toBe(0);
    expect(corpusResult.totalTaxPaid).toBeCloseTo(199582.20631033398, 2);
    expect(taxBenefit.totalTaxSaved).toBeCloseTo(1173845.688611259, 2);
  });
});
