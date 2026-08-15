import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideBreadcrumb } from "@/components/GuideBreadcrumb";
import { RelatedGuides } from "@/components/RelatedGuides";
import { GUIDE_SLUGS, RELATED_GUIDES, guideLoaders, isGuideSlug, type GuideFrontmatter } from "@/lib/guides";
import { OG_IMAGE, SITE_NAME } from "@/lib/seo";

const SITE_URL = "https://planmyloans.in";

export function generateStaticParams() {
  return GUIDE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isGuideSlug(slug)) return {};

  const { frontmatter } = await guideLoaders[slug]();
  const title = `${frontmatter.title} · PlanMyLoans`;
  const url = `/guides/${slug}`;

  return {
    title,
    description: frontmatter.description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: frontmatter.description,
      url,
      siteName: SITE_NAME,
      type: "article",
      publishedTime: frontmatter.datePublished,
      modifiedTime: frontmatter.updatedAt,
      authors: [frontmatter.author],
      images: [{ ...OG_IMAGE, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: frontmatter.description,
      images: [OG_IMAGE.url],
    },
  };
}

function formatGuideDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function buildJsonLd(slug: string, frontmatter: GuideFrontmatter) {
  const pageUrl = `${SITE_URL}/guides/${slug}`;

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: frontmatter.title,
    description: frontmatter.description,
    author: { "@type": "Person", name: frontmatter.author },
    datePublished: frontmatter.datePublished,
    dateModified: frontmatter.updatedAt,
    publisher: {
      "@type": "Organization",
      name: "PlanMyLoans",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.svg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE_URL}/guides` },
      { "@type": "ListItem", position: 3, name: frontmatter.title, item: pageUrl },
    ],
  };

  return [article, breadcrumb];
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isGuideSlug(slug)) notFound();

  const { default: Content, frontmatter } = await guideLoaders[slug]();
  const jsonLdBlocks = buildJsonLd(slug, frontmatter);
  const relatedFrontmatters = await Promise.all(
    RELATED_GUIDES[slug].map(async (relatedSlug) => (await guideLoaders[relatedSlug]()).frontmatter),
  );

  return (
    <article>
      {jsonLdBlocks.map((block) => (
        <script
          key={block["@type"]}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block).replace(/</g, "\\u003c") }}
        />
      ))}

      <GuideBreadcrumb title={frontmatter.title} />

      <section className="border-b border-line">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="mb-3 text-label uppercase text-indigo">{frontmatter.tag}</div>
          <h1 className="mb-3 font-heading text-h1 font-semibold text-ink">{frontmatter.title}</h1>
          <p className="max-w-xl text-body text-ink-2">{frontmatter.lede}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3.5 font-mono text-mono-sm text-ink-3">
            <span>By {frontmatter.author}</span>
            <span className="size-1 rounded-full bg-ink-3" />
            <span>{frontmatter.readTime}</span>
            <span className="size-1 rounded-full bg-ink-3" />
            <span>Updated {formatGuideDate(frontmatter.updatedAt)}</span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 py-11">
        <Content />
      </div>

      <RelatedGuides guides={relatedFrontmatters} />

      <div className="mx-auto max-w-3xl px-6 pb-8">
        <Link href="/guides" className="text-body-sm font-medium text-indigo hover:underline">
          ← Back to all guides
        </Link>
      </div>
    </article>
  );
}
