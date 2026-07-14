"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, MessageSquare, Send } from "lucide-react";

import { supportTicketSchema, type SupportTicketInput } from "@/lib/validation";
import { createSupportTicket, replyToTicket } from "@/server/actions/account";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { Dialog, DialogContent } from "@/components/ui/overlays";
import { toast } from "@/components/ui/toast";
import { formatDateTime, cn } from "@/lib/utils";
import type { ISupportTicket } from "@/models";
import type { TicketStatus } from "@/models/types";

const STATUS_TONE: Record<TicketStatus, "neutral" | "info" | "warning" | "success"> = {
  open: "warning",
  in_progress: "info",
  waiting_on_customer: "warning",
  resolved: "success",
  closed: "neutral",
};

export function SupportPanel({
  tickets,
  bookings,
}: {
  tickets: ISupportTicket[];
  bookings: { reference: string; title: string }[];
}) {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<ISupportTicket | null>(null);
  const [reply, setReply] = React.useState("");
  const [replying, setReplying] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupportTicketInput>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: { category: "general", priority: "normal" },
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await createSupportTicket(values);

    if (result.ok) {
      toast.success("Ticket opened", result.message);
      reset();
      setOpen(false);
    } else {
      toast.error("Could not open ticket", result.message);
    }
  });

  const sendReply = async () => {
    if (!active || reply.trim().length < 2) return;
    setReplying(true);

    const result = await replyToTicket(String(active._id), reply);

    if (result.ok) {
      toast.success("Reply sent");
      setReply("");
      setActive(null);
    } else {
      toast.error("Could not send reply", result.message);
    }

    setReplying(false);
  };

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Button variant="accent" onClick={() => setOpen(true)}>
          <Plus aria-hidden />
          New ticket
        </Button>
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          icon={<MessageSquare />}
          title="No tickets yet"
          description="Open one if something needs changing on a booking, or if you just have a question."
          action={
            <Button variant="accent" onClick={() => setOpen(true)}>
              Open a ticket
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {tickets.map((t) => (
            <li key={String(t._id)}>
              <button
                type="button"
                onClick={() => setActive(t)}
                className="flex w-full items-start justify-between gap-4 rounded-2xl border border-hairline bg-white p-5 text-left transition-colors hover:bg-sand-50"
              >
                <div className="min-w-0">
                  <p className="text-[0.625rem] font-bold uppercase tracking-widest text-lagoon-700">
                    {t.reference} · {t.category}
                  </p>
                  <p className="mt-1 truncate font-semibold text-midnight-900">{t.subject}</p>
                  <p className="mt-1 truncate text-xs text-muted">
                    {t.messages.length} {t.messages.length === 1 ? "message" : "messages"} · last
                    update {formatDateTime(t.messages.at(-1)?.at ?? t.createdAt)}
                  </p>
                </div>

                <Badge tone={STATUS_TONE[t.status] ?? "neutral"}>{t.status.replace(/_/g, " ")}</Badge>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ------------------------------- New ticket ------------------------------ */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Open a support ticket" description="We reply within business hours.">
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Field label="Subject" htmlFor="t-subject" required error={errors.subject?.message}>
              <Input
                id="t-subject"
                placeholder="Change of dates on my Bali booking"
                invalid={Boolean(errors.subject)}
                {...register("subject")}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category" htmlFor="t-category">
                <Select id="t-category" {...register("category")}>
                  <option value="general">General question</option>
                  <option value="booking">Booking</option>
                  <option value="payment">Payment</option>
                  <option value="amendment">Change or amendment</option>
                  <option value="visa">Visa</option>
                </Select>
              </Field>

              <Field label="Priority" htmlFor="t-priority">
                <Select id="t-priority" {...register("priority")}>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent — I&apos;m travelling now</option>
                </Select>
              </Field>
            </div>

            {bookings.length ? (
              <Field
                label="Related booking"
                htmlFor="t-booking"
                hint="Optional — helps us pull up the right file."
              >
                <Select id="t-booking" {...register("bookingReference")}>
                  <option value="">Not about a specific booking</option>
                  {bookings.map((b) => (
                    <option key={b.reference} value={b.reference}>
                      {b.reference} — {b.title}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}

            <Field label="What's going on?" htmlFor="t-message" required error={errors.message?.message}>
              <Textarea
                id="t-message"
                rows={5}
                placeholder="Tell us what you need — dates, names, what's changed."
                invalid={Boolean(errors.message)}
                {...register("message")}
              />
            </Field>

            <Button type="submit" block size="lg" variant="accent" loading={isSubmitting} loadingText="Opening">
              Open ticket
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* -------------------------------- Thread -------------------------------- */}
      <Dialog open={Boolean(active)} onOpenChange={(o) => !o && setActive(null)}>
        {active ? (
          <DialogContent title={active.subject} description={`${active.reference} · ${active.category}`} size="lg">
            <ul className="max-h-96 space-y-3 overflow-y-auto pr-1">
              {active.messages.map((m, i) => (
                <li
                  key={i}
                  className={cn(
                    "rounded-2xl p-4",
                    m.author === "customer" ? "ml-8 bg-lagoon-50" : "mr-8 bg-sand-50",
                  )}
                >
                  <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted">
                    {m.authorName} · {formatDateTime(m.at)}
                  </p>
                  <p className="mt-1.5 whitespace-pre-line text-[0.875rem] leading-relaxed text-midnight-800">
                    {m.body}
                  </p>
                </li>
              ))}
            </ul>

            {active.status !== "closed" ? (
              <div className="mt-5 border-t border-hairline pt-5">
                <label htmlFor="t-reply" className="text-[0.8125rem] font-semibold text-midnight-800">
                  Reply
                </label>
                <Textarea
                  id="t-reply"
                  rows={3}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Add anything else that helps…"
                  className="mt-1.5"
                />
                <Button
                  variant="accent"
                  className="mt-3"
                  onClick={sendReply}
                  loading={replying}
                  loadingText="Sending"
                  disabled={reply.trim().length < 2}
                >
                  <Send aria-hidden />
                  Send reply
                </Button>
              </div>
            ) : (
              <p className="mt-5 rounded-xl bg-sand-50 p-4 text-sm text-muted">
                This ticket is closed. Open a new one if you need anything else.
              </p>
            )}
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}
