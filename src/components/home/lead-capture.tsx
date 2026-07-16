"use client";

import * as React from "react";
import { Download, MessageCircle, CalendarClock, Check } from "lucide-react";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { CallbackDialog } from "@/components/forms/callback-dialog";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { whatsappLink } from "@/lib/utils";

/**
 * Three low-friction ways to raise a hand, for people who aren't ready to book:
 * a guide download, WhatsApp updates, and a free consultation.
 */
export function LeadCapture({ whatsapp }: { whatsapp: string }) {
  const [callbackOpen, setCallbackOpen] = React.useState(false);

  return (
    <section className="section-y bg-canvas">
      <div className="container-page">
        <Reveal>
          <div className="overflow-hidden rounded-3xl border border-hairline bg-surface shadow-lift">
            <div className="grid lg:grid-cols-2">
              {/* ------------------------------- Newsletter ------------------------------ */}
              <div className="p-8 sm:p-10 lg:p-12">
                <p className="text-eyebrow text-lagoon-700">Not ready to book?</p>
                <h2 className="mt-3 text-3xl leading-tight text-midnight-900 sm:text-4xl">
                  Take something useful with you.
                </h2>
                <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-muted">
                  Our free planning guide covers visa lead times, the months worth avoiding, and a
                  realistic budget breakdown for twelve destinations.
                </p>

                <div className="mt-8">
                  <NewsletterForm variant="card" source="lead-capture" />
                </div>

                <ul className="mt-6 space-y-2">
                  {[
                    "A 24-page destination planning guide, free",
                    "Early access to seasonal fares",
                    "No more than two emails a month",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted">
                      <Check className="size-4 shrink-0 text-lagoon-600" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* -------------------------------- Channels ------------------------------- */}
              <div className="wash-ocean p-8 text-white sm:p-10 lg:p-12">
                <h3 className="font-display text-2xl">Or just talk to a human</h3>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-lagoon-100">
                  No script, no pressure. Tell us roughly what you&apos;re thinking and
                  we&apos;ll tell you honestly whether it works.
                </p>

                <div className="mt-8 space-y-3">
                  <Channel
                    icon={<CalendarClock aria-hidden />}
                    title="Free 30-minute consultation"
                    description="Talk through dates, budget and route with a designer."
                    action={
                      <Button variant="glass" size="md" onClick={() => setCallbackOpen(true)}>
                        Book a call
                      </Button>
                    }
                  />

                  <Channel
                    icon={<MessageCircle aria-hidden />}
                    title="WhatsApp travel updates"
                    description="Fare drops and seasonal windows, only when they matter."
                    action={
                      <Button asChild variant="glass" size="md">
                        <a
                          href={whatsappLink(whatsapp, "Hi! Please add me to WhatsApp travel updates.")}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Opt in
                        </a>
                      </Button>
                    }
                  />

                  <Channel
                    icon={<Download aria-hidden />}
                    title="Download the planning guide"
                    description="Subscribe on the left and it lands in your inbox immediately."
                  />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      <CallbackDialog open={callbackOpen} onOpenChange={setCallbackOpen} />
    </section>
  );
}

function Channel({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/12 bg-white/[0.06] p-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/12 [&_svg]:size-5">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-midnight-200">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
