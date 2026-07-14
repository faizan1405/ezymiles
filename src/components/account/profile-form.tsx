"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { BadgeCheck, AlertCircle } from "lucide-react";

import { changePassword, updateProfile } from "@/server/actions/account";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { CURRENCIES, CURRENCY_META, type CurrencyCode } from "@/config/site";
import { usePreferences } from "@/store/preferences";

interface ProfileValues {
  name: string;
  email: string;
  phone: string;
  nationality: string;
  dateOfBirth: string;
  preferredCurrency: CurrencyCode;
  marketingOptIn: boolean;
  whatsappOptIn: boolean;
}

interface PasswordValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function ProfileForm({
  defaults,
  hasPassword,
  isVerified,
}: {
  defaults: ProfileValues;
  hasPassword: boolean;
  isVerified: boolean;
}) {
  const setCurrency = usePreferences((s) => s.setCurrency);

  const profileForm = useForm<ProfileValues>({ defaultValues: defaults });
  const passwordForm = useForm<PasswordValues>();

  const onSaveProfile = profileForm.handleSubmit(async (values) => {
    const result = await updateProfile(values);

    if (result.ok) {
      // Keep the on-page currency display in step with the saved preference.
      setCurrency(values.preferredCurrency);
      toast.success("Profile updated", result.message);
    } else {
      toast.error("Could not save", result.message);
    }
  });

  const onChangePassword = passwordForm.handleSubmit(async (values) => {
    const result = await changePassword(values);

    if (result.ok) {
      passwordForm.reset();
      toast.success("Password changed", result.message);
    } else {
      toast.error("Could not change password", result.message);
    }
  });

  return (
    <div className="space-y-8">
      {/* -------------------------------- Details -------------------------------- */}
      <section className="rounded-2xl border border-hairline bg-white p-6">
        <h2 className="text-xl text-midnight-900">Your details</h2>

        <form onSubmit={onSaveProfile} className="mt-6 space-y-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" htmlFor="p-name" required>
              <Input id="p-name" autoComplete="name" {...profileForm.register("name")} />
            </Field>

            <Field label="Email" htmlFor="p-email" hint="Email can't be changed here — contact support.">
              <div className="relative">
                <Input id="p-email" value={defaults.email} disabled readOnly className="pr-11" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isVerified ? (
                    <BadgeCheck className="size-4 text-lagoon-600" aria-label="Verified" />
                  ) : (
                    <AlertCircle className="size-4 text-amber-500" aria-label="Not verified" />
                  )}
                </span>
              </div>
            </Field>

            <Field label="Phone" htmlFor="p-phone" required>
              <Input id="p-phone" type="tel" autoComplete="tel" {...profileForm.register("phone")} />
            </Field>

            <Field label="Nationality" htmlFor="p-nat">
              <Input id="p-nat" {...profileForm.register("nationality")} />
            </Field>

            <Field label="Date of birth" htmlFor="p-dob">
              <Input id="p-dob" type="date" {...profileForm.register("dateOfBirth")} />
            </Field>

            <Field
              label="Preferred currency"
              htmlFor="p-currency"
              hint="Display only — bookings are charged in INR."
            >
              <Select id="p-currency" {...profileForm.register("preferredCurrency")}>
                {CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code} — {CURRENCY_META[code].label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <fieldset className="space-y-2.5 border-t border-hairline pt-5">
            <legend className="mb-2 text-sm font-bold text-midnight-900">What we can send you</legend>
            <Checkbox
              id="p-marketing"
              label="Travel ideas and seasonal fares by email (max twice a month)"
              {...profileForm.register("marketingOptIn")}
            />
            <Checkbox
              id="p-whatsapp"
              label="Trip updates and fare alerts on WhatsApp"
              {...profileForm.register("whatsappOptIn")}
            />
          </fieldset>

          <Button
            type="submit"
            size="lg"
            variant="accent"
            loading={profileForm.formState.isSubmitting}
            loadingText="Saving"
          >
            Save changes
          </Button>
        </form>
      </section>

      {/* -------------------------------- Password ------------------------------- */}
      <section className="rounded-2xl border border-hairline bg-white p-6">
        <h2 className="text-xl text-midnight-900">Password</h2>

        {!hasPassword ? (
          <p className="mt-4 rounded-xl bg-sand-50 p-4 text-sm text-muted">
            You sign in with Google, so there&apos;s no password on this account. Use{" "}
            <a href="/forgot-password" className="font-semibold text-lagoon-700 underline hover:no-underline">
              forgot password
            </a>{" "}
            if you&apos;d like to add one.
          </p>
        ) : (
          <form onSubmit={onChangePassword} className="mt-6 space-y-5" noValidate>
            <Field label="Current password" htmlFor="p-current" required>
              <Input
                id="p-current"
                type="password"
                autoComplete="current-password"
                {...passwordForm.register("currentPassword", { required: true })}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="New password" htmlFor="p-new" required>
                <Input
                  id="p-new"
                  type="password"
                  autoComplete="new-password"
                  {...passwordForm.register("newPassword", { required: true })}
                />
              </Field>

              <Field label="Confirm new password" htmlFor="p-confirm" required>
                <Input
                  id="p-confirm"
                  type="password"
                  autoComplete="new-password"
                  {...passwordForm.register("confirmPassword", { required: true })}
                />
              </Field>
            </div>

            <Button
              type="submit"
              size="lg"
              variant="outline"
              loading={passwordForm.formState.isSubmitting}
              loadingText="Updating"
            >
              Change password
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}
