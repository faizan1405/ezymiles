import { z } from "zod";
import { ENQUIRY_TYPES } from "@/models/types";

/**
 * One source of truth for form shapes. The same schema runs in the browser
 * (react-hook-form + zodResolver) and again on the server before anything is
 * written — the client copy is a convenience, not a security boundary.
 */

const phoneRegex = /^[0-9]{7,14}$/;

export const emailField = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address")
  .max(160);

export const phoneField = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .transform((v) => v.replace(/[\s\-()]/g, ""))
  .refine((v) => phoneRegex.test(v), "Enter a valid phone number");

export const nameField = z
  .string()
  .trim()
  .min(2, "Please enter your name")
  .max(80, "That name looks too long");

export const consentField = z
  .boolean()
  .refine((v) => v === true, "Please accept the privacy policy to continue");

/* ------------------------------- Newsletter -------------------------------- */

export const newsletterSchema = z.object({
  email: emailField,
  name: z.string().trim().max(80).optional(),
  phone: z.string().trim().optional(),
  whatsappOptIn: z.boolean().default(false),
  consent: consentField,
  source: z.string().default("footer"),
});
export type NewsletterInput = z.input<typeof newsletterSchema>;

/* --------------------------------- Enquiry --------------------------------- */

export const campaignSchema = z
  .object({
    utmSource: z.string().optional(),
    utmMedium: z.string().optional(),
    utmCampaign: z.string().optional(),
    utmTerm: z.string().optional(),
    utmContent: z.string().optional(),
  })
  .optional();

export const enquirySchema = z.object({
  type: z.enum(ENQUIRY_TYPES),
  name: nameField,
  email: emailField,
  phone: phoneField,
  countryCode: z.string().default("+91"),
  message: z.string().trim().max(2000).optional(),
  subject: z
    .object({
      kind: z.string(),
      refId: z.string().optional(),
      title: z.string().optional(),
      slug: z.string().optional(),
    })
    .optional(),
  sourcePage: z.string().default("/"),
  campaign: campaignSchema,
  consent: consentField,
  /** Honeypot — must stay empty. Bots fill it, humans never see it. */
  // Honeypot: real users never see this field. We deliberately DON'T reject a
  // filled value here — the server action detects it and returns a silent
  // success so bots never learn the field is a trap. See submitContact() et al.
  website: z.string().optional(),
});
export type EnquiryInput = z.input<typeof enquirySchema>;

/* ---------------------------- Callback request ----------------------------- */

export const callbackSchema = z.object({
  name: nameField,
  phone: phoneField,
  countryCode: z.string().default("+91"),
  email: z.string().trim().email("Enter a valid email address").optional().or(z.literal("")),
  preferredTime: z.string().optional(),
  message: z.string().trim().max(500).optional(),
  subject: z
    .object({
      kind: z.string(),
      refId: z.string().optional(),
      title: z.string().optional(),
      slug: z.string().optional(),
    })
    .optional(),
  sourcePage: z.string().default("/"),
  consent: consentField,
  // Honeypot: real users never see this field. We deliberately DON'T reject a
  // filled value here — the server action detects it and returns a silent
  // success so bots never learn the field is a trap. See submitContact() et al.
  website: z.string().optional(),
});
export type CallbackInput = z.input<typeof callbackSchema>;

/* ------------------------------ Custom trip -------------------------------- */

export const customTripSchema = z.object({
  destination: z.string().trim().min(2, "Where would you like to go?"),
  departureCity: z.string().trim().min(2, "Where are you flying from?"),
  startDate: z.string().min(1, "Pick an approximate start date"),
  endDate: z.string().optional(),
  flexibleDates: z.boolean().default(false),
  durationDays: z.coerce.number().int().min(1, "Minimum 1 day").max(60, "Maximum 60 days"),
  adults: z.coerce.number().int().min(1, "At least one adult").max(30),
  children: z.coerce.number().int().min(0).max(20).default(0),
  budgetPerPersonINR: z.coerce.number().min(0, "Enter an approximate budget"),
  travelStyle: z.string().min(1, "Pick a travel style"),
  hotelCategory: z.coerce.number().int().min(3).max(5),
  flightsRequired: z.boolean().default(true),
  visaRequired: z.boolean().default(false),
  activities: z.array(z.string()).default([]),
  specialRequests: z.string().trim().max(1500).optional(),
  name: nameField,
  phone: phoneField,
  email: emailField,
  consent: consentField,
  sourcePage: z.string().default("/customise-my-trip"),
  // Honeypot: real users never see this field. We deliberately DON'T reject a
  // filled value here — the server action detects it and returns a silent
  // success so bots never learn the field is a trap. See submitContact() et al.
  website: z.string().optional(),
});
export type CustomTripInput = z.input<typeof customTripSchema>;

/* -------------------------------- Contact ---------------------------------- */

