import type { AmortizationResult, CorpusSimulationResult, FundingMode, LoanTaxBenefitResult } from "@/lib/calculations/types";

export interface CalculatorInputs {
  price: number;
  own: number;
  dp: number;
  mf: number;
  mfr: number;
  mode: FundingMode;
  swr: number;
  bankr: number;
  lr: number;
  tenure: number;
  extra: number;
  stepup: number;
  stepupemi: number;
  swptax: number;
  taxrate: number;
  horizon: number;
}

export const DEFAULT_INPUTS: CalculatorInputs = {
  price: 14000000,
  own: 10000000,
  dp: 4000000,
  mf: 2000000,
  mfr: 12,
  mode: "swp",
  swr: 7.5,
  bankr: 6.5,
  lr: 7.5,
  tenure: 20,
  extra: 0,
  stepup: 0,
  stepupemi: 0,
  swptax: 12.5,
  taxrate: 30,
  horizon: 20,
};

export interface ChartPoint {
  month: number;
  monthLabel: string;
  mf: number;
  corpus: number;
  loan: number;
  interest: number;
  principal: number;
}

export interface CalculatorResults {
  loan: number;
  corpus: number;
  corpusLabel: string;
  corpusReturnPercent: number;
  /** The horizon actually used in every calculation below (auto-follows payoff unless the user overrides it). */
  horizonYears: number;
  amortization: AmortizationResult;
  corpusSim: CorpusSimulationResult;
  taxBenefit: LoanTaxBenefitResult;
  interestSaved: number;
  netInterest: number;
  mfFutureValue: number;
  totalWealth: number;
  payoffYears: number;
  withdrawMonthsDisplay: number;
  annualWithdrawRate: number;
  isRisky: boolean;
  gaugePct: number;
  chartSeries: ChartPoint[];
}
