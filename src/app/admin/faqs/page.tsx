import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { tryConnectDB } from "@/lib/db";
import { FAQ } from "@/models";
import { AdminPageHeader } from "@/components/admin/ui";
import { FaqManager } from "@/components/admin/faq-manager";
import { serialise } from "@/lib/utils";
import type { IFAQ } from "@/models";

export const metadata: Metadata = { title: "FAQs", robots: { index: false } };

export default async function AdminFAQsPage() {
  await requireAdmin("faqs:manage");

  if (!(await tryConnectDB())) {
    return (
      <div>
        <AdminPageHeader title="FAQs" />
        <p className="rounded-2xl border border-hairline bg-white p-8 text-center text-sm text-muted">
          The database is unreachable.
        </p>
      </div>
    );
  }

  const rows = await FAQ.find({}).sort({ group: 1, order: 1 }).lean();
  const faqs = serialise(rows) as unknown as IFAQ[];

  return (
    <div>
      <AdminPageHeader
        title="FAQs"
        description="These power the /faqs page and are emitted as FAQ structured data for search engines."
      />

      <FaqManager
        faqs={faqs.map((f) => ({
          id: String(f._id),
          question: f.question,
          answer: f.answer,
          group: f.group,
          order: f.order,
          isActive: f.isActive,
        }))}
      />
    </div>
  );
}
