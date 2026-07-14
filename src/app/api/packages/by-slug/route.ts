import { NextResponse, type NextRequest } from "next/server";
import { tryConnectDB } from "@/lib/db";
import { Package } from "@/models";
import { serialise } from "@/lib/utils";
import type { PackageCardDTO } from "@/types";

export const dynamic = "force-dynamic";

/** Used by the client-side "recently viewed" rail, which only stores slugs. */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("slugs") ?? "";
  const slugs = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);

  if (!slugs.length || !(await tryConnectDB())) {
    return NextResponse.json({ items: [] });
  }

  try {
    const rows = await Package.find({ slug: { $in: slugs }, status: "published", deletedAt: null })
      .select("title slug heroImage durationDays durationNights startingPriceINR originalPriceINR")
      .lean();

    const bySlug = new Map(rows.map((r) => [r.slug, r]));

    const items = slugs
      .map((slug) => bySlug.get(slug))
      .filter(Boolean)
      .map((p) => {
        const row = serialise(p!);
        return {
          id: String(row._id),
          slug: row.slug,
          title: row.title,
          heroImage: row.heroImage?.url ?? "",
          heroAlt: row.heroImage?.alt || row.title,
          durationDays: row.durationDays,
          durationNights: row.durationNights,
          startingPriceINR: row.startingPriceINR,
          originalPriceINR: row.originalPriceINR,
        } as Partial<PackageCardDTO>;
      });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[api/packages/by-slug]", error);
    return NextResponse.json({ items: [] });
  }
}
