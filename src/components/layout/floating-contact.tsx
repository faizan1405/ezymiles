"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/components/ui/reduced-motion-context";
import { MessageCircle, Phone, X, Headset } from "lucide-react";
import type { Settings } from "@/lib/settings";
import { whatsappLink } from "@/lib/utils";
import { CallbackDialog } from "@/components/forms/callback-dialog";

/**
 * Persistent contact affordance. Collapsed to a single button so it never
 * competes with the page; expands on tap/click into the three channels the
 * business actually answers on.
 */
export function FloatingContact({ settings }: { settings: Settings }) {
  const [open, setOpen] = React.useState(false);
  const [callbackOpen, setCallbackOpen] = React.useState(false);
  const reduced = useReducedMotion();

  return (
    <>
      <div className="no-print fixed bottom-4 right-4 z-80 flex flex-col items-end gap-2.5 sm:bottom-6 sm:right-6">
        <AnimatePresence>
          {open ? (
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-end gap-2"
            >
              <ContactAction
                href={whatsappLink(
                  settings.contact.whatsapp,
                  "Hi! I'd like help planning a trip.",
                )}
                external
                icon={<MessageCircle aria-hidden />}
                label="Chat on WhatsApp"
                className="bg-[#128C7E] hover:bg-[#0f7a6d]"
              />
              <ContactAction
                href={`tel:${settings.contact.phone.replace(/\s/g, "")}`}
                icon={<Phone aria-hidden />}
                label={`Call ${settings.contact.phone}`}
                className="bg-midnight-900 hover:bg-midnight-800"
              />
              <button
                type="button"
                onClick={() => {
                  setCallbackOpen(true);
                  setOpen(false);
                }}
                className="flex items-center gap-2.5 rounded-full bg-lagoon-600 py-3 pl-4 pr-5 text-sm font-semibold text-white shadow-lift transition-colors hover:bg-lagoon-700"
              >
                <Headset className="size-[1.15rem]" aria-hidden />
                Request a callback
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close contact options" : "Open contact options"}
          className="flex size-14 items-center justify-center rounded-full bg-midnight-950 text-white shadow-float transition-transform hover:scale-105 motion-reduce:hover:scale-100"
        >
          {open ? (
            <X className="size-5" aria-hidden />
          ) : (
            <MessageCircle className="size-6" aria-hidden />
          )}
        </button>
      </div>

      <CallbackDialog open={callbackOpen} onOpenChange={setCallbackOpen} />
    </>
  );
}

function ContactAction({
  href,
  icon,
  label,
  className,
  external,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  className: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`flex items-center gap-2.5 rounded-full py-3 pl-4 pr-5 text-sm font-semibold text-white shadow-lift transition-colors [&_svg]:size-[1.15rem] ${className}`}
    >
      {icon}
      {label}
    </a>
  );
}
