import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDE_SLUGS, guideLoaders, isGuideSlug } from "@/lib/guides";

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
  return {
    title: `${frontmatter.title} · PlanMyLoans`,
    description: frontmatter.description,
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isGuideSlug(slug)) notFound();

  const { default: Content, frontmatter } = await guideLoaders[slug]();

  return (
    <article>
      <section className="border-b border-line">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="mb-3 text-label uppercase text-indigo">{frontmatter.tag}</div>
          <h1 className="mb-3 font-heading text-h1 font-semibold text-ink">{frontmatter.title}</h1>
          <p className="max-w-xl text-body text-ink-2">{frontmatter.lede}</p>
          <div className="mt-4 flex items-center gap-3.5 font-mono text-mono-sm text-ink-3">
            <span>Guide</span>
            <span className="size-1 rounded-full bg-ink-3" />
            <span>{frontmatter.readTime}</span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 py-11">
        <Content />
      </div>

      <div className="mx-auto max-w-3xl px-6 pb-8">
        <Link href="/guides" className="text-body-sm font-medium text-indigo hover:underline">
          ← Back to all guides
        </Link>
      </div>
    </article>
  );
}