export const contactSchema = z.object({
  name: nameField,
  email: emailField,
  phone: phoneField,
  countryCode: z.string().default("+91"),
  topic: z.enum(["general", "package", "corporate", "group", "visa", "support"]).default("general"),
  message: z.string().trim().min(10, "Tell us a little more (10 characters minimum)").max(2000),
  consent: consentField,
  sourcePage: z.string().default("/contact"),
  // Honeypot: real users never see this field. We deliberately DON'T reject a
  // filled value here — the server action detects it and returns a silent
  // success so bots never learn the field is a trap. See submitContact() et al.
  website: z.string().optional(),
});
export type ContactInput = z.input<typeof contactSchema>;

/* ------------------------------ Visa enquiry ------------------------------- */

export const visaApplicationSchema = z.object({
  visaCountrySlug: z.string().min(1, "Select a destination country"),
  visaType: z.string().min(1, "Select a visa type"),
  nationality: z.string().min(1, "Select your nationality"),
  applicantName: nameField,
  email: emailField,
  phone: phoneField,
  passportNumber: z.string().trim().max(20).optional(),
  travelDate: z.string().optional(),
  travellerCount: z.coerce.number().int().min(1).max(20).default(1),
  message: z.string().trim().max(1000).optional(),
  consent: consentField,
  // Honeypot: real users never see this field. We deliberately DON'T reject a
  // filled value here — the server action detects it and returns a silent
  // success so bots never learn the field is a trap. See submitContact() et al.
  website: z.string().optional(),
});
export type VisaApplicationInput = z.input<typeof visaApplicationSchema>;

/* ----------------------------------- Auth ---------------------------------- */

/**
 * Staff sign-in only. Travellers sign in with Google and have no password, so
 * there is deliberately no register / forgot / reset schema here any more.
 */
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password"),
});
export type LoginInput = z.infer<typeof loginSchema>;

/* --------------------------------- Booking --------------------------------- */

export const travellerSchema = z.object({
  type: z.enum(["adult", "child", "infant"]).default("adult"),
  title: z.enum(["Mr", "Ms", "Mrs", "Mstr", "Dr"]).default("Mr"),
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().min(1, "Last name is required").max(60),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  nationality: z.string().default("Indian"),
  passportNumber: z.string().trim().max(20).optional(),
  passportExpiry: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
});
export type TravellerInput = z.input<typeof travellerSchema>;

/**
 * What the browser is allowed to send when starting a booking: *what* they want,
 * never *what it costs*. Every rupee is recomputed on the server.
 */
export const bookingIntentSchema = z.object({
  type: z.enum(["package", "flight", "hotel", "activity", "visa", "cab"]),
  itemSlug: z.string().optional(),
  itemId: z.string().optional(),
  travelDate: z.string().optional(),
  adults: z.coerce.number().int().min(1).max(30).default(1),
  children: z.coerce.number().int().min(0).max(20).default(0),
  infants: z.coerce.number().int().min(0).max(10).default(0),
  variantKey: z.string().optional(),
  departureId: z.string().optional(),
  /** Hotel */
  roomKey: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  rooms: z.coerce.number().int().min(1).max(10).optional(),
  /** Activity */
  slotTime: z.string().optional(),
  addOns: z.array(z.object({ key: z.string(), quantity: z.coerce.number().int().min(1) })).default([]),
  pickupRequired: z.boolean().default(false),
  pickupLocation: z.string().optional(),
  /** Flight */
  offerId: z.string().optional(),
  /** Visa */
  visaType: z.string().optional(),
  couponCode: z.string().trim().toUpperCase().optional(),
  paymentMode: z.enum(["full", "partial"]).default("full"),
});
export type BookingIntentInput = z.input<typeof bookingIntentSchema>;

export const checkoutSchema = z.object({
  bookingId: z.string().min(1),
  travellers: z.array(travellerSchema).min(1, "Add at least one traveller"),
  contactEmail: emailField,
  contactPhone: phoneField,
  acceptTerms: z.boolean().refine((v) => v === true, "Please accept the booking terms"),
  specialRequests: z.string().trim().max(1000).optional(),
});
export type CheckoutInput = z.input<typeof checkoutSchema>;

/* --------------------------------- Reviews --------------------------------- */

export const reviewSchema = z.object({
  subjectKind: z.enum(["package", "hotel", "activity", "company"]),
  subjectId: z.string().optional(),
  rating: z.coerce.number().int().min(1, "Pick a rating").max(5),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().min(20, "Please write at least 20 characters").max(3000),
  travelledOn: z.string().optional(),
});

/* ------------------------------ Support ticket ----------------------------- */

export const supportTicketSchema = z.object({
  subject: z.string().trim().min(4, "Add a short subject").max(140),
  category: z.enum(["booking", "payment", "visa", "amendment", "general"]).default("general"),
  bookingReference: z.string().trim().optional(),
  message: z.string().trim().min(10, "Describe the issue").max(3000),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
});
export type SupportTicketInput = z.input<typeof supportTicketSchema>;
