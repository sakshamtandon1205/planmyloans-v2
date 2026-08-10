import type { Metadata } from "next";
import Link from "next/link";
import { Callout } from "@/components/Callout";

export const metadata: Metadata = {
  title: "About · PlanMyLoans",
  description:
    "Why a backend engineer who spends his day job inside a bank's systems decided to build a free home loan planner for everyone else.",
};

export default function AboutPage() {
  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="mb-3 text-label uppercase text-indigo">About</div>
          <h1 className="mb-3 font-heading text-h1 font-semibold text-ink">
            Hi, I&apos;m the person who got <span className="text-indigo">too curious</span> about spreadsheets.
          </h1>
          <p className="max-w-xl text-body text-ink-2">
            A short, honest explanation of why this site exists, who built it, and why it&apos;s obsessed with the
            difference between a 12% return and a 12.5% return.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 py-11">
        <p className="mb-5 text-body-lg leading-relaxed text-ink-2">
          Somewhere between debugging a payments pipeline at 11pm and half-heartedly building yet another Excel
          sheet to figure out my own home loan, I had an uncomfortable realisation: I understood banking systems
          for a living, and I still couldn&apos;t answer a simple question about my own money without twenty
          minutes and three tabs of contradictory blog posts.
        </p>
        <p className="mb-4 text-body leading-relaxed text-ink">
          So I built the tool I wanted. Then I kept adding to it, because it turns out &quot;just one more
          slider&quot; is a very dangerous sentence to say to yourself at midnight.
        </p>

        <h2 className="mb-4 mt-11 font-heading text-h2 font-semibold text-ink">Who&apos;s behind this</h2>
        <p className="mb-4 text-body leading-relaxed text-ink">
          I&apos;m a backend software engineer: the kind who spends the day writing the systems that move money
          around inside a large financial institution, and the evening wondering why none of the public-facing
          tools for personal finance felt half as rigorous as the internal ones. PlanMyLoans is what happens when
          that itch doesn&apos;t go away.
        </p>
        <p className="mb-4 text-body leading-relaxed text-ink">
          I&apos;m not a financial advisor, a CA, or a wealth manager with a nice suit and a nicer office. I&apos;m
          an engineer who likes numbers to add up, and who got mildly obsessed with modelling exactly how a home
          loan interacts with a mutual fund, a bank account, prepayments, and the Indian tax code, all at the same
          time, live, without needing to open Excel.
        </p>

        <h2 className="mb-4 mt-11 font-heading text-h2 font-semibold text-ink">Why this site exists</h2>
        <p className="mb-4 text-body leading-relaxed text-ink">
          Most loan calculators online do one thing: they compute an EMI and stop there, as if that&apos;s the
          whole story. It isn&apos;t. The real question anyone buying a property is asking is messier:{" "}
          <em>
            &quot;If I split my savings this way, will I still be okay in five years? What does prepaying save me?
            Is my SWP going to run dry before my loan does?&quot;
          </em>{" "}
          Nobody was answering that question with a tool you could just play with, so I built one.
        </p>
        <p className="mb-4 text-body leading-relaxed text-ink">
          There&apos;s also a smaller, pettier reason: I got tired of financial content that either oversimplifies
          everything into &quot;just invest in SIPs&quot; or buries you in jargon that assumes you already have a
          finance degree. I wanted something in between: rigorous enough to trust, plain enough to use.
        </p>

        <h2 className="mb-4 mt-11 font-heading text-h2 font-semibold text-ink">What you&apos;ll find here</h2>
        <ul className="mb-4 list-disc space-y-2 pl-5 text-body leading-relaxed text-ink">
          <li>
            A free, interactive planner that models a property purchase against your own capital: no signup, no
            email wall, no &quot;unlock full results&quot; nonsense.
          </li>
          <li>
            Plain-English guides on the parts of home loans and personal finance that are usually explained badly:
            SWPs, prepayment math, tax deductions, the works.
          </li>
          <li>Zero financial advice dressed up as fact. Just a clearer way to see your own numbers, so you can make your own call.</li>
        </ul>

        <Callout>
          <strong>The honesty clause:</strong> everything on this site is a model, not a guarantee. Markets move,
          interest rates reset, and I&apos;m one guy with a laptop, not a SEBI-registered advisor. Use this to
          think more clearly, not as a substitute for professional advice on anything that involves real money and
          real consequences.
        </Callout>

        <h2 className="mb-4 mt-11 font-heading text-h2 font-semibold text-ink">Say hello</h2>
        <p className="mb-4 text-body leading-relaxed text-ink">
          If something&apos;s broken, confusing, or you just want to tell me the SWP corpus gauge helped you avoid
          a bad decision, I&apos;d genuinely like to hear it. Find me on the{" "}
          <Link href="/contact" className="font-medium text-indigo hover:underline">
            contact page
          </Link>
          .
        </p>

        <div className="my-10 rounded-lg border border-line bg-surface p-7 text-center shadow-sm">
          <h3 className="mb-2 font-heading text-h3 text-ink">Curious what it does?</h3>
          <p className="mb-4 text-body text-ink-2">Go play with the real thing: sliders, live numbers, dark mode and all.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-sm bg-indigo-solid px-5 py-2.5 text-body-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            Open the calculator →
          </Link>
        </div>
      </div>
    </div>
  );
}
