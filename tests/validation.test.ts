import { describe, it, expect } from "vitest";

// Relative imports to avoid path-alias resolution issues in vitest.
import {
  emailField,
  phoneField,
  nameField,
  consentField,
  newsletterSchema,
  enquirySchema,
  callbackSchema,
  customTripSchema,
  contactSchema,
  visaApplicationSchema,
  loginSchema,
  travellerSchema,
  bookingIntentSchema,
  checkoutSchema,
  reviewSchema,
  supportTicketSchema,
} from "../src/lib/validation";

describe("Shared fields", () => {
  describe("emailField", () => {
    it("accepts valid email", () => {
      expect(() => emailField.parse("user@example.com")).not.toThrow();
    });
    it("rejects empty string", () => {
      expect(() => emailField.parse("")).toThrow();
    });
    it("rejects invalid email", () => {
      expect(() => emailField.parse("not-an-email")).toThrow();
    });
    it("rejects email over 160 chars", () => {
      const long = "a".repeat(161) + "@test.com";
      expect(() => emailField.parse(long)).toThrow();
    });
    it("trims whitespace", () => {
      const result = emailField.parse("  user@example.com  ");
      expect(result).toBe("user@example.com");
    });
  });

  describe("phoneField", () => {
    it("accepts valid phone", () => {
      expect(() => phoneField.parse("9876543210")).not.toThrow();
    });
    it("strips formatting characters", () => {
      const result = phoneField.parse("91 (987) 654-3210");
      expect(result).toBe("919876543210");
    });
    it("rejects phone under 7 digits", () => {
      expect(() => phoneField.parse("12345")).toThrow();
    });
    it("rejects empty string", () => {
      expect(() => phoneField.parse("")).toThrow();
    });
  });

  describe("nameField", () => {
    it("accepts a normal name", () => {
      expect(() => nameField.parse("John Doe")).not.toThrow();
    });
    it("rejects single character", () => {
      expect(() => nameField.parse("J")).toThrow();
    });
    it("rejects names over 80 chars", () => {
      expect(() => nameField.parse("a".repeat(81))).toThrow();
    });
    it("trims whitespace", () => {
      expect(nameField.parse("  John  ")).toBe("John");
    });
  });

  describe("consentField", () => {
    it("accepts true", () => {
      expect(() => consentField.parse(true)).not.toThrow();
    });
    it("rejects false", () => {
      expect(() => consentField.parse(false)).toThrow();
    });
  });
});

describe("newsletterSchema", () => {
  it("accepts valid newsletter data", () => {
    expect(() => newsletterSchema.parse({
      email: "user@example.com",
      name: "John",
      phone: "9876543210",
      whatsappOptIn: true,
      consent: true,
      source: "footer",
    })).not.toThrow();
  });
  it("rejects missing consent", () => {
    expect(() => newsletterSchema.parse({ email: "u@e.com", consent: false })).toThrow();
  });
  it("rejects missing email", () => {
    expect(() => newsletterSchema.parse({ consent: true })).toThrow();
  });
});

describe("loginSchema", () => {
  it("accepts valid login data", () => {
    expect(() => loginSchema.parse({ email: "admin@example.com", password: "secret123" })).not.toThrow();
  });
  it("rejects empty password", () => {
    expect(() => loginSchema.parse({ email: "admin@example.com", password: "" })).toThrow();
  });
  it("rejects invalid email", () => {
    expect(() => loginSchema.parse({ email: "not-email", password: "x" })).toThrow();
  });
});

describe("bookingIntentSchema", () => {
  it("defaults paymentMode to full", () => {
    const result = bookingIntentSchema.parse({ type: "package" });
    expect(result.paymentMode).toBe("full");
  });
  it("defaults adults to 1", () => {
    const result = bookingIntentSchema.parse({ type: "package" });
    expect(result.adults).toBe(1);
  });
  it("defaults addOns to empty array", () => {
    const result = bookingIntentSchema.parse({ type: "package" });
    expect(result.addOns).toEqual([]);
  });
  it("accepts valid package booking intent", () => {
    expect(() => bookingIntentSchema.parse({
      type: "package",
      itemSlug: "goa-beach",
      travelDate: "2025-08-01",
      adults: 2,
      children: 1,
      paymentMode: "partial",
      couponCode: "WELCOME10",
    })).not.toThrow();
  });
  it("rejects invalid type", () => {
    expect(() => bookingIntentSchema.parse({ type: "spaceship" })).toThrow();
  });
  it("rejects adults > 30", () => {
    expect(() => bookingIntentSchema.parse({ type: "package", adults: 31 })).toThrow();
  });
  it("upper-cases couponCode", () => {
    const result = bookingIntentSchema.parse({ type: "package", couponCode: "welcome10" });
    expect(result.couponCode).toBe("WELCOME10");
  });
});

describe("travellerSchema", () => {
  const base = { firstName: "John", lastName: "Doe" };
  it("accepts valid traveller", () => {
    expect(() => travellerSchema.parse({ ...base, type: "adult", title: "Mr", nationality: "Indian" })).not.toThrow();
  });
  it("defaults title to Mr", () => {
    const result = travellerSchema.parse({ ...base });
    expect(result.title).toBe("Mr");
  });
  it("defaults type to adult", () => {
    const result = travellerSchema.parse({ ...base });
    expect(result.type).toBe("adult");
  });
  it("rejects empty firstName", () => {
    expect(() => travellerSchema.parse({ ...base, firstName: "" })).toThrow();
  });
});

