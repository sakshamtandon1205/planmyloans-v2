import type { Metadata } from "next";
import { Calculator } from "@/components/Calculator";
import { Hero } from "@/components/Hero";
import { QuickEstimate } from "@/components/QuickEstimate";
import { StrategyRecommendations } from "@/components/StrategyRecommendations";

export const metadata: Metadata = {
  title: "PlanMyLoans · Home Loan, EMI & SWP Planner",
  description:
    "Free interactive planner to model a home loan against your own capital. Split funds across a mutual fund lumpsum, an SWP or bank corpus to fund the EMI, and a down payment. See EMI, payoff time, interest, prepayment savings, and tax impact live.",
};

export default function Home() {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <Hero />
      <StrategyRecommendations />
      <QuickEstimate />
      <Calculator />
    </div>
  );
}
