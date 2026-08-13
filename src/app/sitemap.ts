import type { MetadataRoute } from "next";
import { GUIDE_SLUGS } from "@/lib/guides";

const BASE_URL = "https://planmyloans.in";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/guides`, changeFrequency: "weekly", priority: 0.8 },
  ];

  const guideRoutes: MetadataRoute.Sitemap = GUIDE_SLUGS.map((slug) => ({
    url: `${BASE_URL}/guides/${slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...guideRoutes];
}
