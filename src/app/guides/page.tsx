import type { Metadata } from "next";
import Link from "next/link";
import { AffiliateBanner } from "@/components/AffiliateBanner";
import { GUIDE_SLUGS, guideLoaders } from "@/lib/guides";
import { OG_IMAGE, SITE_NAME } from "@/lib/seo";

const TITLE = "Guides · PlanMyLoans";
const DESCRIPTION =
  "Plain-English guides on home loans, EMIs, SWPs, prepayment strategy, and tax benefits in India, written to explain, not just define.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/guides" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/guides",
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

export default async function GuidesPage() {
  const guides = await Promise.all(
    GUIDE_SLUGS.map(async (slug) => {
      const { frontmatter } = await guideLoaders[slug]();
      return frontmatter;
    }),
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-16">
      <section className="pt-9 pb-2">
        <div className="mb-3 text-[12.5px] font-bold uppercase tracking-[.06em] text-accent-text">Guides</div>
        <h1 className="mb-3 font-heading text-[38px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink">
          Understand every number before you sign.
        </h1>
        <p className="max-w-[600px] text-body-lg leading-[1.6] text-ink-2">
          Plain-English explainers on EMIs, prepayment, tax deductions, and how to think about splitting your
          capital.
        </p>
      </section>

      <section className="py-8">
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <Link key={guide.slug} href={`/guides/${guide.slug}`} className="hover-card-link glass-panel block p-[22px]">
              <span className="mb-3.5 inline-block rounded-full bg-chip px-2.5 py-[5px] text-[11px] font-bold text-accent-text">
                {guide.tag}
              </span>
              <div className="mb-2 font-heading text-[17px] font-bold leading-[1.3] text-ink">{guide.title}</div>
              <p className="mb-3.5 text-[13.5px] leading-[1.5] text-ink-2">{guide.teaser}</p>
              <div className="text-[12px] font-semibold text-ink-4">{guide.readTime}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-2">
        <AffiliateBanner
          title="Ready to check where you stand?"
          description="See your free CIBIL score & eligibility before you apply — no impact on your score."
        />
      </section>
    </div>
  );
}
