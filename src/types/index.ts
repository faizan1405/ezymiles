import type { MediaAsset } from "@/models/types";

/**
 * DTOs that cross the server → client boundary. Lean, serialisable, and free of
 * Mongo internals so they can be handed straight to client components.
 */

export interface PackageCardDTO {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  destinationName: string;
  citiesCovered: string[];
  scope: "domestic" | "international";
  durationDays: number;
  durationNights: number;
  heroImage: string;
  heroAlt: string;
  startingPriceINR: number;
  originalPriceINR?: number;
  priceBasis: "per_person" | "per_couple";
  tripTypes: string[];
  hotelCategory: number;
  flightsIncluded: boolean;
  mealsIncluded: boolean;
  activitiesIncluded: boolean;
  transfersIncluded: boolean;
  visaIncluded: boolean;
  tripStyle: "group" | "private";
  instantConfirmation: boolean;
  ratingAverage: number;
  ratingCount: number;
  isTrending: boolean;
  isBestseller: boolean;
  isFeatured: boolean;
  isDemoData: boolean;
}

export interface DestinationCardDTO {
  id: string;
  slug: string;
  name: string;
  country: string;
  scope: "domestic" | "international";
  themes: string[];
  heroImage: string;
  heroAlt: string;
  summary: string;
  startingPriceINR: number;
  recommendedDurationDays: number;
  bestMonths: string[];
  packageCount: number;
  coordinates: { lat: number; lng: number };
  isTrending: boolean;
}

export interface ActivityCardDTO {
  id: string;
  slug: string;
  title: string;
  city: string;
  category: string;
  heroImage: string;
  heroAlt: string;
  summary: string;
  durationMinutes: number;
  pricePerAdultINR: number;
  originalPriceINR?: number;
  ratingAverage: number;
  ratingCount: number;
  instantConfirmation: boolean;
  isDemoData: boolean;
}

export interface HotelCardDTO {
  id: string;
  slug: string;
  name: string;
  city: string;
  country: string;
  starCategory: number;
  propertyType: string;
  heroImage: string;
  heroAlt: string;
  summary: string;
  amenities: string[];
  startingPriceINR: number;
  ratingAverage: number;
  ratingCount: number;
  isDemoData: boolean;
}

export interface OfferDTO {
  id: string;
  slug: string;
  title: string;
  kind: string;
  headline: string;
  description: string;
  image: string;
  couponCode?: string;
  discountLabel: string;
  ctaLabel: string;
  ctaHref: string;
  endsAt: string;
}

export interface ReviewDTO {
  id: string;
  authorName: string;
  authorPhoto?: string;
  authorLocation?: string;
  destination?: string;
  rating: number;
  title: string;
  body: string;
  videoUrl?: string;
  isVerifiedBooking: boolean;
  travelledOn?: string;
  subjectTitle?: string;
}

export interface BlogCardDTO {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  coverAlt: string;
  category: string;
  readingMinutes: number;
  publishedAt: string;
  authorName: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function mediaUrl(media?: MediaAsset | null): string {
  return media?.url ?? "";
}
