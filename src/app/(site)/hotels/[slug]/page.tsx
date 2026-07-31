import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin, Star, Clock, ShieldCheck } from "lucide-react";

import { getHotelBySlug, getReviewsForSubject } from "@/server/catalog";
import { Gallery } from "@/components/packages/gallery";
import { RoomSelector, type RoomOption } from "@/components/hotels/room-selector";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Rating, Badge } from "@/components/ui/primitives";
import { ReviewList } from "@/components/reviews/review-list";
import { SITE_URL } from "@/config/site";

export const revalidate = 600;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const hotel = await getHotelBySlug(slug);

  if (!hotel) return { title: "Hotel not found" };

  return {
    title: `${hotel.name}, ${hotel.city}`,
    description: hotel.summary,
    alternates: { canonical: `/hotels/${hotel.slug}` },
    openGraph: {
      title: `${hotel.name}, ${hotel.city}`,
      description: hotel.summary,
      url: `${SITE_URL}/hotels/${hotel.slug}`,
      images: hotel.heroImage?.url ? [{ url: hotel.heroImage.url }] : undefined,
    },
  };
}

export default async function HotelPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const hotel = await getHotelBySlug(slug);
  if (!hotel) notFound();

  const reviews = await getReviewsForSubject(String(hotel._id), 6);

  const gallery = [
    { url: hotel.heroImage?.url ?? "", alt: hotel.heroImage?.alt || hotel.name },
    ...(hotel.gallery ?? []).map((g) => ({ url: g.url, alt: g.alt || hotel.name })),
  ].filter((g) => g.url);

  const rooms: RoomOption[] = (hotel.rooms ?? []).map((r) => ({
    key: r.key,
    name: r.name,
    description: r.description,
    image: r.images?.[0]?.url,
    maxOccupancy: r.maxOccupancy,
    bedType: r.bedType,
    sizeSqft: r.sizeSqft,
    amenities: r.amenities ?? [],
    mealPlan: r.mealPlan,
    pricePerNightINR: r.pricePerNightINR,
    originalPricePerNightINR: r.originalPricePerNightINR,
    refundable: r.refundable,
    cancellationRule: r.cancellationRule,
    roomsAvailable: r.roomsAvailable,
  }));

  const checkIn = typeof sp.checkIn === "string" ? sp.checkIn : undefined;
  const checkOut = typeof sp.checkOut === "string" ? sp.checkOut : undefined;

  return (
    <>
      <div className="border-b border-hairline bg-white pb-8 pt-6">
        <div className="container-page">
          <Breadcrumbs
            items={[
              { name: "Hotels", href: "/hotels" },
              { name: hotel.name, href: `/hotels/${hotel.slug}` },
            ]}
          />

          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 max-w-2xl">
              <p className="flex items-center gap-1">
                {Array.from({ length: hotel.starCategory }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-gild-400 text-gild-400" aria-hidden />
                ))}
                <span className="ml-1.5 text-[0.6875rem] font-bold uppercase tracking-wider text-lagoon-700">
                  {hotel.propertyType}
                </span>
              </p>

              <h1 className="mt-2 text-3xl leading-tight text-midnight-900 sm:text-4xl">
                {hotel.name}
              </h1>

              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                <MapPin className="size-4" aria-hidden />
                {hotel.address || `${hotel.city}, ${hotel.country}`}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              {hotel.ratingCount > 0 ? (
                <Rating value={hotel.ratingAverage} count={hotel.ratingCount} size="md" />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="container-page pt-8">
        <Gallery items={gallery} title={hotel.name} />
      </div>

      <div className="container-page section-y !pt-10">
        <div className="grid gap-12 lg:grid-cols-[1fr_20rem] lg:gap-16">
          <div className="min-w-0 space-y-12">
            <section>
              <h2 className="text-2xl text-midnight-900">About this property</h2>
              <p className="mt-4 whitespace-pre-line text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {hotel.description || hotel.summary}
              </p>
            </section>

            <section id="rooms" className="scroll-mt-28">
              <h2 className="text-2xl text-midnight-900">Choose your room</h2>
              <p className="mt-2 text-sm text-muted">
                Prices update as you change dates — every total is calculated on our server.
              </p>
              <div className="mt-6">
                {rooms.length ? (
                  <RoomSelector
                    slug={hotel.slug}
                    rooms={rooms}
                    checkInDefault={checkIn}
                    checkOutDefault={checkOut}
                  />
                ) : (
                  <p className="rounded-2xl border border-dashed border-hairline bg-sand-50 p-6 text-sm text-muted">
                    Rooms for this property are being loaded. Contact us and we&apos;ll quote it directly.
                  </p>
                )}
              </div>
            </section>

            <section id="reviews">
              <h2 className="text-2xl text-midnight-900">Reviews</h2>
              <div className="mt-6">
                <ReviewList
                  reviews={reviews}
                  averageRating={hotel.ratingAverage}
                  totalCount={hotel.ratingCount}
                />
              </div>
            </section>
          </div>

          {/* -------------------------------- Sidebar -------------------------------- */}
          <aside className="space-y-6 lg:sticky lg:top-28 lg:h-fit">
            <div className="rounded-2xl border border-hairline bg-white p-5">
              <h2 className="text-sm font-bold text-midnight-900">Amenities</h2>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {(hotel.amenities ?? []).map((a: string) => (
                  <li
                    key={a}
                    className="rounded-lg bg-sand-100 px-2.5 py-1.5 text-[0.6875rem] font-medium capitalize text-midnight-700"
                  >
                    {a}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-hairline bg-white p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold text-midnight-900">
                <Clock className="size-4 text-lagoon-600" aria-hidden />
                Check-in / check-out
              </h2>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Check-in from</dt>
                  <dd className="font-semibold text-midnight-900">{hotel.checkInTime}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Check-out by</dt>
                  <dd className="font-semibold text-midnight-900">{hotel.checkOutTime}</dd>
                </div>
              </dl>
            </div>

            {hotel.policies?.length ? (
              <div className="rounded-2xl border border-hairline bg-white p-5">
                <h2 className="flex items-center gap-2 text-sm font-bold text-midnight-900">
                  <ShieldCheck className="size-4 text-lagoon-600" aria-hidden />
                  Property policies
                </h2>
                <ul className="mt-3 space-y-2">
                  {hotel.policies.map((p: string) => (
                    <li key={p} className="text-[0.8125rem] leading-relaxed text-muted">
                      • {p}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Map: a static, dependency-free locator rather than a heavy tile map. */}
            {hotel.coordinates?.lat ? (
              <div className="overflow-hidden rounded-2xl border border-hairline bg-white">
                <div className="relative flex h-40 items-center justify-center wash-ocean">
                  <div className="text-center text-white">
                    <MapPin className="mx-auto size-6" aria-hidden />
                    <p className="mt-2 text-xs font-semibold">
                      {hotel.coordinates.lat.toFixed(3)}, {hotel.coordinates.lng.toFixed(3)}
                    </p>
                  </div>
                </div>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${hotel.coordinates.lat}&mlon=${hotel.coordinates.lng}#map=15/${hotel.coordinates.lat}/${hotel.coordinates.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 text-center text-sm font-semibold text-lagoon-700 hover:underline"
                >
                  Open in maps
                </a>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </>
  );
}
