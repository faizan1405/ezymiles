import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";
import { LEGAL_SLUGS } from "@/config/legal";
import { tryConnectDB } from "@/lib/db";
import { Activity, BlogPost, Destination, Hotel, Package, VisaCountry } from "@/models";

export const revalidate = 3600;

/**
 * Only indexable, publicly useful URLs go in here. Account, admin, checkout and
 * query-driven result pages are deliberately excluded — they're also `noindex`
 * at the page level, so the two agree.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/packages`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/destinations`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/activities`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/hotels`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/flights`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/visa`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/cabs`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/customise-my-trip`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/faqs`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    ...LEGAL_SLUGS.map((slug) => ({
      url: `${SITE_URL}/legal/${slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];

  if (!(await tryConnectDB())) return staticRoutes;

  const published = { status: "published", deletedAt: null } as const;

  try {
    const [packages, destinations, activities, hotels, visas, posts] = await Promise.all([
      Package.find(published).select("slug updatedAt").lean(),
      Destination.find(published).select("slug updatedAt").lean(),
      Activity.find(published).select("slug updatedAt").lean(),
      Hotel.find(published).select("slug updatedAt").lean(),
      VisaCountry.find(published).select("slug updatedAt").lean(),
      BlogPost.find(published).select("slug updatedAt").lean(),
    ]);

    return [
      ...staticRoutes,
      ...destinations.map((d) => ({
        url: `${SITE_URL}/destinations/${d.slug}`,
        lastModified: d.updatedAt ?? now,
        changeFrequency: "weekly" as const,
        priority: 0.85,
      })),
      ...packages.map((p) => ({
        url: `${SITE_URL}/packages/${p.slug}`,
        lastModified: p.updatedAt ?? now,
        changeFrequency: "weekly" as const,
        priority: 0.85,
      })),
      ...activities.map((a) => ({
        url: `${SITE_URL}/activities/${a.slug}`,
        lastModified: a.updatedAt ?? now,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
      ...hotels.map((h) => ({
        url: `${SITE_URL}/hotels/${h.slug}`,
        lastModified: h.updatedAt ?? now,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
      ...visas.map((v) => ({
        url: `${SITE_URL}/visa/${v.slug}`,
        lastModified: v.updatedAt ?? now,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
      ...posts.map((b) => ({
        url: `${SITE_URL}/blog/${b.slug}`,
        lastModified: b.updatedAt ?? now,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ];
  } catch (error) {
    console.error("[sitemap]", error);
    return staticRoutes;
  }
}
