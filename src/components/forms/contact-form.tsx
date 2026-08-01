"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Send } from "lucide-react";

import { contactSchema, type ContactInput } from "@/lib/validation";
import { submitContact } from "@/server/actions/enquiry";
import { Button } from "@/components/ui/button";
import { Checkbox, ErrorSummary, Field, Input, Select, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";

const TOPICS = [
  { value: "general", label: "General enquiry" },
  { value: "package", label: "About a package" },
  { value: "corporate", label: "Corporate travel" },
  { value: "group", label: "Group travel" },
  { value: "visa", label: "Visa assistance" },
  { value: "support", label: "Support with an existing booking" },
] as const;

export function ContactForm() {
  const [reference, setReference] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { topic: "general", countryCode: "+91", consent: false },
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await submitContact(values);

    if (result.ok) {
      setReference(result.reference ?? "");
      reset();
      toast.success("Message sent", result.message);
    } else {
      toast.error("Could not send", result.message);
    }
  });

  if (reference) {
    return (
      <div className="rounded-2xl border border-lagoon-100 bg-lagoon-50 p-8 text-center" role="status">
        <CheckCircle2 className="mx-auto size-10 text-lagoon-600" aria-hidden />
        <h3 className="mt-4 text-xl text-midnight-900">Message received</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Reference <span className="font-semibold text-midnight-900">{reference}</span>. We usually
          reply within a few hours during business hours.
        </p>
        <Button variant="outline" className="mt-5" onClick={() => setReference(null)}>
          Send another message
        </Button>
      </div>
    );
  }

  const errorList = Object.values(errors)
    .map((e) => e?.message)
    .filter(Boolean) as string[];

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {errorList.length > 1 ? <ErrorSummary errors={errorList} /> : null}

      <Field label="What's this about?" htmlFor="c-topic" required>
        <Select id="c-topic" {...register("topic")}>
          {TOPICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Your name" htmlFor="c-name" required error={errors.name?.message}>
        <Input
          id="c-name"
          autoComplete="name"
          invalid={Boolean(errors.name)}
          {...register("name")}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" htmlFor="c-email" required error={errors.email?.message}>
          <Input
            id="c-email"
            type="email"
            autoComplete="email"
            invalid={Boolean(errors.email)}
            {...register("email")}
          />
        </Field>

        <div className="grid grid-cols-1 gap-2 xs:grid-cols-[6.5rem_1fr]">
          <Field label="Code" htmlFor="c-code">
            <Select id="c-code" {...register("countryCode")}>
              <option value="+91">+91</option>
              <option value="+971">+971</option>
              <option value="+44">+44</option>
              <option value="+1">+1</option>
              <option value="+65">+65</option>
            </Select>
          </Field>

          <Field label="Phone" htmlFor="c-phone" required error={errors.phone?.message}>
            <Input
              id="c-phone"
              type="tel"
              autoComplete="tel"
              invalid={Boolean(errors.phone)}
              {...register("phone")}
            />
          </Field>
        </div>
      </div>

      <Field label="Your message" htmlFor="c-message" required error={errors.message?.message}>
        <Textarea
          id="c-message"
          rows={5}
          placeholder="Tell us what you're planning, or what's gone wrong."
          invalid={Boolean(errors.message)}
          {...register("message")}
        />
      </Field>

      <div className="hidden" aria-hidden>
        <input tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <Checkbox
        id="c-consent"
        label={
          <>
            I agree to be contacted about this enquiry and accept the{" "}
            <Link href="/legal/privacy-policy" className="underline hover:no-underline">
              privacy policy
            </Link>
            .
          </>
        }
        {...register("consent")}
      />
      {errors.consent ? (
        <p role="alert" className="text-xs text-red-600">
          {errors.consent.message}
        </p>
      ) : null}

      <Button type="submit" block size="lg" variant="accent" loading={isSubmitting} loadingText="Sending">
        <Send aria-hidden />
        Send message
      </Button>
    </form>
  );
}
