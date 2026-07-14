import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { AdminPageHeader } from "@/components/admin/ui";
import { BlogEditor, emptyBlog } from "@/components/admin/blog-editor";

export const metadata: Metadata = { title: "New article", robots: { index: false } };

export default async function NewBlogPage() {
  await requireAdmin("blogs:manage");

  return (
    <div>
      <AdminPageHeader title="New article" />
      <BlogEditor initial={emptyBlog} />
    </div>
  );
}
