import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";

import { getSettings } from "@/lib/settings";
import { BRAND } from "@/config/site";
import { getFAQs } from "@/server/catalog";
import { ContactForm } from "@/components/forms/contact-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Accordion, AccordionItem } from "@/components/ui/overlays";
import { Button } from "@/components/ui/button";
import { FaqJsonLd } from "@/components/seo/json-ld";
import { whatsappLink } from "@/lib/utils";
import type { IFAQ } from "@/models";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Talk to a travel designer — by phone, WhatsApp, email or the form. We reply within one business day, usually much sooner.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const [settings, faqs] = await Promise.all([getSettings(), getFAQs("general")]);
  const faqList = (faqs as unknown as IFAQ[]).slice(0, 6);

  return (
    <>
      <header className="border-b border-hairline wash-ivory pb-12 pt-8">
        <div className="container-page">
          <Breadcrumbs items={[{ name: "Contact", href: "/contact" }]} />

          <div className="mt-6 max-w-3xl">
            <h1 className="text-3xl leading-tight text-midnight-900 sm:text-4xl lg:text-5xl">
              Talk to a person
            </h1>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              No chatbots, no ticket queues you never hear back from. Pick whichever channel suits
              you — the same team answers all of them.
            </p>
          </div>
        </div>
      </header>

      <div className="container-page section-y">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          {/* -------------------------------- Channels ------------------------------- */}
          <div>
            <h2 className="text-2xl text-midnight-900">How to reach us</h2>

            <ul className="mt-7 space-y-4">
              <ContactChannel
                icon={<Phone aria-hidden />}
                label="Phone"
                value={settings.contact.phone}
                href={`tel:${settings.contact.phone.replace(/\s/g, "")}`}
                note={settings.contact.officeHours}
              />

              <ContactChannel
                icon={<MessageCircle aria-hidden />}
                label="WhatsApp"
                value={settings.contact.whatsapp}
                href={whatsappLink(settings.contact.whatsapp, "Hi! I'd like help planning a trip.")}
                note="Fastest for quick questions"
                external
              />

              <ContactChannel
                icon={<Mail aria-hidden />}
                label="Email"
                value={settings.contact.email}
                href={`mailto:${settings.contact.email}`}
                note="We reply within one business day"
              />

              <li className="flex gap-4 rounded-2xl border border-hairline bg-white p-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sand-100 text-lagoon-700 [&_svg]:size-5">
                  <MapPin aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.625rem] font-bold uppercase tracking-widest text-muted">
                    Office
                  </p>
                  <address className="mt-1 text-sm not-italic leading-relaxed text-midnight-900">
                    <span className="font-semibold">{BRAND.legalName}</span>
                    <br />
                    {settings.contact.address}
                  </address>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                    <Clock className="size-3.5" aria-hidden />
                    {settings.contact.officeHours}
                  </p>
                </div>
              </li>
            </ul>

            <div className="mt-8 rounded-2xl wash-ocean p-6 text-white">
              <h3 className="font-display text-lg">Travelling right now?</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                If you&apos;re on a trip booked with us and something has gone wrong, call the number
                above — it&apos;s answered 24/7 for travellers in the air or on the ground.
              </p>
              <Button asChild variant="glass" className="mt-4">
                <a href={`tel:${settings.contact.phone.replace(/\s/g, "")}`}>
                  <Phone aria-hidden />
                  Call the 24/7 line
                </a>
              </Button>
            </div>
          </div>

          {/* --------------------------------- Form --------------------------------- */}
          <div className="rounded-3xl border border-hairline bg-white p-6 shadow-lift sm:p-8">
            <h2 className="text-2xl text-midnight-900">Send us a message</h2>
            <p className="mt-2 text-sm text-muted">
              Tell us roughly what you&apos;re after and we&apos;ll come back with something specific.
            </p>

            <div className="mt-7">
              <ContactForm />
            </div>
          </div>
        </div>

        {/* ---------------------------------- FAQs ---------------------------------- */}
        {faqList.length ? (
          <section className="mx-auto mt-20 max-w-3xl">
            <h2 className="text-center text-2xl text-midnight-900 sm:text-3xl">
              Before you write to us
            </h2>
            <Accordion type="single" collapsible className="mt-8 rounded-2xl border border-hairline px-5">
              {faqList.map((faq, i) => (
                <AccordionItem key={String(faq._id)} value={`faq-${i}`} trigger={faq.question}>
                  {faq.answer}
                </AccordionItem>
              ))}
            </Accordion>
            <FaqJsonLd faqs={faqList.map((f) => ({ question: f.question, answer: f.answer }))} />
          </section>
        ) : null}
      </div>
    </>
  );
}

function ContactChannel({
  icon,
  label,
  value,
  href,
  note,
  external,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
  note?: string;
  external?: boolean;
}) {
  return (
    <li>
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="group flex gap-4 rounded-2xl border border-hairline bg-white p-5 transition-colors hover:border-lagoon-300 hover:bg-lagoon-50/40"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sand-100 text-lagoon-700 transition-colors group-hover:bg-white [&_svg]:size-5">
          {icon}
        </span>
        <span className="min-w-0">
          <span className="block text-[0.625rem] font-bold uppercase tracking-widest text-muted">
            {label}
          </span>
          <span className="mt-1 block truncate text-sm font-semibold text-midnight-900">{value}</span>
          {note ? <span className="mt-0.5 block text-xs text-muted">{note}</span> : null}
        </span>
      </a>
    </li>
  );
}
