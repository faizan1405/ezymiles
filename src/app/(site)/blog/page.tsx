import type { Metadata } from "next";
import Link from "next/link";
import { Clock, BookOpen } from "lucide-react";

import { getBlogCategories, getBlogPosts } from "@/server/catalog";
import { SmartImage } from "@/components/ui/smart-image";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { buildQueryString, formatDate } from "@/lib/utils";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Travel inspiration",
  description:
    "Destination guides, visa timelines, the months worth avoiding, and honest budget breakdowns.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : 1) || 1);

  const [result, categories] = await Promise.all([
    getBlogPosts({ category, page, limit: 9 }),
    getBlogCategories(),
  ]);

  const buildHref = (next: number) =>
    `/blog${buildQueryString({ category, page: next })}`;

  return (
    <>
      <header className="border-b border-hairline wash-ivory pb-10 pt-8">
        <div className="container-page">
          <Breadcrumbs items={[{ name: "Travel inspiration", href: "/blog" }]} />

          <div className="mt-6 max-w-3xl">
            <h1 className="text-3xl leading-tight text-midnight-900 sm:text-4xl lg:text-5xl">
              Read before you book
            </h1>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              Written by the people who plan the trips — including the parts a brochure would leave
              out.
            </p>
          </div>

          {categories.length ? (
            <div className="no-scrollbar -mx-5 mt-7 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
              <Link
                href="/blog"
                aria-current={!category ? "page" : undefined}
                className={
                  !category
                    ? "shrink-0 rounded-full bg-midnight-900 px-4 py-2.5 text-sm font-semibold text-white"
                    : "shrink-0 rounded-full border border-hairline bg-white px-4 py-2.5 text-sm font-semibold text-midnight-700 hover:border-midnight-300"
                }
              >
                All
              </Link>
              {categories.map((c) => {
                const active = category === c;
                return (
                  <Link
                    key={c}
                    href={`/blog?category=${encodeURIComponent(c)}`}
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "shrink-0 rounded-full bg-midnight-900 px-4 py-2.5 text-sm font-semibold text-white"
                        : "shrink-0 rounded-full border border-hairline bg-white px-4 py-2.5 text-sm font-semibold text-midnight-700 hover:border-midnight-300"
                    }
                  >
                    {c}
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
      </header>

      <div className="container-page section-y !pt-12">
        {result.items.length === 0 ? (
          <EmptyState
            icon={<BookOpen />}
            title="No articles here yet"
            description="Guides appear as soon as they're published from the admin panel."
            action={
              <Button asChild variant="accent">
                <Link href="/packages">Browse packages instead</Link>
              </Button>
            }
          />
        ) : (
          <>
            <RevealGroup as="ul" className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {result.items.map((post) => (
                <RevealItem as="li" key={post.id}>
                  <article className="group relative flex h-full flex-col">
                    <div className="relative aspect-16/10 overflow-hidden rounded-2xl">
                      <SmartImage
                        src={post.coverImage}
                        alt={post.coverAlt}
                        fill
                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:group-hover:scale-100"
                      />
                    </div>

                    <div className="flex flex-1 flex-col pt-5">
                      <p className="text-[0.625rem] font-bold uppercase tracking-widest text-lagoon-700">
                        {post.category}
                      </p>

                      <h2 className="mt-2 font-display text-xl leading-snug text-midnight-900">
                        <Link
                          href={`/blog/${post.slug}`}
                          className="after:absolute after:inset-0 hover:text-lagoon-800"
                        >
                          {post.title}
                        </Link>
                      </h2>

                      <p className="mt-2 line-clamp-3 text-[0.875rem] leading-relaxed text-muted">
                        {post.excerpt}
                      </p>

                      <p className="mt-auto flex items-center gap-3 pt-5 text-xs text-muted">
                        <span>{formatDate(post.publishedAt)}</span>
                        <span aria-hidden>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" aria-hidden />
                          {post.readingMinutes} min
                        </span>
                      </p>
                    </div>
                  </article>
                </RevealItem>
              ))}
            </RevealGroup>

            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              buildHref={buildHref}
              className="mt-14"
            />
          </>
        )}
      </div>
    </>
  );
}
