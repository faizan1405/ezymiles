import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { tryConnectDB } from "@/lib/db";
import { Coupon } from "@/models";
import { AdminPageHeader } from "@/components/admin/ui";
import { CouponManager } from "@/components/admin/coupon-manager";
import { serialise } from "@/lib/utils";
import type { ICoupon } from "@/models";

export const metadata: Metadata = { title: "Coupons", robots: { index: false } };

export default async function AdminCouponsPage() {
  await requireAdmin("coupons:manage");

  if (!(await tryConnectDB())) {
    return (
      <div>
        <AdminPageHeader title="Coupons" />
        <p className="rounded-2xl border border-hairline bg-white p-8 text-center text-sm text-muted">
          The database is unreachable.
        </p>
      </div>
    );
  }

  const rows = await Coupon.find({}).sort({ createdAt: -1 }).lean();
  const coupons = serialise(rows) as unknown as ICoupon[];

  return (
    <div>
      <AdminPageHeader
        title="Coupons"
        description="Discounts are validated and applied on the server — a coupon code in the URL can never change what's charged."
      />

      <CouponManager
        coupons={coupons.map((c) => ({
          id: String(c._id),
          code: c.code,
          description: c.description,
          discountType: c.discountType,
          value: c.value,
          maxDiscountINR: c.maxDiscountINR,
          minBookingINR: c.minBookingINR,
          appliesTo: c.appliesTo ?? [],
          validFrom: String(c.validFrom).slice(0, 10),
          validTo: String(c.validTo).slice(0, 10),
          usageLimit: c.usageLimit,
          usageCount: c.usageCount,
          perUserLimit: c.perUserLimit,
          isActive: c.isActive,
        }))}
      />
    </div>
  );
}
