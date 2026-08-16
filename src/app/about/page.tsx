import type { Metadata } from "next";
import Link from "next/link";
import { OG_IMAGE, SITE_NAME } from "@/lib/seo";

const TITLE = "About · PlanMyLoans";
const DESCRIPTION =
  "Why a backend engineer who spends his day job inside a bank's systems decided to build a free home loan planner for everyone else.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/about",
    siteName: SITE_NAME,
    type: "website",
    images: [{ ...OG_IMAGE, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

const FIND_HERE = [
  "A free, interactive planner that models a property purchase against your own capital: no signup, no email wall, no “unlock full results” nonsense.",
  "Plain-English guides on the parts of home loans and personal finance that are usually explained badly: SWPs, prepayment math, tax deductions, the works.",
  "Zero financial advice dressed up as fact. Just a clearer way to see your own numbers, so you can make your own call.",
  "Transparency about money: I'm not formally partnered with anyone yet, but this site may carry affiliate links (like BankBazaar's) — if you sign up through one, I could earn a small commission. It never changes the numbers the calculator shows you.",
];

const DOES = [
  "Models EMI, prepayment, and payoff time live as you adjust inputs",
  "Splits your own capital across down payment, MF lumpsum, and SWP",
  "Estimates tax impact under Sec 24(b) and 80C",
  "Runs the planner entirely in your browser — no signup, no calculator inputs stored",
];

const DOES_NOT = [
  "Give personalised financial, tax, or legal advice",
  "Connect to your bank or pull real account data",
  "Guarantee mutual fund or SWP returns — those are assumptions you set",
  "Process loan applications directly",
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-[760px] px-6 pb-16">
      <section className="pt-8 pb-2">
        <div className="mb-3.5 text-[12.5px] font-bold uppercase tracking-[.06em] text-accent-text">About</div>
        <h1 className="mb-4 font-heading text-[34px] font-extrabold leading-[1.2] tracking-[-0.02em] text-ink">
          Hi, I&apos;m the person who got too curious about spreadsheets.
        </h1>
        <p className="text-body-lg leading-[1.6] text-ink-2">
          A short, honest explanation of why this site exists, who built it, and why it&apos;s obsessed with the
          difference between a 12% return and a 12.5% return.
        </p>
      </section>

      <section className="py-2">
        <p className="mb-5 text-body leading-[1.75] text-ink-2">
          Somewhere between debugging a payments pipeline at 11pm and half-heartedly building yet another Excel
          sheet to figure out my own home loan, I had an uncomfortable realisation: I understood banking systems for
          a living, and I still couldn&apos;t answer a simple question about my own money without twenty minutes and
          three tabs of contradictory blog posts.
        </p>
        <p className="text-body leading-[1.75] text-ink-2">
          So I built the tool I wanted. Then I kept adding to it, because it turns out &quot;just one more
          slider&quot; is a very dangerous sentence to say to yourself at midnight.
        </p>
      </section>

      <section className="py-2">
        <h2 className="mb-3.5 font-heading text-h2 font-extrabold tracking-[-0.01em] text-ink">Who&apos;s behind this</h2>
        <p className="mb-4.5 text-body leading-[1.75] text-ink-2">
          I&apos;m a backend software engineer: the kind who spends the day writing the systems that move money
          around inside a large financial institution, and the evening wondering why none of the public-facing
          tools for personal finance felt half as rigorous as the internal ones. PlanMyLoans is what happens when
          that itch doesn&apos;t go away.
        </p>
        <p className="mb-3 text-body leading-[1.75] text-ink-2">
          I&apos;m Saksham Tandon, and I&apos;m not a financial advisor, a CA, or a wealth manager with a nice suit
          and a nicer office. I&apos;m an engineer who likes numbers to add up, and who got mildly obsessed with
          modelling exactly how a home loan interacts with a mutual fund, a bank account, prepayments, and the
          Indian tax code, all at the same time, live, without needing to open Excel.
        </p>
        <Link
          href="https://www.linkedin.com/in/sakshamtandon1205/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-body-sm font-medium text-indigo hover:underline"
        >
          Saksham Tandon on LinkedIn →
        </Link>
      </section>

      <section className="py-2">
        <h2 className="mb-3.5 font-heading text-h2 font-extrabold tracking-[-0.01em] text-ink">Why this site exists</h2>
        <p className="mb-4.5 text-body leading-[1.75] text-ink-2">
          Most loan calculators online do one thing: they compute an EMI and stop there, as if that&apos;s the whole
          story. It isn&apos;t. The real question anyone buying a property is asking is messier: &quot;If I split my
          savings this way, will I still be okay in five years? What does prepaying save me? Is my SWP going to run
          dry before my loan does?&quot; Nobody was answering that question with a tool you could just play with, so
          I built one.
        </p>
        <p className="text-body leading-[1.75] text-ink-2">
          There&apos;s also a smaller, pettier reason: I got tired of financial content that either oversimplifies
          everything into &quot;just invest in SIPs&quot; or buries you in jargon that assumes you already have a
          finance degree. I wanted something in between: rigorous enough to trust, plain enough to use.
        </p>
      </section>

      <section className="py-2">
        <h2 className="mb-4 font-heading text-h2 font-extrabold tracking-[-0.01em] text-ink">What you&apos;ll find here</h2>
        <div className="glass-panel p-[22px]">
          {FIND_HERE.map((item) => (
            <div key={item} className="flex items-start gap-3 py-2.5">
              <span className="mt-[3px] size-4 flex-none rounded-full bg-jade" />
              <span className="text-body-sm leading-[1.6] text-ink-2">{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-2">
        <div className="glass-panel p-[22px]">
          <div className="mb-3.5 font-heading text-[15px] font-bold text-ink">What it does</div>
          {DOES.map((item) => (
            <div key={item} className="flex items-start gap-2.5 py-[7px]">
              <span className="mt-[3px] size-3.5 flex-none rounded-full bg-jade" />
              <span className="text-[13.5px] leading-[1.5] text-ink-2">{item}</span>
            </div>
          ))}
        </div>
        <div className="glass-panel p-[22px]">
          <div className="mb-3.5 font-heading text-[15px] font-bold text-ink">What it doesn&apos;t do</div>
          {DOES_NOT.map((item) => (
            <div key={item} className="flex items-start gap-2.5 py-[7px]">
              <span className="mt-[3px] size-3.5 flex-none rounded-full bg-surface-2" />
              <span className="text-[13.5px] leading-[1.5] text-ink-2">{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="py-3">
        <div className="glass-panel-sm p-6" style={{ background: "var(--warn-bg)", borderColor: "var(--warn-border)" }}>
          <div className="mb-2 font-heading text-[15px] font-bold text-warn-text">The honesty clause</div>
          <p className="text-[14.5px] leading-[1.65] text-warn-text-muted">
            Everything on this site is a model, not a guarantee. Markets move, interest rates reset, and I&apos;m
            one guy with a laptop, not a SEBI-registered advisor. Use this to think more clearly, not as a
            substitute for professional advice on anything that involves real money and real consequences.
          </p>
        </div>
      </section>

      <section className="py-4">
        <div className="glass-panel flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <div className="mb-1 font-heading text-[16px] font-bold text-ink">Say hello</div>
            <div className="text-[14px] leading-[1.6] text-ink-3">
              If something&apos;s broken, confusing, or the SWP gauge helped you dodge a bad decision — I&apos;d
              genuinely like to hear it.
            </div>
          </div>
          <Link
            href="/contact"
            className="cta-tap hover-cta-primary whitespace-nowrap rounded-[10px] bg-[linear-gradient(135deg,var(--indigo),var(--jade))] px-5 py-3 font-heading text-[14px] font-bold text-white"
          >
            Get in touch →
          </Link>
        </div>
      </section>
    </div>
  );
}
