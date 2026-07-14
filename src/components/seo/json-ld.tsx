import type { Settings } from "@/lib/settings";
import { SITE_URL } from "@/config/site";

/**
 * Structured data.
 *
 * Review and aggregate-rating markup is only emitted when the underlying reviews
 * are real, approved rows in our database — we never mark up demo content as if
 * it were genuine customer feedback.
 */

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function OrganisationJsonLd({ settings }: { settings: Settings }) {
  const isPlaceholder = settings.contact.phone.startsWith("[");

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "TravelAgency",
        name: settings.brand.name,
        description: settings.seo.defaultDescription,
        url: SITE_URL,
        slogan: settings.brand.tagline,
        ...(settings.brand.logoUrl ? { logo: settings.brand.logoUrl } : {}),
        ...(isPlaceholder
          ? {}
          : {
              telephone: settings.contact.phone,
              email: settings.contact.email,
              address: {
                "@type": "PostalAddress",
                streetAddress: settings.contact.address,
                addressCountry: "IN",
              },
            }),
        areaServed: "Worldwide",
        sameAs: Object.values(settings.social).filter((v): v is string => Boolean(v) && v !== "#"),
      }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; href: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: `${SITE_URL}${item.href}`,
        })),
      }}
    />
  );
}

export function FaqJsonLd({ faqs }: { faqs: { question: string; answer: string }[] }) {
  if (!faqs.length) return null;

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      }}
    />
  );
}

export function TourProductJsonLd({
  name,
  description,
  image,
  slug,
  priceINR,
  rating,
  hasGenuineReviews,
}: {
  name: string;
  description: string;
  image: string;
  slug: string;
  priceINR: number;
  rating?: { average: number; count: number };
  /** Only pass true when the ratings come from verified rows, not demo seed data. */
  hasGenuineReviews: boolean;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name,
        description,
        image: image ? [image] : undefined,
        category: "Travel package",
        url: `${SITE_URL}/packages/${slug}`,
        offers: {
          "@type": "Offer",
          price: priceINR,
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}/packages/${slug}`,
        },
        ...(hasGenuineReviews && rating && rating.count > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: rating.average,
                reviewCount: rating.count,
                bestRating: 5,
                worstRating: 1,
              },
            }
          : {}),
      }}
    />
  );
}

export function BlogPostingJsonLd({
  title,
  description,
  image,
  slug,
  publishedAt,
  authorName,
}: {
  title: string;
  description: string;
  image: string;
  slug: string;
  publishedAt: string;
  authorName: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: title,
        description,
        image: image ? [image] : undefined,
        datePublished: publishedAt,
        author: { "@type": "Person", name: authorName },
        mainEntityOfPage: `${SITE_URL}/blog/${slug}`,
      }}
    />
  );
}
