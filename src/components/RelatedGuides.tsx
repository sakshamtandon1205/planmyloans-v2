import Link from "next/link";
import type { GuideFrontmatter } from "@/lib/guides";

interface RelatedGuidesProps {
  guides: GuideFrontmatter[];
}

/** Same card styling as the /guides hub grid, so a guide page's related-reading module reads as the same design language rather than a one-off. */
export function RelatedGuides({ guides }: RelatedGuidesProps) {
  if (guides.length === 0) return null;

  return (
    <section aria-labelledby="related-guides-heading" className="mx-auto max-w-3xl px-6 pb-12">
      <h2 id="related-guides-heading" className="mb-4 font-heading text-h3 font-semibold text-ink">
        Related guides
      </h2>
      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
        {guides.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            className="hover-card-link glass-panel block p-[22px]"
          >
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
  );
}
