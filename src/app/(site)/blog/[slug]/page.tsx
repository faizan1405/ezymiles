import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";

import { getBlogPostBySlug, getBlogPosts, getPackagesByIds } from "@/server/catalog";
import { SmartImage } from "@/components/ui/smart-image";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PackageCard } from "@/components/packages/package-card";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { BlogPostingJsonLd } from "@/components/seo/json-ld";
import { formatDate, initials } from "@/lib/utils";
import { SITE_URL } from "@/config/site";
import type { IBlogPost } from "@/models";

export const revalidate = 900;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = (await getBlogPostBySlug(slug)) as unknown as IBlogPost | null;

  if (!post) return { title: "Article not found" };

  return {
    title: post.seo?.title || post.title,
    description: post.seo?.description || post.excerpt,
    keywords: post.seo?.keywords ?? post.tags,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: `${SITE_URL}/blog/${post.slug}`,
      publishedTime: String(post.publishedAt),
      images: post.coverImage?.url ? [{ url: post.coverImage.url }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  const post = (await getBlogPostBySlug(slug)) as unknown as IBlogPost | null;
  if (!post) notFound();

  const [related, linkedPackages] = await Promise.all([
    getBlogPosts({ category: post.category, limit: 4 }),
    post.relatedPackages?.length
      ? getPackagesByIds(post.relatedPackages.map(String).slice(0, 3))
      : Promise.resolve([]),
  ]);

  const more = related.items.filter((p) => p.slug !== post.slug).slice(0, 3);

  // Body is stored as plain paragraphs separated by blank lines, with lines
  // starting "## " treated as subheadings — enough structure for a travel guide
  // without opening an HTML injection surface.
  const blocks = post.body.split(/\n{2,}/).filter(Boolean);

  return (
    <>
      <article>
        <header className="border-b border-hairline bg-white pb-10 pt-8">
          <div className="container-page">
            <Breadcrumbs
              items={[
                { name: "Travel inspiration", href: "/blog" },
                { name: post.title, href: `/blog/${post.slug}` },
              ]}
            />

            <div className="mx-auto mt-8 max-w-3xl">
              <p className="text-eyebrow text-lagoon-700">{post.category}</p>

              <h1 className="mt-4 text-3xl leading-tight text-midnight-900 sm:text-4xl lg:text-5xl">
                {post.title}
              </h1>

              <p className="mt-5 text-lg leading-relaxed text-muted">{post.excerpt}</p>

              <div className="mt-7 flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-2.5">
                  <span className="flex size-10 items-center justify-center rounded-full bg-midnight-900 text-xs font-bold text-white">
                    {initials(post.author?.name ?? "Editorial Team")}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-midnight-900">
                      {post.author?.name ?? "Editorial Team"}
                    </span>
                    {post.author?.role ? (
                      <span className="block text-xs text-muted">{post.author.role}</span>
                    ) : null}
                  </span>
                </span>

                <span className="flex items-center gap-3 text-xs text-muted">
                  <span>{formatDate(post.publishedAt)}</span>
                  <span aria-hidden>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" aria-hidden />
                    {post.readingMinutes} min read
                  </span>
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="container-page py-10">
          <div className="mx-auto max-w-4xl">
            <div className="relative aspect-16/9 overflow-hidden rounded-3xl">
              <SmartImage
                src={post.coverImage?.url}
                alt={post.coverImage?.alt || post.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 56rem"
                className="object-cover"
              />
            </div>
          </div>

          <div className="mx-auto mt-12 max-w-3xl">
            {blocks.map((block, i) =>
              block.startsWith("## ") ? (
                <h2
                  key={i}
                  className="mt-10 text-2xl leading-snug text-midnight-900 first:mt-0 sm:text-[1.75rem]"
                >
                  {block.replace(/^##\s+/, "")}
                </h2>
              ) : block.startsWith("- ") ? (
                <ul key={i} className="mt-5 space-y-2">
                  {block.split("\n").map((line) => (
                    <li key={line} className="flex items-start gap-2.5">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-lagoon-500" aria-hidden />
                      <span className="text-[1.0625rem] leading-relaxed text-midnight-700">
                        {line.replace(/^-\s+/, "")}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p key={i} className="mt-5 text-[1.0625rem] leading-relaxed text-midnight-700">
                  {block}
                </p>
              ),
            )}

            {post.tags?.length ? (
              <ul className="mt-10 flex flex-wrap gap-2 border-t border-hairline pt-8">
                {post.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full bg-sand-100 px-3 py-1.5 text-xs font-medium text-midnight-700"
                  >
                    #{tag}
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-12 rounded-3xl wash-ocean p-8 text-white">
              <h2 className="font-display text-xl">Get the next one</h2>
              <p className="mt-2 text-sm leading-relaxed text-lagoon-100">
                Two emails a month. Guides like this, plus fares worth acting on.
              </p>
              <div className="mt-6">
                <NewsletterForm variant="footer" source="blog" />
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* -------------------------- Packages from this guide ------------------------ */}
      {linkedPackages.length ? (
        <section className="border-t border-hairline wash-ivory py-14">
          <div className="container-page">
            <h2 className="text-2xl text-midnight-900">Trips built on this advice</h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {linkedPackages.map((p) => (
                <li key={p.id}>
                  <PackageCard pkg={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* --------------------------------- Related -------------------------------- */}
      {more.length ? (
        <section className="border-t border-hairline bg-white py-14">
          <div className="container-page">
            <div className="mb-8 flex items-center justify-between gap-4">
              <h2 className="text-2xl text-midnight-900">More in {post.category}</h2>
              <Link
                href={`/blog?category=${encodeURIComponent(post.category)}`}
                className="flex items-center gap-1.5 text-sm font-semibold text-lagoon-700 hover:underline"
              >
                See all
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>

            <ul className="grid gap-6 sm:grid-cols-3">
              {more.map((p) => (
                <li key={p.id}>
                  <Link href={`/blog/${p.slug}`} className="group block">
                    <div className="relative aspect-16/10 overflow-hidden rounded-2xl">
                      <SmartImage
                        src={p.coverImage}
                        alt={p.coverAlt}
                        fill
                        sizes="30vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:group-hover:scale-100"
                      />
                    </div>
                    <h3 className="mt-4 font-display text-base leading-snug text-midnight-900 group-hover:text-lagoon-800">
                      {p.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted">{p.readingMinutes} min read</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <BlogPostingJsonLd
        title={post.title}
        description={post.excerpt}
        image={post.coverImage?.url ?? ""}
        slug={post.slug}
        publishedAt={String(post.publishedAt)}
        authorName={post.author?.name ?? "Editorial Team"}
      />
    </>
  );
}
