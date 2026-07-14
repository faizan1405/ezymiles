"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal, CheckCircle2, XCircle, Flag, Undo2 } from "lucide-react";

import { updateBookingStatus, createRefund } from "@/server/admin/actions";
import { Dialog, DialogContent } from "@/components/ui/overlays";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { formatPrice } from "@/lib/utils";

export function BookingActions({
  bookingId,
  reference,
  status,
  amountPaidINR,
  canManage,
  canRefund,
}: {
  bookingId: string;
  reference: string;
  status: string;
  amountPaidINR: number;
  canManage: boolean;
  canRefund: boolean;
}) {
  const router = useRouter();

  const [refundOpen, setRefundOpen] = React.useState(false);
  const [amount, setAmount] = React.useState(amountPaidINR);
  const [reason, setReason] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const setStatus = async (next: string) => {
    setPending(true);
    const result = await updateBookingStatus(bookingId, next);

    if (result.ok) {
      toast.success("Booking updated", result.message);
      router.refresh();
    } else {
      toast.error("Could not update", result.message);
    }

    setPending(false);
  };

  const raiseRefund = async () => {
    setPending(true);
    const result = await createRefund({ bookingId, amountINR: amount, reason });

    if (result.ok) {
      toast.success("Refund raised", result.message);
      setRefundOpen(false);
      setReason("");
      router.refresh();
    } else {
      toast.error("Could not raise refund", result.message);
    }

    setPending(false);
  };

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          className="flex size-8 items-center justify-center rounded-lg text-midnight-400 transition-colors hover:bg-sand-100 hover:text-midnight-900"
          aria-label={`Actions for ${reference}`}
          disabled={pending}
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            className="z-150 w-52 rounded-2xl border border-hairline bg-white p-1.5 shadow-float"
          >
            {canManage && status !== "confirmed" && status !== "completed" ? (
              <Item onSelect={() => setStatus("confirmed")} icon={<CheckCircle2 aria-hidden />}>
                Mark confirmed
              </Item>
            ) : null}

            {canManage && status === "confirmed" ? (
              <Item onSelect={() => setStatus("completed")} icon={<Flag aria-hidden />}>
                Mark completed
              </Item>
            ) : null}

            {canRefund && amountPaidINR > 0 ? (
              <Item onSelect={() => setRefundOpen(true)} icon={<Undo2 aria-hidden />}>
                Raise a refund
              </Item>
            ) : null}

            {canManage && status !== "cancelled" ? (
              <>
                <DropdownMenu.Separator className="my-1 h-px bg-hairline" />
                <Item
                  onSelect={() => setStatus("cancelled")}
                  icon={<XCircle aria-hidden />}
                  destructive
                >
                  Cancel booking
                </Item>
              </>
            ) : null}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent
          title="Raise a refund"
          description={`${reference} — ${formatPrice(amountPaidINR)} has been collected.`}
        >
          <div className="space-y-4">
            <Field
              label="Refund amount (INR)"
              htmlFor="rf-amount"
              required
              hint={`Cannot exceed the ${formatPrice(amountPaidINR)} actually collected.`}
            >
              <Input
                id="rf-amount"
                type="number"
                min={1}
                max={amountPaidINR}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </Field>

            <Field label="Reason" htmlFor="rf-reason" required>
              <Textarea
                id="rf-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Cancelled by customer, supplier failure, goodwill…"
              />
            </Field>

            <p className="rounded-xl bg-sand-50 p-3 text-xs leading-relaxed text-muted">
              This raises the refund for approval. It is only sent to the payment gateway once a
              Finance Manager approves it in the Refunds module.
            </p>

            <div className="flex gap-2">
              <Button variant="outline" block onClick={() => setRefundOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="accent"
                block
                onClick={raiseRefund}
                loading={pending}
                loadingText="Raising"
                disabled={amount <= 0 || amount > amountPaidINR || reason.trim().length < 3}
              >
                Raise refund
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Item({
  onSelect,
  icon,
  children,
  destructive,
}: {
  onSelect: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  destructive?: boolean;
}) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors [&_svg]:size-4 ${
        destructive
          ? "text-red-600 data-[highlighted]:bg-red-50"
          : "text-midnight-800 data-[highlighted]:bg-sand-100"
      }`}
    >
      {icon}
      {children}
    </DropdownMenu.Item>
  );
}
