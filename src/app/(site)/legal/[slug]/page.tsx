import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, FileText } from "lucide-react";

import { LEGAL_PAGES, LEGAL_SLUGS } from "@/config/legal";
import { getSettings } from "@/lib/settings";
import { tryConnectDB } from "@/lib/db";
import { LegalPage } from "@/models";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { formatDate } from "@/lib/utils";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return LEGAL_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = LEGAL_PAGES.find((p) => p.slug === slug);

  if (!page) return { title: "Page not found" };

  return {
    title: page.title,
    description: page.summary,
    alternates: { canonical: `/legal/${page.slug}` },
  };
}

export default async function LegalDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const seed = LEGAL_PAGES.find((p) => p.slug === slug);
  if (!seed) notFound();

  const settings = await getSettings();

  // An admin-edited version overrides the scaffold entirely.
  let override: { body: string; isPlaceholder: boolean; updatedAt: Date } | null = null;

  if (await tryConnectDB()) {
    const doc = await LegalPage.findOne({ slug }).lean().catch(() => null);
    if (doc) {
      override = {
        body: doc.body,
        isPlaceholder: doc.isPlaceholder,
        updatedAt: doc.updatedAt,
      };
    }
  }

  const isPlaceholder = override ? override.isPlaceholder : true;

  const brand = (text: string) =>
    text
      .replaceAll("[TRAVEL BRAND NAME]", settings.brand.name)
      .replaceAll("[EMAIL ADDRESS]", settings.contact.email)
      .replaceAll("[PHONE NUMBER]", settings.contact.phone)
      .replaceAll("[OFFICE ADDRESS]", settings.contact.address);

  return (
    <div className="container-page section-y !pt-8">
      <Breadcrumbs
        items={[
          { name: "Legal", href: `/legal/${slug}` },
          { name: seed.title, href: `/legal/${slug}` },
        ]}
      />

      <div className="mx-auto mt-8 max-w-3xl">
        <header>
          <p className="flex items-center gap-2 text-eyebrow text-lagoon-700">
            <FileText className="size-3.5" aria-hidden />
            Legal
          </p>
          <h1 className="mt-3 text-3xl text-midnight-900 sm:text-4xl">{seed.title}</h1>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">{seed.summary}</p>

          {override ? (
            <p className="mt-3 text-xs text-muted">
              Last updated {formatDate(override.updatedAt)}
            </p>
          ) : null}
        </header>

        {/* The one thing that must be impossible to miss. */}
        {isPlaceholder ? (
          <div
            role="note"
            className="mt-8 flex items-start gap-3 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-5"
          >
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden />
            <div>
              <p className="text-sm font-bold text-amber-900">
                Placeholder text — not legal advice, and not ready to publish
              </p>
              <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-amber-900">
                This page sets out the structure and the questions a lawyer needs to answer. It must
                be reviewed and completed by a qualified professional in your jurisdiction before the
                site goes live. Replace it from{" "}
                <span className="font-semibold">Admin → Legal Pages</span> and clear the placeholder
                flag once it has been signed off.
              </p>
            </div>
          </div>
        ) : null}

        <div className="mt-10">
          {override ? (
            <div className="space-y-5">
              {override.body.split(/\n{2,}/).map((block, i) =>
                block.startsWith("## ") ? (
                  <h2 key={i} className="mt-10 text-xl text-midnight-900 first:mt-0">
                    {brand(block.replace(/^##\s+/, ""))}
                  </h2>
                ) : (
                  <p key={i} className="text-[0.9375rem] leading-relaxed text-muted">
                    {brand(block)}
                  </p>
                ),
              )}
            </div>
          ) : (
            <div className="space-y-10">
              {seed.sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="text-xl text-midnight-900">{section.heading}</h2>
                  <div className="mt-3 space-y-3">
                    {section.body.map((para, i) => {
                      const isPlaceholderLine = para.startsWith("PLACEHOLDER:");
                      return (
                        <p
                          key={i}
                          className={
                            isPlaceholderLine
                              ? "rounded-xl border border-dashed border-amber-300 bg-amber-50 p-3 text-[0.875rem] leading-relaxed text-amber-900"
                              : "text-[0.9375rem] leading-relaxed text-muted"
                          }
                        >
                          {brand(para)}
                        </p>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <footer className="mt-14 border-t border-hairline pt-8">
          <h2 className="text-sm font-bold text-midnight-900">Other legal pages</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {LEGAL_PAGES.filter((p) => p.slug !== slug).map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/legal/${p.slug}`}
                  className="rounded-full border border-hairline px-3.5 py-2 text-xs font-semibold text-midnight-700 transition-colors hover:border-midnight-300 hover:bg-sand-50"
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-xs leading-relaxed text-muted">
            Questions about any of this: {settings.contact.email} · {settings.contact.phone}
          </p>
        </footer>
      </div>
    </div>
  );
}
