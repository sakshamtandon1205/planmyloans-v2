import { ThemeToggle } from "@/components/ThemeToggle";

const stats = [
  { label: "Monthly EMI", value: "₹86,782", tone: "text-indigo" },
  { label: "Loan clears in", value: "18.4 yrs", tone: "text-jade" },
  { label: "Total interest", value: "₹1,08,27,640", tone: "text-amber" },
  { label: "Wealth after horizon", value: "₹42,15,900", tone: "text-indigo" },
];

export default function Home() {
  return (
    <div className="flex flex-1 justify-center bg-paper px-6 py-16">
      <div className="w-full max-w-3xl">
        <div className="mb-10 flex items-center justify-between">
          <span className="text-label uppercase text-indigo">Design system preview</span>
          <ThemeToggle />
        </div>

        <h1 className="mb-3 font-heading text-display font-semibold text-ink">
          Plan your home loan <span className="text-indigo">against your own capital</span>
        </h1>
        <p className="max-w-xl text-body text-ink-2">
          This page is a temporary sanity check for the design system — colors, fonts, type scale,
          radius, and shadow tokens, plus dark mode toggling with persistence. The real calculator UI
          comes next.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-sm border border-line bg-surface p-4 shadow-sm">
              <div className="mb-2 text-label uppercase text-ink-3">{s.label}</div>
              <div className={`font-mono text-mono-lg font-bold ${s.tone}`}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-line bg-surface-2 p-5">
          <h2 className="mb-2 font-heading text-h3 text-ink">Type &amp; token check</h2>
          <p className="mb-4 text-body-sm text-ink-2">
            Headings use Space Grotesk, body copy uses Inter, and every figure below uses JetBrains
            Mono via <code className="font-mono text-mono-sm text-ink-2">font-mono</code>.
          </p>
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 font-mono">
            <span className="text-mono-lg text-ink">₹1,00,00,000</span>
            <span className="text-mono text-jade">8.50%</span>
            <span className="text-mono-sm text-ink-3">20 yrs · 240 mo</span>
            <span className="text-mono-sm text-coral">-₹4,20,000</span>
          </div>
        </div>
      </div>
    </div>
  );
}