describe("checkoutSchema", () => {
  const baseTraveller = { type: "adult" as const, title: "Mr" as const, firstName: "John", lastName: "Doe", nationality: "Indian" };
  it("accepts valid checkout data", () => {
    expect(() => checkoutSchema.parse({
      bookingId: "booking-123",
      travellers: [baseTraveller],
      contactEmail: "john@example.com",
      contactPhone: "9876543210",
      acceptTerms: true,
    })).not.toThrow();
  });
  it("rejects empty bookingId", () => {
    expect(() => checkoutSchema.parse({
      bookingId: "",
      travellers: [baseTraveller],
      contactEmail: "j@e.com",
      contactPhone: "9876543210",
      acceptTerms: true,
    })).toThrow();
  });
  it("rejects without accepting terms", () => {
    expect(() => checkoutSchema.parse({
      bookingId: "b1",
      travellers: [baseTraveller],
      contactEmail: "j@e.com",
      contactPhone: "9876543210",
      acceptTerms: false,
    })).toThrow();
  });
});

describe("reviewSchema", () => {
  it("accepts valid review", () => {
    expect(() => reviewSchema.parse({
      subjectKind: "package",
      rating: 5,
      body: "Amazing trip! The beaches were pristine and the hotel was excellent.",
    })).not.toThrow();
  });
  it("rejects rating below 1", () => {
    expect(() => reviewSchema.parse({ subjectKind: "package", rating: 0, body: "short but enough chars here now" })).toThrow();
  });
  it("rejects body under 20 chars", () => {
    expect(() => reviewSchema.parse({ subjectKind: "package", rating: 5, body: "too short" })).toThrow();
  });
});

describe("supportTicketSchema", () => {
  it("accepts valid ticket", () => {
    expect(() => supportTicketSchema.parse({
      subject: "Booking issue",
      category: "booking",
      message: "I have a problem with my booking reference number and need help.",
      priority: "normal",
    })).not.toThrow();
  });
  it("defaults category to general", () => {
    const result = supportTicketSchema.parse({
      subject: "Help",
      message: "I need assistance with this matter and need a response.",
    });
    expect(result.category).toBe("general");
  });
  it("rejects subject under 4 chars", () => {
    expect(() => supportTicketSchema.parse({
      subject: "Ab",
      message: "A longer description of the problem at hand here.",
    })).toThrow();
  });
});

describe("contactSchema", () => {
  it("accepts valid contact data", () => {
    expect(() => contactSchema.parse({
      name: "John Doe",
      email: "john@example.com",
      phone: "9876543210",
      topic: "general",
      message: "This is a test message with enough content for validation.",
      consent: true,
    })).not.toThrow();
  });
  it("rejects message under 10 chars", () => {
    expect(() => contactSchema.parse({
      name: "John",
      email: "john@example.com",
      phone: "9876543210",
      topic: "general",
      message: "short",
      consent: true,
    })).toThrow();
  });
});

describe("visaApplicationSchema", () => {
  it("defaults travellerCount to 1", () => {
    const result = visaApplicationSchema.parse({
      visaCountrySlug: "uae",
      visaType: "tourist",
      nationality: "Indian",
      applicantName: "John Doe",
      email: "john@example.com",
      phone: "9876543210",
      consent: true,
    });
    expect(result.travellerCount).toBe(1);
  });
});

describe("callbackSchema", () => {
  it("accepts empty email as valid (optional)", () => {
    expect(() => callbackSchema.parse({
      name: "Jane",
      phone: "9876543210",
      countryCode: "+91",
      email: "",
      consent: true,
    })).not.toThrow();
  });
});

describe("customTripSchema", () => {
  it("accepts valid custom trip", () => {
    expect(() => customTripSchema.parse({
      destination: "Bali",
      departureCity: "Delhi",
      startDate: "2025-09-01",
      durationDays: 7,
      adults: 2,
      children: 1,
      budgetPerPersonINR: 50000,
      travelStyle: "adventure",
      hotelCategory: 4,
      flightsRequired: true,
      visaRequired: false,
      name: "John Doe",
      phone: "9876543210",
      email: "john@example.com",
      consent: true,
    })).not.toThrow();
  });
  it("rejects duration under 1", () => {
    expect(() => customTripSchema.parse({
      destination: "Bali",
      departureCity: "Delhi",
      startDate: "2025-09-01",
      durationDays: 0,
      adults: 2,
      budgetPerPersonINR: 50000,
      travelStyle: "adventure",
      hotelCategory: 3,
      name: "John",
      phone: "9876543210",
      email: "john@example.com",
      consent: true,
    })).toThrow();
  });
  it("rejects duration over 60", () => {
    expect(() => customTripSchema.parse({
      destination: "Bali",
      departureCity: "Delhi",
      startDate: "2025-09-01",
      durationDays: 61,
      adults: 2,
      budgetPerPersonINR: 50000,
      travelStyle: "adventure",
      hotelCategory: 3,
      name: "John",
      phone: "9876543210",
      email: "john@example.com",
      consent: true,
    })).toThrow();
  });
});

describe("enquirySchema", () => {
  it("rejects invalid type enum", () => {
    expect(() => enquirySchema.parse({
      type: "invalid" as any,
      name: "John",
      email: "john@example.com",
      phone: "9876543210",
      consent: true,
    })).toThrow();
  });
});
