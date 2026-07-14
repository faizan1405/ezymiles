"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { saveRolePermissions } from "@/server/admin/actions";
import { Panel } from "./ui";
import { ChipSelectField } from "./field-kits";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { ADMIN_ROLES, ROLE_LABELS, PERMISSIONS, type AdminRole, type Permission } from "@/models/types";

const EDITABLE_ROLES = ADMIN_ROLES.filter((r): r is Exclude<AdminRole, "super_admin"> => r !== "super_admin");

export function RolePermissionsEditor({
  rolePermissions,
}: {
  rolePermissions: Record<AdminRole, Permission[]>;
}) {
  const router = useRouter();
  const [role, setRole] = React.useState<AdminRole>(EDITABLE_ROLES[0]);
  const [draft, setDraft] = React.useState<Permission[]>(rolePermissions[EDITABLE_ROLES[0]]);
  const [saving, setSaving] = React.useState(false);

  const changeRole = (next: AdminRole) => {
    setRole(next);
    setDraft(rolePermissions[next]);
  };

  const save = async () => {
    setSaving(true);
    const result = await saveRolePermissions({ role, permissions: draft });
    if (result.ok) {
      toast.success("Saved", result.message);
      router.refresh();
    } else {
      toast.error("Could not save", result.message);
    }
    setSaving(false);
  };

  return (
    <Panel
      title="Control what each role can access"
      action={
        <Select value={role} onChange={(e) => changeRole(e.target.value as AdminRole)} className="w-48">
          {EDITABLE_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </Select>
      }
    >
      <p className="mb-4 text-xs leading-relaxed text-muted">
        Super Admin always has every permission and isn&apos;t editable here. Changes apply to every staff
        member with the selected role the next time their session refreshes (within a few minutes, or
        immediately on their next sign-in).
      </p>

      <ChipSelectField
        label={`${ROLE_LABELS[role]} can access`}
        options={PERMISSIONS.map((p) => ({ value: p, label: p }))}
        value={draft}
        onChange={(v) => setDraft(v as Permission[])}
      />

      <div className="mt-5 flex justify-end">
        <Button variant="accent" onClick={save} loading={saving} loadingText="Saving">
          Save permissions for {ROLE_LABELS[role]}
        </Button>
      </div>
    </Panel>
  );
}
