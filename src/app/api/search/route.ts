import { NextResponse, type NextRequest } from "next/server";
import { tryConnectDB } from "@/lib/db";
import { Activity, Destination, Package } from "@/models";
import { guard } from "@/lib/rate-limit";
import { formatDuration } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface SearchHit {
  kind: "destination" | "package" | "activity";
  title: string;
  subtitle: string;
  href: string;
  priceINR?: number;
}

export async function GET(request: NextRequest) {
  const limit = await guard("search", { limit: 40, windowSeconds: 60 });
  if (!limit.success) {
    return NextResponse.json(
      { hits: [], error: "Too many searches. Please slow down." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const term = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 60);
  if (term.length < 2) return NextResponse.json({ hits: [] });

  if (!(await tryConnectDB())) return NextResponse.json({ hits: [] });

  const rx = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const published = { status: "published", deletedAt: null } as const;

  try {
    const [destinations, packages, activities] = await Promise.all([
      Destination.find({ ...published, $or: [{ name: rx }, { country: rx }] })
        .select("name slug country startingPriceINR")
        .limit(4)
        .lean(),
      Package.find({ ...published, $or: [{ title: rx }, { citiesCovered: rx }, { subtitle: rx }] })
        .select("title slug durationDays durationNights startingPriceINR")
        .limit(5)
        .lean(),
      Activity.find({ ...published, $or: [{ title: rx }, { city: rx }] })
        .select("title slug city pricePerAdultINR")
        .limit(3)
        .lean(),
    ]);

    const hits: SearchHit[] = [
      ...destinations.map((d) => ({
        kind: "destination" as const,
        title: d.name,
        subtitle: d.country,
        href: `/destinations/${d.slug}`,
        priceINR: d.startingPriceINR,
      })),
      ...packages.map((p) => ({
        kind: "package" as const,
        title: p.title,
        subtitle: formatDuration(p.durationDays, p.durationNights),
        href: `/packages/${p.slug}`,
        priceINR: p.startingPriceINR,
      })),
      ...activities.map((a) => ({
        kind: "activity" as const,
        title: a.title,
        subtitle: a.city,
        href: `/activities/${a.slug}`,
        priceINR: a.pricePerAdultINR,
      })),
    ];

    return NextResponse.json({ hits });
  } catch (error) {
    console.error("[api/search]", error);
    return NextResponse.json({ hits: [] }, { status: 200 });
  }
}
