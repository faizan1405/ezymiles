"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, ShieldCheck } from "lucide-react";

import { saveStaff } from "@/server/admin/actions";
import { Table, TableEmpty, Td, Th, StatusPill } from "./ui";
import { ToggleField, ChipSelectField } from "./field-kits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/overlays";
import { Field, Input, Select } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { ADMIN_ROLES, ROLE_LABELS, PERMISSIONS, type AdminRole, type Permission } from "@/models/types";
import { formatDate, initials } from "@/lib/utils";

interface StaffRow {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  extraPermissions: string[];
  revokedPermissions: string[];
  isActive: boolean;
  lastLoginAt?: string;
}

interface StaffDraft extends Omit<StaffRow, "lastLoginAt"> {
  password: string;
}

const empty: StaffDraft = {
  id: "",
  name: "",
  email: "",
  role: "sales_executive",
  extraPermissions: [],
  revokedPermissions: [],
  isActive: true,
  password: "",
};

export function StaffManager({
  staff,
  currentUserId,
  rolePermissions,
}: {
  staff: StaffRow[];
  currentUserId: string;
  rolePermissions: Record<AdminRole, Permission[]>;
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<StaffDraft | null>(null);
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    if (!editing) return;
    setSaving(true);

    const result = await saveStaff({
      ...editing,
      id: editing.id || undefined,
      password: editing.password || undefined,
    });

    if (result.ok) {
      toast.success("Saved", result.message);
      setEditing(null);
      router.refresh();
    } else {
      toast.error("Could not save", result.message);
    }

    setSaving(false);
  };

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <Button variant="accent" onClick={() => setEditing(empty)}>
          <Plus aria-hidden />
          Add staff
        </Button>
      </div>

      <Table caption="Staff accounts">
        <thead>
          <tr className="border-b border-hairline bg-sand-50">
            <Th>Name</Th>
            <Th>Role</Th>
            <Th>Last login</Th>
            <Th>Status</Th>
            <Th />
          </tr>
        </thead>

        <tbody className="divide-y divide-hairline">
          {staff.length === 0 ? (
            <TableEmpty colSpan={5} message="No staff accounts." />
          ) : (
            staff.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-sand-50">
                <Td>
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-midnight-900 text-[0.6875rem] font-bold text-white">
                      {initials(s.name)}
                    </span>
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold text-midnight-900">
                        {s.name}
                        {s.id === currentUserId ? (
                          <span className="ml-1.5 text-[0.625rem] font-bold uppercase text-lagoon-700">
                            You
                          </span>
                        ) : null}
                      </span>
                      <span className="block truncate text-xs text-muted">{s.email}</span>
                    </div>
                  </div>
                </Td>

                <Td>
                  <span className="flex items-center gap-1.5 text-sm">
                    <ShieldCheck className="size-3.5 text-lagoon-600" aria-hidden />
                    {ROLE_LABELS[s.role]}
                  </span>
                  {s.extraPermissions.length || s.revokedPermissions.length ? (
                    <span className="mt-0.5 block text-[0.625rem] text-muted">
                      {s.extraPermissions.length ? `+${s.extraPermissions.length} extra ` : ""}
                      {s.revokedPermissions.length ? `−${s.revokedPermissions.length} revoked` : ""}
                    </span>
                  ) : null}
                </Td>

                <Td className="whitespace-nowrap text-xs">
                  {s.lastLoginAt ? formatDate(s.lastLoginAt) : "Never"}
                </Td>

                <Td>
                  <StatusPill
                    status={s.isActive ? "active" : "disabled"}
                    tone={s.isActive ? "success" : "neutral"}
                  />
                </Td>

                <Td>
                  <button
                    type="button"
                    onClick={() =>
                      setEditing({
                        id: s.id,
                        name: s.name,
                        email: s.email,
                        role: s.role,
                        extraPermissions: s.extraPermissions,
                        revokedPermissions: s.revokedPermissions,
                        isActive: s.isActive,
                        password: "",
                      })
                    }
                    aria-label={`Edit ${s.name}`}
                    className="flex size-8 items-center justify-center rounded-lg text-midnight-400 hover:bg-sand-100 hover:text-midnight-900"
                  >
                    <Pencil className="size-4" aria-hidden />
                  </button>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        {editing ? (
          <DialogContent
            title={editing.id ? `Edit ${editing.name}` : "New staff account"}
            size="lg"
          >
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" htmlFor="st-name" required>
                  <Input
                    id="st-name"
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  />
                </Field>

                <Field label="Email" htmlFor="st-email" required>
                  <Input
                    id="st-email"
                    type="email"
                    value={editing.email}
                    onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                  />
                </Field>

                <Field label="Role" htmlFor="st-role" required>
                  <Select
                    id="st-role"
                    value={editing.role}
                    onChange={(e) => setEditing({ ...editing, role: e.target.value as AdminRole })}
                  >
                    {ADMIN_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field
                  label={editing.id ? "New password (optional)" : "Password"}
                  htmlFor="st-password"
                  required={!editing.id}
                  hint={editing.id ? "Leave blank to keep the existing password." : "At least 8 characters."}
                >
                  <Input
                    id="st-password"
                    type="password"
                    autoComplete="new-password"
                    value={editing.password}
                    onChange={(e) => setEditing({ ...editing, password: e.target.value })}
                  />
                </Field>
              </div>

              <div className="rounded-2xl bg-sand-50 p-4">
                <p className="text-[0.8125rem] font-semibold text-midnight-900">
                  {ROLE_LABELS[editing.role]} can, by default:
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {rolePermissions[editing.role].length === 0 ? (
                    <span className="text-xs text-muted">Nothing — grant permissions below.</span>
                  ) : (
                    rolePermissions[editing.role].map((p) => (
                      <span
                        key={p}
                        className="rounded bg-white px-1.5 py-0.5 font-mono text-[0.625rem] text-midnight-700"
                      >
                        {p}
                      </span>
                    ))
                  )}
                </div>
                <p className="mt-1.5 text-[0.6875rem] text-muted">
                  Change what this role can do for everyone at once from the role-permissions panel below.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <ChipSelectField
                  label="Extra permissions for this person"
                  options={PERMISSIONS.filter((p) => !rolePermissions[editing.role].includes(p)).map(
                    (p) => ({ value: p, label: p }),
                  )}
                  value={editing.extraPermissions}
                  onChange={(v) => setEditing({ ...editing, extraPermissions: v })}
                />

                <ChipSelectField
                  label="Revoke permissions from this person"
                  options={rolePermissions[editing.role].map((p) => ({ value: p, label: p }))}
                  value={editing.revokedPermissions}
                  onChange={(v) => setEditing({ ...editing, revokedPermissions: v })}
                />
              </div>

              <ToggleField
                label="Active"
                description="Deactivating immediately blocks sign-in."
                checked={editing.isActive}
                onChange={(v) => setEditing({ ...editing, isActive: v })}
              />

              <div className="flex gap-2 pt-2">
                <Button variant="outline" block onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button
                  variant="accent"
                  block
                  onClick={save}
                  loading={saving}
                  loadingText="Saving"
                  disabled={
                    !editing.name ||
                    !editing.email ||
                    (!editing.id && editing.password.length < 8)
                  }
                >
                  {editing.id ? "Save" : "Create account"}
                </Button>
              </div>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}
