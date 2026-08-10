import { Calculator } from "@/components/Calculator";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-paper">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="inline-flex items-center gap-2 font-heading text-h3 text-ink">
            <span className="inline-flex size-6 items-center justify-center rounded-sm bg-indigo text-body-sm text-white">
              ◆
            </span>
            PlanMyLoans
          </span>
          <ThemeToggle />
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-6 pt-10">
        <span className="mb-3 inline-flex items-center gap-2 text-label uppercase text-indigo">
          <span className="inline-flex size-4 items-center justify-center rounded-sm bg-indigo text-caption leading-none text-white">
            ◆
          </span>
          Property Financing Model
        </span>
        <h1 className="mb-3 font-heading text-display font-semibold text-ink">
          Plan your home loan <span className="text-indigo">against your own capital</span>
        </h1>
        <p className="max-w-2xl text-body text-ink-2">
          See how your funds, split across a lumpsum mutual fund, an EMI-funding corpus, and a down payment,
          plus any monthly prepayment from salary, stack up against a home loan. Every figure recalculates
          live.
        </p>
      </section>

      <Calculator />
    </div>
  );
}
