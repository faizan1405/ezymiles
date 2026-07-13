/**
 * Shared enums and literal unions used across models, validation schemas and UI.
 * Kept free of any server-only imports so client components can use them too.
 */

export const BOOKING_TYPES = ["package", "flight", "hotel", "activity", "visa", "cab"] as const;
export type BookingType = (typeof BOOKING_TYPES)[number];

export const BOOKING_STATUSES = [
  "draft",
  "pending_payment",
  "confirmed",
  "completed",
  "cancellation_requested",
  "cancelled",
  "failed",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "created",
  "authorised",
  "paid",
  "partially_paid",
  "failed",
  "refunded",
  "partially_refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_GATEWAYS = ["razorpay", "stripe", "offline"] as const;
export type PaymentGateway = (typeof PAYMENT_GATEWAYS)[number];

export const REFUND_STATUSES = ["requested", "approved", "processing", "completed", "rejected"] as const;
export type RefundStatus = (typeof REFUND_STATUSES)[number];

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "negotiation",
  "won",
  "lost",
  "junk",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const ENQUIRY_TYPES = [
  "general",
  "package",
  "callback",
  "custom_trip",
  "corporate",
  "group",
  "visa",
  "contact",
] as const;
export type EnquiryType = (typeof ENQUIRY_TYPES)[number];

export const VISA_APPLICATION_STATUSES = [
  "submitted",
  "documents_pending",
  "under_review",
  "lodged_with_embassy",
  "approved",
  "rejected",
  "cancelled",
] as const;
export type VisaApplicationStatus = (typeof VISA_APPLICATION_STATUSES)[number];

export const TICKET_STATUSES = ["open", "in_progress", "waiting_on_customer", "resolved", "closed"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const PUBLISH_STATUSES = ["draft", "scheduled", "published", "archived"] as const;
export type PublishStatus = (typeof PUBLISH_STATUSES)[number];

export const ADMIN_ROLES = [
  "super_admin",
  "admin",
  "sales_manager",
  "sales_executive",
  "content_manager",
  "booking_manager",
  "finance_manager",
  "support_agent",
] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  sales_manager: "Sales Manager",
  sales_executive: "Sales Executive",
  content_manager: "Content Manager",
  booking_manager: "Booking Manager",
  finance_manager: "Finance Manager",
  support_agent: "Support Agent",
};

/** Granular permissions: `<module>:<action>`. */
export const PERMISSIONS = [
  "dashboard:view",
  "leads:view",
  "leads:manage",
  "customers:view",
  "customers:manage",
  "bookings:view",
  "bookings:manage",
  "payments:view",
  "payments:manage",
  "refunds:view",
  "refunds:manage",
  "packages:view",
  "packages:manage",
  "destinations:manage",
  "flights:manage",
  "hotels:manage",
  "activities:manage",
  "visa:view",
  "visa:manage",
  "coupons:manage",
  "offers:manage",
  "reviews:manage",
  "blogs:manage",
  "faqs:manage",
  "homepage:manage",
  "media:manage",
  "tickets:view",
  "tickets:manage",
  "staff:manage",
  "settings:manage",
  "audit:view",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/** Which permissions each role carries. Restricts both routes and actions. */
export const ROLE_PERMISSIONS: Record<AdminRole, readonly Permission[]> = {
  super_admin: PERMISSIONS,
  admin: PERMISSIONS.filter((p) => p !== "staff:manage" && p !== "audit:view"),
  sales_manager: [
    "dashboard:view",
    "leads:view",
    "leads:manage",
    "customers:view",
    "customers:manage",
    "bookings:view",
    "bookings:manage",
    "packages:view",
    "coupons:manage",
    "offers:manage",
  ],
  sales_executive: ["dashboard:view", "leads:view", "leads:manage", "customers:view", "packages:view"],
  content_manager: [
    "dashboard:view",
    "packages:view",
    "packages:manage",
    "destinations:manage",
    "hotels:manage",
    "activities:manage",
    "visa:manage",
    "blogs:manage",
    "faqs:manage",
    "reviews:manage",
    "homepage:manage",
    "media:manage",
  ],
  booking_manager: [
    "dashboard:view",
    "bookings:view",
    "bookings:manage",
    "customers:view",
    "payments:view",
    "packages:view",
    "flights:manage",
    "hotels:manage",
    "activities:manage",
    "visa:view",
    "visa:manage",
  ],
  finance_manager: [
    "dashboard:view",
    "bookings:view",
    "payments:view",
    "payments:manage",
    "refunds:view",
    "refunds:manage",
    "coupons:manage",
  ],
  support_agent: [
    "dashboard:view",
    "tickets:view",
    "tickets:manage",
    "customers:view",
    "bookings:view",
    "visa:view",
  ],
};

export interface MediaAsset {
  url: string;
  alt: string;
  publicId?: string;
  width?: number;
  height?: number;
  type?: "image" | "video";
}
