import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { BlogPost } from "@/models";
import { AdminPageHeader } from "@/components/admin/ui";
import { BlogEditor, type BlogFormValues } from "@/components/admin/blog-editor";
import { serialise } from "@/lib/utils";
import type { IBlogPost } from "@/models";

export const metadata: Metadata = { title: "Edit article", robots: { index: false } };

export default async function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("blogs:manage");
  const { id } = await params;

  await connectDB();
  const doc = await BlogPost.findById(id).lean().catch(() => null);
  if (!doc) notFound();

  const p = serialise(doc) as unknown as IBlogPost;

  const initial: BlogFormValues = {
    id: String(p._id),
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    body: p.body,
    coverImage: { url: p.coverImage?.url ?? "", alt: p.coverImage?.alt ?? "" },
    category: p.category,
    tags: p.tags ?? [],
    authorName: p.author?.name ?? "Editorial Team",
    authorRole: p.author?.role ?? "",
    readingMinutes: p.readingMinutes,
    status: p.status,
    isFeatured: p.isFeatured,
    seoTitle: p.seo?.title ?? "",
    seoDescription: p.seo?.description ?? "",
  };

  return (
    <div>
      <AdminPageHeader title={p.title} description={`${p.viewCount ?? 0} views`} />
      <BlogEditor initial={initial} />
    </div>
  );
}
