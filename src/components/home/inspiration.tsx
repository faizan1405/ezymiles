import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import type { BlogCardDTO } from "@/types";
import { SmartImage } from "@/components/ui/smart-image";
import { SectionHeading } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { formatDate } from "@/lib/utils";

export function Inspiration({ posts }: { posts: BlogCardDTO[] }) {
  if (posts.length === 0) return null;

  const [lead, ...rest] = posts;

  return (
    <section className="section-y wash-ivory">
      <div className="container-page">
        <Reveal>
          <SectionHeading
            eyebrow="Travel inspiration"
            title="Read before you book"
            description="Destination guides, visa timelines, honest packing advice and the months we'd quietly avoid."
            action={
              <Button asChild variant="outline">
                <Link href="/blog">
                  All articles
                  <ArrowUpRight aria-hidden />
                </Link>
              </Button>
            }
          />
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-hairline bg-surface shadow-tile transition-shadow hover:shadow-lift">
              <div className="relative aspect-16/10 overflow-hidden">
                <SmartImage
                  src={lead.coverImage}
                  alt={lead.coverAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:group-hover:scale-100"
                />
              </div>
              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <p className="text-eyebrow text-lagoon-700">{lead.category}</p>
                <h3 className="mt-3 font-display text-2xl leading-snug text-midnight-900 sm:text-[1.75rem]">
                  <Link href={`/blog/${lead.slug}`} className="after:absolute after:inset-0 hover:text-lagoon-800">
                    {lead.title}
                  </Link>
                </h3>
                <p className="mt-3 line-clamp-3 text-[0.9375rem] leading-relaxed text-muted">
                  {lead.excerpt}
                </p>
                <p className="mt-auto flex items-center gap-3 pt-6 text-xs text-muted">
                  <span>{formatDate(lead.publishedAt)}</span>
                  <span aria-hidden>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" aria-hidden />
                    {lead.readingMinutes} min read
                  </span>
                </p>
              </div>
            </article>
          </Reveal>

          <RevealGroup as="ul" className="grid gap-4">
            {rest.slice(0, 3).map((p) => (
              <RevealItem as="li" key={p.id}>
                <article className="group relative flex gap-4 rounded-2xl border border-hairline bg-surface p-4 transition-all hover:-translate-y-0.5 hover:shadow-tile motion-reduce:hover:translate-y-0">
                  <div className="relative size-24 shrink-0 overflow-hidden rounded-xl sm:size-28">
                    <SmartImage
                      src={p.coverImage}
                      alt={p.coverAlt}
                      fill
                      sizes="112px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:group-hover:scale-100"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <p className="text-[0.625rem] font-bold uppercase tracking-widest text-lagoon-700">
                      {p.category}
                    </p>
                    <h3 className="mt-1.5 font-display text-base leading-snug text-midnight-900">
                      <Link href={`/blog/${p.slug}`} className="after:absolute after:inset-0 hover:text-lagoon-800">
                        {p.title}
                      </Link>
                    </h3>
                    <p className="mt-2 flex items-center gap-2 text-xs text-muted">
                      <Clock className="size-3.5" aria-hidden />
                      {p.readingMinutes} min read
                    </p>
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
