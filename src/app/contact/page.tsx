import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact · PlanMyLoans",
  description: "Get in touch with PlanMyLoans: questions, feedback, bug reports, or just to say hello.",
};

const TOPICS = [
  { label: "Found a bug", body: "Tell me what you entered and what looked wrong. Screenshots help." },
  { label: "Feature request", body: "New calculation, new field, new comparison. I read every one." },
  { label: "Content feedback", body: "Spotted something inaccurate in a guide? Please flag it, seriously." },
  { label: "General feedback", body: "Even \"this helped me\" is genuinely nice to hear." },
];

export default function ContactPage() {
  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="mb-3 text-label uppercase text-indigo">Contact</div>
          <h1 className="mb-3 font-heading text-h1 font-semibold text-ink">
            Say hello, or tell me <span className="text-indigo">something&apos;s broken</span>.
          </h1>
          <p className="max-w-xl text-body text-ink-2">
            This is a one-person project, so replies come from an actual human, usually within a few days,
            sometimes faster if I&apos;m procrastinating on something else.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 py-11">
        <div className="mb-9 flex items-center gap-5 rounded-lg border border-line bg-surface p-7 shadow-sm">
          <div className="flex size-[52px] flex-none items-center justify-center rounded bg-indigo-soft text-indigo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-6">
              <path d="M22 6l-10 7L2 6" />
              <rect x="2" y="4" width="20" height="16" rx="2" />
            </svg>
          </div>
          <div className="min-w-0">
            <h2 className="mb-1 font-heading text-h3 text-ink">Email</h2>
            <p className="mb-1.5 text-body-sm text-ink-2">
              For anything: bugs, feature ideas, corrections, or general feedback.
            </p>
            <a
              href="mailto:sakshamtandon1205@gmail.com"
              className="break-all font-mono text-body-sm font-semibold text-indigo hover:underline"
            >
              sakshamtandon1205@gmail.com
            </a>
          </div>
        </div>

        <h2 className="mb-4 mt-11 font-heading text-h2 font-semibold text-ink">What&apos;s useful to include</h2>
        <p className="mb-4 text-body leading-relaxed text-ink">
          If you&apos;re reporting something wrong with the calculator, it helps a lot to mention what you were
          entering (e.g. property price, loan tenure, SWP or bank mode) so I can reproduce it rather than guess.
        </p>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {TOPICS.map((t) => (
            <div key={t.label} className="rounded bg-surface-2 p-4">
              <b className="mb-0.5 block font-heading text-body-sm text-ink">{t.label}</b>
              <span className="text-body-sm text-ink-2">{t.body}</span>
            </div>
          ))}
        </div>

        <h2 className="mb-4 mt-11 font-heading text-h2 font-semibold text-ink">Follow along</h2>
        <p className="mb-4 text-body leading-relaxed text-ink">
          Instagram and Facebook pages for PlanMyLoans are on the way. Links will appear here once they&apos;re
          live.
        </p>

        <div className="my-10 rounded-lg border border-line bg-surface p-7 text-center shadow-sm">
          <h3 className="mb-2 font-heading text-h3 text-ink">In the meantime</h3>
          <p className="mb-4 text-body text-ink-2">The calculator&apos;s always open, no email required to use it.</p>
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
