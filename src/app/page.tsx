import type { Metadata } from "next";
import { AffiliateBanner } from "@/components/AffiliateBanner";
import { Calculator } from "@/components/Calculator";
import { Hero } from "@/components/Hero";
import { StrategyTeaserGrid } from "@/components/StrategyTeaserGrid";

export const metadata: Metadata = {
  title: "PlanMyLoans · Home Loan, EMI & SWP Planner",
  description:
    "Free interactive planner to model a home loan against your own capital. Split funds across a mutual fund lumpsum, an SWP or bank corpus to fund the EMI, and a down payment. See EMI, payoff time, interest, prepayment savings, and tax impact live.",
};

const webApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "PlanMyLoans",
  url: "https://planmyloans.in",
  description: metadata.description,
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
  },
};

export default function Home() {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationJsonLd).replace(/</g, "\\u003c") }}
      />
      <Hero />
      <div className="mx-auto w-full max-w-6xl px-6 py-2">
        <AffiliateBanner
          title="Not sure you'll qualify for this EMI?"
          description="Check your free CIBIL score & loan eligibility in 2 minutes, no impact on your score."
        />
      </div>
      <StrategyTeaserGrid />
      <Calculator />
    </div>
  );
}
