"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal, Pencil, Copy, Eye, EyeOff, Archive } from "lucide-react";

import { duplicateEntity, setPublishStatus, softDeleteEntity } from "@/server/admin/actions";
import { Dialog, DialogContent } from "@/components/ui/overlays";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

type EntityKind = "package" | "destination" | "hotel" | "activity" | "blog" | "visa";

export function EntityActions({
  kind,
  id,
  label,
  status,
  editHref,
  canDuplicate = true,
}: {
  kind: EntityKind;
  id: string;
  label: string;
  status: string;
  editHref: string;
  canDuplicate?: boolean;
}) {
  const router = useRouter();
  const [archiveOpen, setArchiveOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const publish = async (next: "published" | "draft") => {
    setPending(true);
    const result = await setPublishStatus(kind, id, next);

    if (result.ok) {
      toast.success("Updated", result.message);
      router.refresh();
    } else {
      toast.error("Could not update", result.message);
    }

    setPending(false);
  };

  const duplicate = async () => {
    setPending(true);
    const result = await duplicateEntity(kind, id);

    if (result.ok && result.id) {
      toast.success("Duplicated", result.message);
      const editBase = editHref.substring(0, editHref.lastIndexOf("/"));
      router.push(`${editBase}/${result.id}`);
    } else {
      toast.error("Could not duplicate", result.message);
    }

    setPending(false);
  };

  const archive = async () => {
    setPending(true);
    const result = await softDeleteEntity(kind, id);

    if (result.ok) {
      toast.success("Archived", result.message);
      setArchiveOpen(false);
      router.refresh();
    } else {
      toast.error("Could not archive", result.message);
    }

    setPending(false);
  };

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          className="flex size-8 items-center justify-center rounded-lg text-midnight-400 transition-colors hover:bg-sand-100 hover:text-midnight-900"
          aria-label={`Actions for ${label}`}
          disabled={pending}
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            className="z-150 w-48 rounded-2xl border border-hairline bg-white p-1.5 shadow-float"
          >
            <DropdownMenu.Item asChild>
              <Link
                href={editHref}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-midnight-800 outline-none data-[highlighted]:bg-sand-100"
              >
                <Pencil className="size-4" aria-hidden />
                Edit
              </Link>
            </DropdownMenu.Item>

            {status === "published" ? (
              <Item onSelect={() => publish("draft")} icon={<EyeOff aria-hidden />}>
                Unpublish
              </Item>
            ) : (
              <Item onSelect={() => publish("published")} icon={<Eye aria-hidden />}>
                Publish
              </Item>
            )}

            {canDuplicate ? (
              <Item onSelect={duplicate} icon={<Copy aria-hidden />}>
                Duplicate
              </Item>
            ) : null}

            <DropdownMenu.Separator className="my-1 h-px bg-hairline" />

            <Item onSelect={() => setArchiveOpen(true)} icon={<Archive aria-hidden />} destructive>
              Archive
            </Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent title="Archive this?" description={label}>
          <p className="text-sm leading-relaxed text-muted">
            It will be removed from the live site immediately. Nothing is deleted — existing bookings
            that reference it keep working, and you can restore it by republishing.
          </p>

          <div className="mt-6 flex gap-2">
            <Button variant="outline" block onClick={() => setArchiveOpen(false)}>
              Keep it
            </Button>
            <Button variant="danger" block onClick={archive} loading={pending} loadingText="Archiving">
              Archive
            </Button>
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
