"use client";

import { useState } from "react";
import { computeStrategies, type StrategyResult } from "@/lib/calculations/strategies";
import { useSharedInputsStore } from "@/lib/sharedInputsStore";
import { StrategyGrid } from "./StrategyGrid";
import { StrategyInputs, type StrategyFormValues } from "./StrategyInputs";
import type { UsePlanOptions } from "./StrategyCard";

export function StrategyRecommendations() {
  const [results, setResults] = useState<StrategyResult[] | null>(null);

  const handleSubmit = (values: StrategyFormValues) => {
    setResults(
      computeStrategies({
        propertyPrice: values.propertyPrice,
        ownFunds: values.ownFunds,
        loanRatePercent: values.loanRatePercent,
        tenureYears: values.tenureYears,
      }),
    );
  };

  const handleUsePlan = (result: StrategyResult, options: UsePlanOptions) => {
    const { downPayment, mfLumpsum, corpus, loanAmount } = result.capitalStack;
    useSharedInputsStore.getState().applyStrategy({
      price: loanAmount + downPayment,
      ownFunds: downPayment + mfLumpsum + corpus,
      downPayment,
      mfLumpsum,
      fundingMode: result.fundingMode,
      rate: result.loanRatePercent,
      tenure: result.tenureMonths / 12,
      extraPrepayment: result.extraMonthlyPrepayment,
      prepayStepUpPercent: result.prepayStepUpPercent,
      annualLumpSumCount: options.annualLumpSumCount,
    });
    document.getElementById("planner")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <StrategyInputs onSubmit={handleSubmit} />
      {results && <StrategyGrid results={results} onUsePlan={handleUsePlan} />}
    </>
  );
}
