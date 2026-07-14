import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Eye } from "lucide-react";

import { requireAdmin } from "@/lib/session";
import { tryConnectDB } from "@/lib/db";
import { BlogPost } from "@/models";
import {
  AdminPageHeader,
  StatusPill,
  Table,
  TableEmpty,
  Td,
  Th,
  STATUS_TONE,
} from "@/components/admin/ui";
import { FilterBar } from "@/components/admin/filter-bar";
import { EntityActions } from "@/components/admin/entity-actions";
import { SmartImage } from "@/components/ui/smart-image";
import { Button } from "@/components/ui/button";
import { formatDate, serialise } from "@/lib/utils";
import type { QueryFilter } from "mongoose";
import type { IBlogPost } from "@/models";

export const metadata: Metadata = { title: "Blog", robots: { index: false } };

export default async function AdminBlogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("blogs:manage");
  const sp = await searchParams;

  if (!(await tryConnectDB())) {
    return (
      <div>
        <AdminPageHeader title="Blog" />
        <p className="rounded-2xl border border-hairline bg-white p-8 text-center text-sm text-muted">
          The database is unreachable.
        </p>
      </div>
    );
  }

  const query: QueryFilter<IBlogPost> = { deletedAt: null };

  const status = typeof sp.status === "string" ? sp.status : undefined;
  if (status) query.status = status as IBlogPost["status"];

  const q = typeof sp.q === "string" && sp.q ? sp.q : undefined;
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ title: rx }, { category: rx }, { slug: rx }];
  }

  const rows = await BlogPost.find(query).sort({ updatedAt: -1 }).lean();
  const posts = serialise(rows) as unknown as IBlogPost[];

  return (
    <div>
      <AdminPageHeader
        title="Travel inspiration"
        description="Guides and destination writing. Published articles feed the homepage and the blog index."
        action={
          <Button asChild variant="accent">
            <Link href="/admin/blogs/new">
              <Plus aria-hidden />
              New article
            </Link>
          </Button>
        }
      />

      <FilterBar
        searchPlaceholder="Search title or category…"
        tabs={[
          { key: "", label: "All" },
          { key: "published", label: "Published" },
          { key: "draft", label: "Draft" },
          { key: "archived", label: "Archived" },
        ]}
      />

      <Table caption="Articles">
        <thead>
          <tr className="border-b border-hairline bg-sand-50">
            <Th>Article</Th>
            <Th>Category</Th>
            <Th>Published</Th>
            <Th className="text-right">Views</Th>
            <Th>Status</Th>
            <Th />
          </tr>
        </thead>

        <tbody className="divide-y divide-hairline">
          {posts.length === 0 ? (
            <TableEmpty colSpan={6} message="No articles yet." />
          ) : (
            posts.map((p) => (
              <tr key={String(p._id)} className="transition-colors hover:bg-sand-50">
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg">
                      <SmartImage
                        src={p.coverImage?.url}
                        alt={p.coverImage?.alt || p.title}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/blogs/${String(p._id)}`}
                        className="block max-w-72 truncate text-sm font-semibold text-midnight-900 hover:text-lagoon-700"
                      >
                        {p.title}
                      </Link>
                      <span className="mt-0.5 block text-xs text-muted">
                        {p.readingMinutes} min read
                        {p.isFeatured ? " · Featured" : ""}
                      </span>
                    </div>
                  </div>
                </Td>

                <Td className="text-xs">{p.category}</Td>

                <Td className="whitespace-nowrap text-xs">
                  {p.publishedAt ? formatDate(p.publishedAt) : "—"}
                </Td>

                <Td className="text-right text-xs text-muted">{p.viewCount ?? 0}</Td>

                <Td>
                  <StatusPill status={p.status} tone={STATUS_TONE[p.status] ?? "neutral"} />
                </Td>

                <Td>
                  <div className="flex items-center gap-1">
                    <a
                      href={`/blog/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Preview ${p.title}`}
                      className="flex size-8 items-center justify-center rounded-lg text-midnight-400 hover:bg-sand-100 hover:text-midnight-900"
                    >
                      <Eye className="size-4" aria-hidden />
                    </a>

                    <EntityActions
                      kind="blog"
                      id={String(p._id)}
                      label={p.title}
                      status={p.status}
                      editHref={`/admin/blogs/${String(p._id)}`}
                    />
                  </div>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
}
