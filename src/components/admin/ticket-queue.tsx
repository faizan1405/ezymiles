"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Send, LifeBuoy, AlertTriangle } from "lucide-react";

import { replyToTicketAsAgent, setTicketStatus } from "@/server/admin/actions";
import { StatusPill, STATUS_TONE } from "./ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/overlays";
import { Select, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/primitives";
import { toast } from "@/components/ui/toast";
import { TICKET_STATUSES } from "@/models/types";
import { formatDateTime, titleCase, cn } from "@/lib/utils";

interface TicketRow {
  id: string;
  reference: string;
  name: string;
  email: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  messages: { author: string; authorName: string; body: string; at: string }[];
  createdAt: string;
}

const PRIORITY_TONE: Record<string, string> = {
  urgent: "bg-red-50 text-red-700",
  high: "bg-amber-50 text-amber-800",
  normal: "bg-sand-100 text-midnight-600",
  low: "bg-sand-100 text-midnight-500",
};

export function TicketQueue({
  tickets,
  canManage,
}: {
  tickets: TicketRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [active, setActive] = React.useState<TicketRow | null>(null);
  const [reply, setReply] = React.useState("");
  const [nextStatus, setNextStatus] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const open = (ticket: TicketRow) => {
    setActive(ticket);
    setNextStatus(ticket.status);
    setReply("");
  };

  const send = async () => {
    if (!active) return;
    setSending(true);

    const result = await replyToTicketAsAgent(active.id, reply, nextStatus);

    if (result.ok) {
      toast.success("Reply sent", result.message);
      setActive(null);
      router.refresh();
    } else {
      toast.error("Could not send", result.message);
    }

    setSending(false);
  };

  const changeStatus = async (id: string, status: string) => {
    const result = await setTicketStatus(id, status);

    if (result.ok) {
      toast.success("Updated", result.message);
      router.refresh();
    } else {
      toast.error("Could not update", result.message);
    }
  };

  if (tickets.length === 0) {
    return (
      <EmptyState
        icon={<LifeBuoy />}
        title="No tickets"
        description="Support tickets raised from customer accounts land here."
      />
    );
  }

  return (
    <div>
      <ul className="space-y-3">
        {tickets.map((t) => {
          const last = t.messages.at(-1);
          const awaitingUs = last?.author === "customer";

          return (
            <li key={t.id}>
              <article
                className={cn(
                  "rounded-2xl border bg-white p-5",
                  awaitingUs && t.status !== "closed" && t.status !== "resolved"
                    ? "border-amber-200"
                    : "border-hairline",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[0.6875rem] font-bold text-lagoon-700">
                        {t.reference}
                      </span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wide",
                          PRIORITY_TONE[t.priority],
                        )}
                      >
                        {t.priority}
                      </span>
                      {t.priority === "urgent" ? (
                        <AlertTriangle className="size-3.5 text-red-600" aria-hidden />
                      ) : null}
                    </p>

                    <h3 className="mt-1.5 font-display text-base text-midnight-900">{t.subject}</h3>

                    <p className="mt-1 text-xs text-muted">
                      {t.name} · {t.email} · {t.category} · {formatDateTime(t.createdAt)}
                    </p>

                    {last ? (
                      <p className="mt-2 line-clamp-2 max-w-2xl text-[0.8125rem] leading-relaxed text-muted">
                        <span className="font-semibold text-midnight-800">
                          {last.author === "agent" ? "You" : t.name.split(" ")[0]}:
                        </span>{" "}
                        {last.body}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <StatusPill status={t.status} tone={STATUS_TONE[t.status] ?? "neutral"} />
                    {awaitingUs && t.status !== "closed" ? (
                      <span className="text-[0.625rem] font-bold uppercase tracking-wide text-amber-700">
                        Awaiting reply
                      </span>
                    ) : null}
                  </div>
                </div>

                {canManage ? (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-hairline pt-4">
                    <Button size="sm" variant="accent" onClick={() => open(t)}>
                      <Send aria-hidden />
                      Reply
                    </Button>

                    {t.status !== "resolved" && t.status !== "closed" ? (
                      <Button size="sm" variant="outline" onClick={() => changeStatus(t.id, "resolved")}>
                        Mark resolved
                      </Button>
                    ) : null}

                    {t.status !== "closed" ? (
                      <Button size="sm" variant="ghost" onClick={() => changeStatus(t.id, "closed")}>
                        Close
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </article>
            </li>
          );
        })}
      </ul>

      {/* --------------------------------- Thread -------------------------------- */}
      <Dialog open={Boolean(active)} onOpenChange={(o) => !o && setActive(null)}>
        {active ? (
          <DialogContent
            title={active.subject}
            description={`${active.reference} · ${active.name} · ${active.email}`}
            size="lg"
          >
            <ul className="max-h-80 space-y-3 overflow-y-auto pr-1">
              {active.messages.map((m, i) => (
                <li
                  key={i}
                  className={cn(
                    "rounded-2xl p-4",
                    m.author === "agent" ? "ml-8 bg-lagoon-50" : "mr-8 bg-sand-50",
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

            <div className="mt-5 space-y-3 border-t border-hairline pt-5">
              <label htmlFor="tk-reply" className="text-[0.8125rem] font-semibold text-midnight-800">
                Your reply
              </label>
              <Textarea
                id="tk-reply"
                rows={5}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Answer the actual question. Say what you're doing and by when."
              />

              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-44 flex-1">
                  <label htmlFor="tk-status" className="text-[0.8125rem] font-semibold text-midnight-800">
                    Set status
                  </label>
                  <Select
                    id="tk-status"
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                    className="mt-1.5"
                  >
                    {TICKET_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {titleCase(s.replace(/_/g, " "))}
                      </option>
                    ))}
                  </Select>
                </div>

                <Button
                  variant="accent"
                  size="lg"
                  onClick={send}
                  loading={sending}
                  loadingText="Sending"
                  disabled={reply.trim().length < 2}
                >
                  <Send aria-hidden />
                  Send & notify
                </Button>
              </div>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}
