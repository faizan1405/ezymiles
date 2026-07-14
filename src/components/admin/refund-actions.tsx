"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { processRefund } from "@/server/admin/actions";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

export function RefundActions({ refundId, status }: { refundId: string; status: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState<"approve" | "reject" | null>(null);

  const run = async (approve: boolean) => {
    setPending(approve ? "approve" : "reject");

    const result = await processRefund(refundId, approve);

    if (result.ok) {
      toast.success(approve ? "Refund approved" : "Refund rejected", result.message);
      router.refresh();
    } else {
      toast.error("Could not process refund", result.message);
    }

    setPending(null);
  };

  return (
    <div className="flex gap-1.5">
      <Button
        size="sm"
        variant="accent"
        onClick={() => run(true)}
        loading={pending === "approve"}
        disabled={pending !== null}
      >
        <Check aria-hidden />
        {status === "processing" ? "Mark done" : "Approve"}
      </Button>

      {status === "requested" ? (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => run(false)}
          loading={pending === "reject"}
          disabled={pending !== null}
        >
          <X aria-hidden />
          Reject
        </Button>
      ) : null}
    </div>
  );
}
