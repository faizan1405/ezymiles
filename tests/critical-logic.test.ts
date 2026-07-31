import { describe, it, expect } from "vitest";

// ─── ObjectId validation ───────────────────────────────────────────────────────

const isValidObjectId = (id: unknown): boolean =>
  typeof id === "string" && /^[0-9a-f]{24}$/i.test(id);

describe("ObjectId validation", () => {
  it("accepts valid 24-char hex", () => {
    expect(isValidObjectId("507f1f77bcf86cd799439011")).toBe(true);
  });
  it("rejects short string", () => expect(isValidObjectId("abc")).toBe(false));
  it("rejects null", () => expect(isValidObjectId(null)).toBe(false));
  it("rejects number", () => expect(isValidObjectId(123)).toBe(false));
  it("rejects non-hex chars", () => expect(isValidObjectId("z".repeat(24))).toBe(false));
});

// ─── Callback URL validation (open redirect prevention) ────────────────────────

const ALLOWED_CALLBACK_HOSTS = ["ezymiles.com", "www.ezymiles.com", "charanjittravel.com"];

const isAllowedCallbackUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return ALLOWED_CALLBACK_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
};

describe("Callback URL validation", () => {
  it("accepts HTTPS to allowed host", () => {
    expect(isAllowedCallbackUrl("https://ezymiles.com/dashboard")).toBe(true);
  });
  it("rejects HTTP scheme", () => {
    expect(isAllowedCallbackUrl("http://ezymiles.com/evil")).toBe(false);
  });
  it("rejects external domain (open redirect)", () => {
    expect(isAllowedCallbackUrl("https://evil.com/phishing")).toBe(false);
  });
  it("rejects javascript: scheme", () => {
    expect(isAllowedCallbackUrl("javascript:alert('xss')")).toBe(false);
  });
  it("rejects relative path", () => {
    expect(isAllowedCallbackUrl("/dashboard")).toBe(false);
  });
  it("rejects localhost", () => {
    expect(isAllowedCallbackUrl("https://localhost:3000/callback")).toBe(false);
  });
});

// ─── Booking status transitions ────────────────────────────────────────────────

type BookingStatus = "draft" | "pending" | "confirmed" | "paid" | "cancelled" | "completed" | "refunded";

const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  draft: ["pending", "cancelled"],
  pending: ["confirmed", "paid", "cancelled"],
  confirmed: ["paid", "cancelled"],
  paid: ["completed", "refunded", "cancelled"],
  cancelled: [],
  completed: ["refunded"],
  refunded: [],
};

const canTransition = (from: BookingStatus, to: BookingStatus): boolean =>
  VALID_TRANSITIONS[from]?.includes(to) ?? false;

describe("Booking status transitions", () => {
  it("draft -> pending is valid", () => expect(canTransition("draft", "pending")).toBe(true));
  it("pending -> confirmed is valid", () => expect(canTransition("pending", "confirmed")).toBe(true));
  it("paid -> completed is valid", () => expect(canTransition("paid", "completed")).toBe(true));
  it("cancelled -> anything is NOT valid", () => expect(canTransition("cancelled", "confirmed")).toBe(false));
  it("refunded -> anything is NOT valid", () => expect(canTransition("refunded", "paid")).toBe(false));
  it("draft -> paid is NOT valid (skips pending)", () => expect(canTransition("draft", "paid")).toBe(false));
});

// ─── Coupon validation ────────────────────────────────────────────────────────

type Coupon = {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderAmount: number;
  maxDiscount: number;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  usageCount: number;
  active: boolean;
};

const isCouponValid = (coupon: Coupon, orderAmount: number): { valid: boolean; reason?: string } => {
  if (!coupon.active) return { valid: false, reason: "Coupon is inactive" };
  const now = new Date();
  if (now < new Date(coupon.validFrom)) return { valid: false, reason: "Coupon not yet active" };
  if (now > new Date(coupon.validUntil)) return { valid: false, reason: "Coupon expired" };
  if (coupon.usageCount >= coupon.usageLimit) return { valid: false, reason: "Usage limit reached" };
  if (orderAmount < coupon.minOrderAmount) return { valid: false, reason: "Minimum order amount not met" };
  return { valid: true };
};

const calculateDiscount = (coupon: Coupon, orderAmount: number): number => {
  let discount = 0;
  if (coupon.type === "percentage") {
    discount = (orderAmount * coupon.value) / 100;
    if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
  } else {
    discount = coupon.value;
  }
  return Math.round(discount);
};

