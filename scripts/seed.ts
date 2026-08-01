import "server-only";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { AdminUser, Role, RolePermission } from "@/models";

const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

async function seed() {
  if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
    console.error(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env.local",
    );
    process.exit(1);
  }

  await connectDB();

  // Seed system roles from the built-in permission matrix so Super Admin can
  // customise them later without a redeploy.
  await seedRoles();

  // Create the first Super Admin if one doesn't exist yet.
  await seedFirstAdmin();

  console.log("Seed complete.");
  process.exit(0);
}

async function seedRoles() {
  const { ADMIN_ROLES, ROLE_LABELS, ROLE_PERMISSIONS } = await import(
    "@/models/types"
  );

  for (const key of ADMIN_ROLES) {
    const exists = await Role.findOne({ key });
    if (exists) continue;

    await Role.create({
      key,
      label: ROLE_LABELS[key],
      description: `Default ${ROLE_LABELS[key].toLowerCase()} role.`,
      permissions: [...ROLE_PERMISSIONS[key]],
      isSystem: true,
    });

    console.log(`  Seeded role: ${key}`);
  }

  // Also back-fill the RolePermission collection so resolvePermissions()
  // works whether it reads from Role or RolePermission.
  for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    const exists = await RolePermission.findOne({ role });
    if (!exists) {
      await RolePermission.create({ role, permissions: [...permissions] });
      console.log(`  Seeded role-permissions: ${role}`);
    }
  }
}

async function seedFirstAdmin() {
  const existing = await AdminUser.findOne({ email: SEED_ADMIN_EMAIL });
  if (existing) {
    console.log(`  Admin already exists: ${SEED_ADMIN_EMAIL}`);
    return;
  }

  const passwordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, 12);

  await AdminUser.create({
    name: "Super Admin",
    email: SEED_ADMIN_EMAIL,
    passwordHash,
    role: "super_admin",
    extraPermissions: [],
    revokedPermissions: [],
    isActive: true,
    deletedAt: null,
  });

  console.log(`  Created Super Admin: ${SEED_ADMIN_EMAIL}`);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
