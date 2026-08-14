export const SITE_NAME = "PlanMyLoans";

/** Shared across every page's openGraph.images / twitter.images — Next.js shallow-replaces the whole `openGraph` object per route segment, so any page setting its own openGraph must repeat this rather than relying on the root layout's default. */
export const OG_IMAGE_PATH = "/og-image.png";
export const OG_IMAGE = { url: OG_IMAGE_PATH, width: 1200, height: 630 };
