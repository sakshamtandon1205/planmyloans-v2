import type { ComponentType } from "react";

export interface GuideFrontmatter {
  slug: string;
  tag: string;
  title: string;
  /** Meta description for this guide's page. */
  description: string;
  /** Page-hero lede paragraph. */
  lede: string;
  readTime: string;
  /** Short teaser shown on the /guides hub card. */
  teaser: string;
  author: string;
  /** ISO date (YYYY-MM-DD) this guide was first published. */
  datePublished: string;
  /** ISO date (YYYY-MM-DD) this guide was last substantively updated. */
  updatedAt: string;
}

export interface GuideModule {
  default: ComponentType;
  frontmatter: GuideFrontmatter;
}

export const GUIDE_SLUGS = [
  "emi-calculation-explained",
  "swp-vs-bank-account-emi",
  "home-loan-tax-benefits",
  "prepay-vs-invest",
  "down-payment-strategy",
] as const;

export type GuideSlug = (typeof GUIDE_SLUGS)[number];

/**
 * Explicit static imports (one per known guide) rather than a dynamic
 * `import(`content/guides/${slug}.mdx`)` — with only five articles this is
 * simpler, fully type-checkable, and sidesteps any bundler edge cases with
 * template-literal dynamic imports.
 */
export const guideLoaders: Record<GuideSlug, () => Promise<GuideModule>> = {
  "emi-calculation-explained": () =>
    import("content/guides/emi-calculation-explained.mdx") as Promise<GuideModule>,
  "swp-vs-bank-account-emi": () =>
    import("content/guides/swp-vs-bank-account-emi.mdx") as Promise<GuideModule>,
  "home-loan-tax-benefits": () =>
    import("content/guides/home-loan-tax-benefits.mdx") as Promise<GuideModule>,
  "prepay-vs-invest": () => import("content/guides/prepay-vs-invest.mdx") as Promise<GuideModule>,
  "down-payment-strategy": () =>
    import("content/guides/down-payment-strategy.mdx") as Promise<GuideModule>,
};

export function isGuideSlug(slug: string): slug is GuideSlug {
  return (GUIDE_SLUGS as readonly string[]).includes(slug);
}
