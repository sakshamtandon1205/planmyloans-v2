import type { Metadata } from "next";
import Link from "next/link";
import { GUIDE_SLUGS, guideLoaders } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Guides · PlanMyLoans",
  description:
    "Plain-English guides on home loans, EMIs, SWPs, prepayment strategy, and tax benefits in India, written to explain, not just define.",
};

export default async function GuidesPage() {
  const guides = await Promise.all(
    GUIDE_SLUGS.map(async (slug) => {
      const { frontmatter } = await guideLoaders[slug]();
      return frontmatter;
    }),
  );

  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="mb-3 text-label uppercase text-indigo">Guides</div>
          <h1 className="mb-3 font-heading text-h1 font-semibold text-ink">
            Home loans, explained by someone who{" "}
            <span className="text-indigo">finds this stuff weirdly fun.</span>
          </h1>
          <p className="max-w-xl text-body text-ink-2">
            No jargon-dumps, no &quot;consult a financial advisor&quot; cop-outs after two sentences. Just the
            mechanics, with real numbers, so you understand what you&apos;re deciding.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-11">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="block rounded-lg border border-line bg-surface p-6 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow"
            >
              <span className="mb-2.5 block font-mono text-mono-sm uppercase tracking-wide text-indigo">
                {guide.tag}
              </span>
              <h3 className="mb-2 font-heading text-h3 text-ink">{guide.title}</h3>
              <p className="text-body-sm leading-relaxed text-ink-2">{guide.teaser}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
