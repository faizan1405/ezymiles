import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle } from "lucide-react";

import { getFAQs } from "@/server/catalog";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Accordion, AccordionItem } from "@/components/ui/overlays";
import { EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { FaqJsonLd } from "@/components/seo/json-ld";
import { titleCase } from "@/lib/utils";
import type { IFAQ } from "@/models";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "Booking, payments, cancellations, visas, flights and hotels — the questions people actually ask us.",
  alternates: { canonical: "/faqs" },
};

export default async function FAQsPage() {
  const faqs = (await getFAQs()) as unknown as IFAQ[];

  const grouped = faqs.reduce<Record<string, IFAQ[]>>((acc, faq) => {
    (acc[faq.group] ??= []).push(faq);
    return acc;
  }, {});

  return (
    <>
      <header className="border-b border-hairline wash-ivory pb-12 pt-8">
        <div className="container-page">
          <Breadcrumbs items={[{ name: "FAQs", href: "/faqs" }]} />

          <div className="mt-6 max-w-3xl">
            <h1 className="text-3xl leading-tight text-midnight-900 sm:text-4xl lg:text-5xl">
              Questions people actually ask
            </h1>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              If yours isn&apos;t here, ask us directly — we&apos;ll add it.
            </p>
          </div>
        </div>
      </header>

      <div className="container-page section-y">
        {faqs.length === 0 ? (
          <EmptyState
            icon={<HelpCircle />}
            title="No FAQs published yet"
            description="They'll appear here once they're added from the admin panel."
            action={
              <Button asChild variant="accent">
                <Link href="/contact">Ask us anything</Link>
              </Button>
            }
          />
        ) : (
          <div className="mx-auto max-w-3xl space-y-12">
            {Object.entries(grouped).map(([group, items]) => (
              <section key={group}>
                <h2 className="text-2xl text-midnight-900">{titleCase(group.replace(/_/g, " "))}</h2>
                <Accordion
                  type="single"
                  collapsible
                  className="mt-5 rounded-2xl border border-hairline bg-white px-5"
                >
                  {items.map((faq) => (
                    <AccordionItem key={String(faq._id)} value={String(faq._id)} trigger={faq.question}>
                      {faq.answer}
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            ))}

            <div className="rounded-3xl wash-ocean p-8 text-center text-white sm:p-12">
              <h2 className="font-display text-2xl">Still stuck?</h2>
              <p className="mx-auto mt-3 max-w-md text-[0.9375rem] leading-relaxed text-lagoon-100">
                A real person answers the phone, the WhatsApp and the email. Usually the same person.
              </p>
              <Button asChild size="lg" variant="gold" className="mt-6">
                <Link href="/contact">Contact us</Link>
              </Button>
            </div>
          </div>
        )}

        <FaqJsonLd faqs={faqs.map((f) => ({ question: f.question, answer: f.answer }))} />
      </div>
    </>
  );
}
