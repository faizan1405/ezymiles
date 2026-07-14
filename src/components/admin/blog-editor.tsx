"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, ArrowLeft, Eye } from "lucide-react";

import { saveBlogPost } from "@/server/admin/actions";
import { Panel } from "./ui";
import { ImageField, type MediaValue } from "./image-field";
import { StringListField, ToggleField } from "./field-kits";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { slugify } from "@/lib/utils";

export interface BlogFormValues {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImage: MediaValue;
  category: string;
  tags: string[];
  authorName: string;
  authorRole: string;
  readingMinutes: number;
  status: "draft" | "scheduled" | "published" | "archived";
  isFeatured: boolean;
  seoTitle: string;
  seoDescription: string;
}

export const emptyBlog: BlogFormValues = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  coverImage: { url: "", alt: "" },
  category: "Destination guides",
  tags: [],
  authorName: "Editorial Team",
  authorRole: "",
  readingMinutes: 6,
  status: "draft",
  isFeatured: false,
  seoTitle: "",
  seoDescription: "",
};

const CATEGORIES = [
  "Destination guides",
  "Best time to visit",
  "Visa guides",
  "Travel tips",
  "Suggested itineraries",
  "Food guides",
  "Packing guides",
  "Budget guides",
];

export function BlogEditor({ initial }: { initial: BlogFormValues }) {
  const router = useRouter();
  const [values, setValues] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);

  const set = <K extends keyof BlogFormValues>(key: K, value: BlogFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  // Roughly 200 words a minute — recalculated as you type so it can't drift.
  React.useEffect(() => {
    const words = values.body.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.round(words / 200));
    if (minutes !== values.readingMinutes) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- derived from values.body, guarded above
      setValues((v) => ({ ...v, readingMinutes: minutes }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.body]);

  const save = async (status?: BlogFormValues["status"]) => {
    setSaving(true);

    const result = await saveBlogPost({
      ...values,
      status: status ?? values.status,
      slug: values.slug || slugify(values.title),
    });

    if (result.ok) {
      toast.success("Saved", result.message);
      if (!values.id && result.id) router.push(`/admin/blogs/${result.id}`);
      else router.refresh();
    } else {
      toast.error("Could not save", result.message);
    }

    setSaving(false);
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/blogs"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-lagoon-700 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          All articles
        </Link>

        <div className="flex gap-2">
          {values.id && values.slug ? (
            <Button asChild size="sm" variant="outline">
              <a href={`/blog/${values.slug}`} target="_blank" rel="noopener noreferrer">
                <Eye aria-hidden />
                Preview
              </a>
            </Button>
          ) : null}

          <Button size="sm" variant="outline" onClick={() => save("draft")} loading={saving}>
            Save draft
          </Button>
          <Button size="sm" variant="accent" onClick={() => save("published")} loading={saving}>
            <Save aria-hidden />
            Publish
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-5">
          <Panel title="Article">
            <div className="space-y-4">
              <Field label="Title" htmlFor="b-title" required>
                <Input
                  id="b-title"
                  value={values.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="The months we'd quietly avoid in Bali"
                />
              </Field>

              <Field
                label="URL slug"
                htmlFor="b-slug"
                hint={`/blog/${values.slug || slugify(values.title) || "…"}`}
              >
                <Input id="b-slug" value={values.slug} onChange={(e) => set("slug", e.target.value)} />
              </Field>

              <Field label="Excerpt" htmlFor="b-excerpt" required hint="Shown on cards and in search.">
                <Textarea
                  id="b-excerpt"
                  rows={2}
                  value={values.excerpt}
                  onChange={(e) => set("excerpt", e.target.value)}
                />
              </Field>

              <Field
                label="Body"
                htmlFor="b-body"
                required
                hint='Plain paragraphs. Start a line with "## " for a subheading, or "- " for a bullet.'
              >
                <Textarea
                  id="b-body"
                  rows={20}
                  value={values.body}
                  onChange={(e) => set("body", e.target.value)}
                  className="font-mono text-sm leading-relaxed"
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Cover image">
            <ImageField
              label="Cover"
              required
              value={values.coverImage}
              onChange={(v) => set("coverImage", v)}
              folder="blog"
            />
          </Panel>
        </div>

        <aside className="space-y-5">
          <Panel title="Publication">
            <div className="space-y-4">
              <Field label="Status" htmlFor="b-status">
                <Select
                  id="b-status"
                  value={values.status}
                  onChange={(e) => set("status", e.target.value as BlogFormValues["status"])}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </Select>
              </Field>

              <Field label="Category" htmlFor="b-cat" required>
                <Select
                  id="b-cat"
                  value={values.category}
                  onChange={(e) => set("category", e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>

              <StringListField label="Tags" value={values.tags} onChange={(v) => set("tags", v)} />

              <ToggleField
                label="Featured"
                description="Leads the homepage inspiration section."
                checked={values.isFeatured}
                onChange={(v) => set("isFeatured", v)}
              />

              <p className="rounded-xl bg-sand-50 p-3 text-xs text-muted">
                Reading time is calculated from the body: <strong>{values.readingMinutes} min</strong>
              </p>
            </div>
          </Panel>

          <Panel title="Author">
            <div className="space-y-4">
              <Field label="Name" htmlFor="b-author">
                <Input
                  id="b-author"
                  value={values.authorName}
                  onChange={(e) => set("authorName", e.target.value)}
                />
              </Field>

              <Field label="Role" htmlFor="b-role">
                <Input
                  id="b-role"
                  value={values.authorRole}
                  onChange={(e) => set("authorRole", e.target.value)}
                  placeholder="Destination specialist, Southeast Asia"
                />
              </Field>
            </div>
          </Panel>

          <Panel title="SEO">
            <div className="space-y-4">
              <Field label="Meta title" htmlFor="b-seotitle">
                <Input
                  id="b-seotitle"
                  value={values.seoTitle}
                  onChange={(e) => set("seoTitle", e.target.value)}
                  placeholder={values.title}
                />
              </Field>

              <Field label="Meta description" htmlFor="b-seodesc">
                <Textarea
                  id="b-seodesc"
                  rows={3}
                  value={values.seoDescription}
                  onChange={(e) => set("seoDescription", e.target.value)}
                  placeholder={values.excerpt}
                />
              </Field>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
