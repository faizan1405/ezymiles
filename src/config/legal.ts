/**
 * Legal page scaffolding.
 *
 * EVERY body below is a structured PLACEHOLDER. It sets out the sections a
 * travel business needs and the questions each one must answer — it is not legal
 * advice and must be reviewed and completed by a qualified lawyer in your
 * jurisdiction before launch. The `isPlaceholder` flag drives a visible banner on
 * each page so nobody mistakes this for finished copy; clear it from
 * Admin → Legal Pages once a lawyer has signed the text off.
 */

export interface LegalPageSeed {
  slug: string;
  title: string;
  summary: string;
  sections: { heading: string; body: string[] }[];
}

export const LEGAL_PAGES: LegalPageSeed[] = [
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    summary: "What personal data we collect, why, how long we keep it, and the rights you have over it.",
    sections: [
      {
        heading: "Who we are",
        body: [
          "[TRAVEL BRAND NAME] is the data controller for the personal information described in this policy. Our registered address and contact details are set out at the end of this page.",
          "PLACEHOLDER: insert the registered company name, company registration number, registered office address and, if applicable, the name and contact details of your Data Protection Officer.",
        ],
      },
      {
        heading: "What we collect",
        body: [
          "Identity and contact data: name, email address, phone number, and postal address where relevant.",
          "Traveller data: date of birth, nationality, passport number and expiry — collected only where a booking or a visa application genuinely requires it.",
          "Booking data: destinations, dates, travellers, the price you paid, and correspondence about your trip.",
          "Payment data: we do NOT store card numbers. Payments are processed by our payment gateway, which holds the card data. We retain only the gateway's transaction identifiers and the payment status.",
          "Technical data: IP address, device type and pages viewed, used to keep the site secure and to understand which content is useful.",
        ],
      },
      {
        heading: "Why we use it (lawful basis)",
        body: [
          "To perform the contract you enter into when you book: arranging flights, stays, activities, transfers and visa assistance.",
          "To comply with legal obligations, including tax records and any statutory traveller reporting requirements.",
          "For our legitimate interests: fraud prevention, service improvement, and responding to enquiries you send us.",
          "With your consent: marketing emails and WhatsApp updates. You can withdraw consent at any time using the unsubscribe link or by contacting us.",
        ],
      },
      {
        heading: "Who we share it with",
        body: [
          "Suppliers who must have it to deliver your trip: airlines, hotels, ground operators, activity providers and, for visa services, the relevant embassy or consulate.",
          "Processors acting on our instructions: our payment gateway, email delivery provider, and cloud hosting and media providers.",
          "PLACEHOLDER: list your actual processors and, where personal data leaves your jurisdiction, state the transfer mechanism relied on.",
        ],
      },
      {
        heading: "How long we keep it",
        body: [
          "Booking and financial records are retained for the period required by tax and accounting law.",
          "Enquiries that do not become bookings are retained for a limited period and then deleted.",
          "PLACEHOLDER: state the actual retention periods and the criteria used to determine them.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "You may request access to your data, correction of inaccurate data, erasure where the law allows, restriction of processing, portability, and you may object to processing based on legitimate interests.",
          "You may also complain to the relevant data protection authority.",
          "PLACEHOLDER: name the supervisory authority applicable to your jurisdiction and give the exact contact route for exercising these rights.",
        ],
      },
      {
        heading: "Contact",
        body: [
          "Questions about this policy or your data: [EMAIL ADDRESS], [PHONE NUMBER], [OFFICE ADDRESS].",
        ],
      },
    ],
  },

  {
    slug: "terms-and-conditions",
    title: "Terms and Conditions",
    summary: "The terms on which we provide this website and our travel services.",
    sections: [
      {
        heading: "About these terms",
        body: [
          "These terms govern your use of this website and any booking you make through it. By using the site you accept them.",
          "PLACEHOLDER: confirm the contracting entity, the governing law and the jurisdiction for disputes.",
        ],
      },
      {
        heading: "Our role",
        body: [
          "For packages we arrange, we act as the organiser and contract with you directly for the trip as a whole.",
          "For individual services such as a standalone flight or hotel, we may act as an agent for the supplier. Where we do, the supplier's own terms also apply and we will tell you so before you book.",
          "PLACEHOLDER: this distinction has significant legal consequences (including package travel liability). It must be reviewed and stated accurately.",
        ],
      },
      {
        heading: "Prices and availability",
        body: [
          "Prices shown are per person unless stated otherwise and are confirmed at the point we accept your booking.",
          "Availability is not guaranteed until confirmed. Where a supplier withdraws or reprices a service after you book, we will offer you the choice of paying any difference, accepting an alternative, or cancelling for a full refund of what you have paid us.",
        ],
      },
      {
        heading: "Your responsibilities",
        body: [
          "You must give accurate names exactly as they appear on the travel document you will use, and tell us promptly of any change.",
          "You are responsible for holding a valid passport, the correct visas, and any vaccinations or health documentation required.",
          "You are responsible for arriving at check-in and departure points on time.",
        ],
      },
      {
        heading: "Liability",
        body: [
          "PLACEHOLDER: liability caps, exclusions, and the treatment of force majeure must be drafted by a lawyer and must comply with the mandatory consumer protections applicable in your jurisdiction. Do not publish this page without that review.",
        ],
      },
    ],
  },

  {
    slug: "booking-terms",
    title: "Booking Terms",
    summary: "How a booking is made, confirmed, changed and paid for.",
    sections: [
      {
        heading: "Making a booking",
        body: [
          "A booking request is made when you complete checkout. A contract exists only once we confirm the booking and payment has cleared.",
          "The lead traveller must be at least 18 years old and warrants that they have authority to book on behalf of everyone named.",
        ],
      },
      {
        heading: "Deposits and balances",
        body: [
          "Where a deposit option is offered, the deposit percentage is shown before you pay and the balance due date is stated on your confirmation.",
          "If the balance is not paid by the due date, we may treat the booking as cancelled by you and apply the cancellation charges below.",
        ],
      },
      {
        heading: "Changes by you",
        body: [
          "We will always try to accommodate a change. Supplier fees, fare differences and any administration charge will be quoted to you before we make the change.",
          "Airline name changes are generally not permitted after ticketing.",
        ],
      },
      {
        heading: "Changes by us",
        body: [
          "Minor changes (for example, a small change to flight times or a substitution of a hotel of equivalent standard) may occur. We will tell you as soon as we know.",
          "If a significant change becomes necessary, you may accept it, accept an alternative trip, or cancel and receive a refund of the amounts paid to us for the affected services.",
        ],
      },
    ],
  },

  {
    slug: "cancellation-policy",
    title: "Cancellation Policy",
    summary: "What happens, and what it costs, if you cancel.",
    sections: [
      {
        heading: "How to cancel",
        body: [
          "Cancellations must be requested in writing — from your account, by email, or via your travel designer. The cancellation takes effect on the day we receive the request.",
        ],
      },
      {
        heading: "Cancellation charges",
        body: [
          "Charges depend on the trip and are stated on each package page before you book. Where a package page states its own schedule, that schedule prevails over this page.",
          "PLACEHOLDER: set out the default charge bands (for example, days before departure and the percentage retained). These must reflect the actual supplier terms you are bound by.",
          "Airline tickets, non-refundable hotel rates and government visa fees are frequently non-refundable in full, regardless of when you cancel.",
        ],
      },
      {
        heading: "If we cancel",
        body: [
          "If we cancel your trip for any reason other than your failure to pay, you may take an alternative trip of equivalent standard or receive a full refund of the amounts you have paid us.",
        ],
      },
    ],
  },

  {
    slug: "refund-policy",
    title: "Refund Policy",
    summary: "How refunds are calculated, approved and paid.",
    sections: [
      {
        heading: "How refunds work",
        body: [
          "Approved refunds are returned to the original payment method. We do not pay refunds in cash or to a third-party account.",
          "Once processed, bank settlement typically takes 5–7 working days, though the exact time is controlled by your bank and the payment gateway.",
        ],
      },
      {
        heading: "What is refundable",
        body: [
          "The refundable amount is the total you paid, less any cancellation charges, less any supplier fees that are non-recoverable, less any government fees that have already been paid on your behalf.",
          "We will show you the calculation before we process the refund.",
        ],
      },
      {
        heading: "Timeline",
        body: [
          "PLACEHOLDER: state the maximum number of days within which you commit to initiating an approved refund.",
        ],
      },
    ],
  },

  {
    slug: "payment-policy",
    title: "Payment Policy",
    summary: "How and when we collect money, and how it is secured.",
    sections: [
      {
        heading: "Accepted methods",
        body: [
          "We accept the payment methods offered by our gateway at checkout, which may include UPI, cards, net banking and wallets.",
          "We never see or store your full card details. Payments are captured on the gateway's own secure checkout.",
        ],
      },
      {
        heading: "Verification",
        body: [
          "Every payment is verified on our server before a booking is confirmed. A payment that appears successful in your browser but fails verification will not confirm a booking, and you will not be charged.",
        ],
      },
      {
        heading: "Currency",
        body: [
          "All bookings are charged in Indian Rupees (INR). Prices displayed in other currencies are indicative conversions for your convenience and are not the amount charged.",
        ],
      },
      {
        heading: "Failed and duplicate payments",
        body: [
          "If a payment is debited but your booking does not confirm, contact us with your booking reference. Gateway-side reversals typically resolve within 5–7 working days.",
        ],
      },
    ],
  },

  {
    slug: "cookie-policy",
    title: "Cookie Policy",
    summary: "What we store on your device and why.",
    sections: [
      {
        heading: "Essential storage",
        body: [
          "We use a session cookie to keep you signed in, and browser local storage for your currency preference, your wishlist and recently viewed packages. These are necessary for the site to function as you expect.",
        ],
      },
      {
        heading: "Analytics and marketing",
        body: [
          "PLACEHOLDER: if you add analytics, advertising or remarketing tags, list them here and implement a consent banner that blocks them until consent is given, where your jurisdiction requires it.",
        ],
      },
    ],
  },

  {
    slug: "visa-disclaimer",
    title: "Visa Disclaimer",
    summary: "The limits of what visa assistance can and cannot do.",
    sections: [
      {
        heading: "We assist. We do not decide.",
        body: [
          "We are not an embassy, consulate, immigration authority or government agency, and we are not affiliated with any of them.",
          "Our service consists of guidance, document review, form completion, appointment booking and lodgement. The decision to grant or refuse a visa — and any request for further documents, biometrics or an interview — rests entirely with the relevant authority.",
        ],
      },
      {
        heading: "Fees",
        body: [
          "Government and embassy fees are set by the authority, are indicative until confirmed at lodgement, and are generally non-refundable regardless of the outcome.",
          "Our service fee covers the work we do and is payable whether or not the visa is granted.",
        ],
      },
      {
        heading: "Timelines",
        body: [
          "Processing times are estimates published by the authority and can change without notice. We strongly advise against booking non-refundable travel before a visa is granted.",
        ],
      },
    ],
  },

  {
    slug: "travel-insurance-disclaimer",
    title: "Travel Insurance Disclaimer",
    summary: "Why insurance matters and what our role is.",
    sections: [
      {
        heading: "Our role",
        body: [
          "Unless we tell you otherwise in writing, we do not sell, underwrite or advise on insurance, and nothing we say should be taken as insurance advice.",
          "PLACEHOLDER: if you intend to distribute insurance products, you will likely need a regulatory authorisation. Take advice before doing so.",
        ],
      },
      {
        heading: "Our recommendation",
        body: [
          "We strongly recommend comprehensive travel insurance covering medical treatment, repatriation, cancellation, curtailment, baggage and any adventure activities you plan to do.",
          "Many activities we can book (diving, trekking at altitude, motorised watersports) are excluded from standard policies unless specifically added.",
        ],
      },
    ],
  },

  {
    slug: "supplier-terms",
    title: "Supplier Terms",
    summary: "When a supplier's own terms apply alongside ours.",
    sections: [
      {
        heading: "Third-party terms",
        body: [
          "Airlines, hotels, ground operators, cruise lines and activity providers each impose their own conditions of carriage or terms of service. Those terms apply to you in addition to ours.",
          "In some cases a supplier's terms limit their liability. Where that limit applies, it also limits what we can recover on your behalf.",
        ],
      },
      {
        heading: "Where to find them",
        body: [
          "We will point you to the relevant supplier terms before you book, and again on your confirmation.",
          "PLACEHOLDER: link the terms of the suppliers you actually contract with.",
        ],
      },
    ],
  },
];

export const LEGAL_SLUGS = LEGAL_PAGES.map((p) => p.slug);
