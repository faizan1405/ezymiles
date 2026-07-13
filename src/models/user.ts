import { Schema, model, models, type Model, type Types } from "mongoose";
import { ADMIN_ROLES, PERMISSIONS, type AdminRole, type Permission } from "./types";

/* ---------------------------------- User ---------------------------------- */

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  emailVerified: Date | null;
  passwordHash?: string;
  image?: string;
  phone?: string;
  countryCode?: string;
  dateOfBirth?: Date;
  nationality?: string;
  preferredCurrency: string;
  marketingOptIn: boolean;
  whatsappOptIn: boolean;
  wishlist: Types.ObjectId[];
  recentlyViewed: { package: Types.ObjectId; viewedAt: Date }[];
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  resetToken?: string;
  resetTokenExpiry?: Date;
  lastLoginAt?: Date;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    emailVerified: { type: Date, default: null },
    passwordHash: { type: String, select: false },
    image: String,
    phone: { type: String, trim: true },
    countryCode: { type: String, default: "+91" },
    dateOfBirth: Date,
    nationality: { type: String, default: "Indian" },
    preferredCurrency: { type: String, default: "INR" },
    marketingOptIn: { type: Boolean, default: false },
    whatsappOptIn: { type: Boolean, default: false },
    wishlist: [{ type: Schema.Types.ObjectId, ref: "Package" }],
    recentlyViewed: [
      {
        _id: false,
        package: { type: Schema.Types.ObjectId, ref: "Package" },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
    verificationToken: { type: String, select: false },
    verificationTokenExpiry: { type: Date, select: false },
    resetToken: { type: String, select: false },
    resetTokenExpiry: { type: Date, select: false },
    lastLoginAt: Date,
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 });
UserSchema.index({ createdAt: -1 });

/* -------------------------------- AdminUser -------------------------------- */

export interface IAdminUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash?: string;
  role: AdminRole;
  /** Permissions granted on top of the role defaults. */
  extraPermissions: Permission[];
  /** Permissions revoked from the role defaults. */
  revokedPermissions: Permission[];
  isActive: boolean;
  lastLoginAt?: Date;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, select: false },
    role: { type: String, enum: ADMIN_ROLES, default: "sales_executive" },
    extraPermissions: [{ type: String, enum: PERMISSIONS }],
    revokedPermissions: [{ type: String, enum: PERMISSIONS }],
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

AdminUserSchema.index({ email: 1 }, { unique: true });
AdminUserSchema.index({ role: 1, isActive: 1 });

/* ---------------------------------- Role ---------------------------------- */
/**
 * Roles are seeded from ROLE_PERMISSIONS but stored so a Super Admin can tune
 * the permission matrix from the panel without a redeploy.
 */
export interface IRole {
  _id: Types.ObjectId;
  key: AdminRole;
  label: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    key: { type: String, enum: ADMIN_ROLES, required: true },
    label: { type: String, required: true },
    description: { type: String, default: "" },
    permissions: [{ type: String, enum: PERMISSIONS }],
    isSystem: { type: Boolean, default: true },
  },
  { timestamps: true },
);

RoleSchema.index({ key: 1 }, { unique: true });

export const User: Model<IUser> = models.User || model<IUser>("User", UserSchema);
export const AdminUser: Model<IAdminUser> =
  models.AdminUser || model<IAdminUser>("AdminUser", AdminUserSchema);
export const Role: Model<IRole> = models.Role || model<IRole>("Role", RoleSchema);
