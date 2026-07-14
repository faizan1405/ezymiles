"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markNotificationsRead } from "@/server/actions/account";
import { toast } from "@/components/ui/toast";

export function MarkAllRead() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const onClick = async () => {
    setPending(true);
    const result = await markNotificationsRead();

    if (result.ok) {
      router.refresh();
    } else {
      toast.error("Could not update", result.message);
    }

    setPending(false);
  };

  return (
    <Button variant="outline" onClick={onClick} loading={pending} loadingText="Updating">
      <CheckCheck aria-hidden />
      Mark all read
    </Button>
  );
}
