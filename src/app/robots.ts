import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private surfaces and query-driven result pages: nothing here is a useful
        // landing page, and crawling them wastes budget and leaks user context.
        disallow: [
          "/account",
          "/admin",
          "/checkout",
          "/booking/",
          "/api/",
          "/search",
          "/flights/search",
          "/flights/review",
          "/login",
          "/visa/track",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