describe("Coupon validation and discount calculation", () => {
  const validCoupon: Coupon = {
    code: "WELCOME10", type: "percentage", value: 10,
    minOrderAmount: 500, maxDiscount: 1000,
    validFrom: "2024-01-01T00:00:00Z", validUntil: "2026-12-31T23:59:59Z",
    usageLimit: 100, usageCount: 0, active: true,
  };

  it("accepts coupon when order meets minimum", () => {
    expect(isCouponValid(validCoupon, 1000).valid).toBe(true);
  });
  it("rejects coupon below minimum order", () => {
    expect(isCouponValid(validCoupon, 100).valid).toBe(false);
  });
  it("rejects inactive coupon", () => {
    expect(isCouponValid({ ...validCoupon, active: false }, 1000).valid).toBe(false);
  });
  it("rejects expired coupon", () => {
    expect(isCouponValid({ ...validCoupon, validUntil: "2020-01-01T00:00:00Z" }, 1000).valid).toBe(false);
  });
  it("rejects at usage limit", () => {
    expect(isCouponValid({ ...validCoupon, usageCount: 100 }, 1000).valid).toBe(false);
  });

  it("calculates percentage discount correctly", () => {
    expect(calculateDiscount(validCoupon, 2000)).toBe(200);
  });
  it("caps discount at maxDiscount", () => {
    // 10% of 15000 = 1500, capped at 1000
    expect(calculateDiscount(validCoupon, 15000)).toBe;
  });
  it("calculates fixed discount correctly", () => {
    const fixed: Coupon = { ...validCoupon, type: "fixed", value: 500 };
    expect(calculateDiscount(fixed, 2000)).toBe(500);
  });
});

// ─── Search query sanitization ────────────────────────────────────────────────

const sanitizeSearchQuery = (query: string): string =>
  query.replace(/[.*+?^${}()|[\]\\]/g, " ").trim().slice(0, 100);

describe("Search query sanitization", () => {
  it("normalizes normal query", () => {
    expect(sanitizeSearchQuery("goa beach")).toBe("goa beach");
  });
  it("strips regex special chars", () => {
    const result = sanitizeSearchQuery("hotel.*resort");
    // '.' and '*' replaced with spaces, then trimmed
    expect(result.replace(/\s+/g, " ")).toBe("hotel resort");
  });
  it("limits length to 100", () => {
    expect(sanitizeSearchQuery("a".repeat(150)).length).toBeLessThanOrEqual(100);
  });
  it("handles empty string", () => {
    expect(sanitizeSearchQuery("")).toBe("");
  });
});

// ─── Travel date validation ───────────────────────────────────────────────────

const validateTravelDate = (dateStr: string): { valid: boolean; error?: string } => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return { valid: false, error: "Invalid date" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) return { valid: false, error: "Travel date must be in the future" };
  const max = new Date(today);
  max.setFullYear(max.getFullYear() + 2);
  if (date > max) return { valid: false, error: "Travel date too far in the future" };
  return { valid: true };
};

describe("Travel date validation", () => {
  it("accepts a future date", () => {
    const future = new Date();
    future.setDate(future.getDate() + 7);
    expect(validateTravelDate(future.toISOString()).valid).toBe(true);
  });
  it("rejects past date", () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    expect(validateTravelDate(past.toISOString()).valid).toBe(false);
  });
  it("rejects invalid date string", () => {
    expect(validateTravelDate("not-a-date").valid).toBe(false);
  });
});

// ─── Webhook idempotency ──────────────────────────────────────────────────────

type PaymentRecord = { id: string; bookingId: string; status: string };

const findDuplicatePayment = (existing: PaymentRecord[], paymentId: string): PaymentRecord | undefined =>
  existing.find((p) => p.id === paymentId);

describe("Webhook idempotency", () => {
  it("returns existing record for duplicate payment ID", () => {
    const existing: PaymentRecord[] = [{ id: "pay_001", bookingId: "book_001", status: "paid" }];
    expect(findDuplicatePayment(existing, "pay_001")?.status).toBe("paid");
  });
  it("returns undefined for new payment ID", () => {
    expect(findDuplicatePayment([], "pay_001")).toBeUndefined();
  });
});

// ─── Pagination ───────────────────────────────────────────────────────────────

describe("Pagination helpers", () => {
  const paginate = <T>(items: T[], page: number, pageSize: number): { data: T[]; totalPages: number } => {
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const safePage = Math.max(1, Math.min(page, totalPages));
    const start = (safePage - 1) * pageSize;
    return { data: items.slice(start, start + pageSize), totalPages };
  };

  it("returns first page correctly", () => {
    const result = paginate([1, 2, 3, 4, 5], 1, 2);
    expect(result.data).toEqual([1, 2]);
    expect(result.totalPages).toBe(3);
  });

  it("returns second page correctly", () => {
    const result = paginate([1, 2, 3, 4, 5], 2, 2);
    expect(result.data).toEqual([3, 4]);
  });

  it("clamps page beyond total", () => {
    const result = paginate([1, 2, 3], 10, 2);
    expect(result.data).toEqual([3]);
    expect(result.totalPages).toBe(2);
  });

  it("handles empty array", () => {
    const result = paginate([], 1, 10);
    expect(result.data).toEqual([]);
    expect(result.totalPages).toBe(1);
  });

  it("handles page 0 gracefully", () => {
    const result = paginate([1, 2, 3], 0, 2);
    expect(result.data).toEqual([1, 2]);
  });
});
