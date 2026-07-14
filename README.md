# Voyara

A full-stack travel booking platform — packages, flights, hotels, activities, and visa assistance, with a
customer account area and a role-based admin panel behind it. Built with Next.js App Router, TypeScript,
MongoDB, and a server-authoritative pricing/booking model (the browser never dictates a price).

"Voyara" and the tagline "Journeys designed around you." are internal placeholders — swap them for the real
brand wherever they appear (see [Rebranding](#rebranding) below).

## Tech stack

- **Framework**: Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript (strict)
- **Styling/animation**: Tailwind CSS v4, Framer Motion, GSAP (used sparingly, for a handful of set-piece moments)
- **Data**: MongoDB via Mongoose 9
- **Auth**: Auth.js v5 — email/password (bcrypt) + Google OAuth, separate customer/admin audiences
- **Payments**: Razorpay, server-side signature verification on both the client callback and the webhook; a
  `PaymentProvider` interface makes a Stripe implementation a drop-in addition later
  (`src/server/payments/gateway.ts`)
- **Forms**: React Hook Form + Zod, validated identically on client and server
- **Client state**: Zustand (currency preference, wishlist, recently-viewed — persisted, hydration-safe)
- **Media**: Cloudinary (optional — admin forms accept a pasted image URL if it isn't configured)
- **Email**: Nodemailer/SMTP (optional — templates render to the console log if it isn't configured)

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in at least MONGODB_URI and AUTH_SECRET
npm run seed                 # creates a Super Admin and realistic demo content
npm run dev
```

Sign in as the seeded Super Admin with the email/password printed by the seed script (defaults to
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from your `.env.local`, i.e. `admin@voyara.example` /
`Voyara@2026` unless you changed them) at `/login`, then visit `/admin`. A demo traveller account is also
seeded — check the seed script's console output for its credentials.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (flat config, Next 16 + React Compiler rules) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | Prettier, with the Tailwind class-sorting plugin |
| `npm run seed` | Populate MongoDB with demo destinations, packages, hotels, activities, visa countries, offers, coupons, reviews, blog posts, and the first admin user |

## Environment variables

Everything is documented in [`.env.example`](.env.example) with inline comments on where to get each
credential. Only two are required to run the app at all:

- `MONGODB_URI` — a MongoDB connection string (local or Atlas)
- `AUTH_SECRET` — generate with `npx auth secret` or `openssl rand -base64 32`

Every other integration (Google sign-in, Razorpay, Cloudinary, SMTP, a real flight provider) is optional —
the app detects a missing credential and shows a clearly-labelled "not configured" state instead of
crashing, so you can develop and demo the site without setting all of them up first.

## Project structure

```
src/
  app/
    (site)/        Public site — homepage, destinations, packages, flights, hotels,
                    activities, visa, cabs, blog, account dashboard, checkout, legal
    (auth)/         Sign in / register / verify / reset password
    admin/          Role-gated admin panel (see Admin panel below)
    api/            Route handlers: NextAuth, payments verify/webhook, search, wishlist, uploads
  components/       UI components, grouped by feature area (ui/ holds the shared primitives)
  models/           Mongoose schemas — user, catalog, travel, booking, crm, content, system
  server/           Server-only logic: pricing, catalog queries, nav, actions, payments, flights, admin
  lib/              Shared utilities: db connection, auth/session helpers, permissions, settings, email
  store/            Zustand stores (currency, wishlist, recently-viewed)
  config/           Site-wide constants and defaults
  scripts/          seed.ts — demo data generator (not part of the runtime app)
```

`scripts-local/` (repo root, gitignored) holds a local-only helper that spins up an in-memory MongoDB for
throwaway testing. It is intentionally excluded from linting and is not part of the shipped application.

## Architecture notes worth knowing before you extend this

- **Pricing is never trusted from the browser.** Every quote and every booking recalculates totals,
  discounts, taxes, and availability from the database on the server (`src/server/pricing.ts`). A tampered
  client request can change *what* is being booked, never *what it costs*.
- **Payments** go through `src/server/payments/gateway.ts`'s `PaymentProvider` interface. `RazorpayProvider`
  verifies signatures with `crypto.timingSafeEqual` on both the client-side callback and the async webhook
  (defense in depth — either path alone would confirm payment, so both are checked independently).
  `StripeProvider` is stubbed to throw an explicit "not implemented" error rather than silently succeed;
  implement it there when you're ready to accept international cards.
- **Flights use a provider adapter** (`src/server/flights/`). The bundled `DemoFlightProvider` generates
  offers deterministically from the search inputs (not randomly), and every fare surfaced in the UI carries
  a `DataSource` badge (`live` / `cached` / `estimated` / `demo`) via
  `src/components/flights/data-source-badge.tsx` — never present demo pricing as if it were real. Wire in a
  real GDS/NDC provider (e.g. Amadeus) by implementing the same interface and switching `FLIGHT_PROVIDER`.
- **Bookings are idempotent.** Booking creation hashes the intent (package/dates/travellers/email) into a
  unique `idempotencyKey`, so a resubmitted form or a double click can't create a duplicate paid booking.
- **Nothing is hard-deleted.** Catalog and content models use a `deletedAt` soft-delete field so that past
  bookings, invoices, and audit entries keep resolving correctly even after an item is "removed."
- **Auth cookies match the real request protocol, not `NODE_ENV`.** `src/middleware.ts` derives
  `secureCookie` from `x-forwarded-proto` / the request's actual protocol. Auth.js only names its session
  cookie with the `__Secure-` prefix when the sign-in response was actually served over HTTPS — guessing
  from `NODE_ENV` breaks `/admin` and `/account` under `next start` behind plain HTTP (e.g. before a reverse
  proxy terminates TLS in front of it).
- **Server Components never pass live component/function references as props into Client Components** —
  only plain serializable data crosses that boundary. Where a UI needs an icon that varies per row (e.g. a
  nav list, a social-links row), the icon set is either resolved from a string key inside the rendering
  component itself, or — if a client component owns the interactivity — the icon-bearing list is defined
  natively inside that client component's own module rather than received as a prop. See
  `src/components/account/account-nav.tsx` for the reference pattern.

## Admin panel

`/admin` is gated in `src/middleware.ts` (fast JWT check for "is this an admin session at all") and again on
every page and Server Action via `requireAdmin` / `requireAnyPermission` (page-level redirects) and
`assertAdmin` / `guardAction` (action-level structured denials) in `src/lib/permissions.ts` and
`src/server/admin/`. Eight roles are seeded with a fixed permission matrix
(`src/models/types.ts` → `ADMIN_ROLES`, `ROLE_LABELS`, `ROLE_PERMISSIONS`):

Super Admin, Admin, Sales Manager, Sales Executive, Content Manager, Booking Manager, Finance Manager,
Support Agent.

Every mutation performed through the admin panel writes an `AuditLog` entry (`src/app/admin/audit`) —
actor, action, target, and a before/after diff where relevant.

Dashboard metrics (`/admin`) are computed live from MongoDB — there are no hardcoded or placeholder
statistics anywhere in the admin UI.

## Content model

Full schema definitions live in `src/models/` (`user.ts`, `catalog.ts`, `travel.ts`, `booking.ts`, `crm.ts`,
`content.ts`, `system.ts`, with shared enums/types in `types.ts`) covering users and staff, destinations,
packages/variants/itineraries/departures, hotels/rooms, activities/slots, visa countries/applications,
travellers, bookings/payments/refunds, coupons/offers, enquiries/leads, reviews, blog posts, FAQs,
newsletter subscribers, notifications, support tickets, site settings, and the audit log.

## Rebranding

Brand-level values are centralized in `src/config/` and admin `Settings` (`/admin/settings`) rather than
scattered through components — brand name, tagline, contact details, supported currencies, and social links
are all editable there without touching code.

## Demo content

`npm run seed` populates realistic but entirely original demo inventory (destinations, packages, hotels,
activities, visa countries, offers, coupons, reviews, blog posts) — nothing is copied from any reference
site. Anything representing inventory or pricing is demo data; replace it with real catalog content before
launch.

## Before going to production

- Replace every `[BRACKETED PLACEHOLDER]` (brand name, contact details, office address) via `/admin/settings`
- Have the legal pages under `/legal` (`src/app/(site)/legal/`) reviewed by a lawyer — they're structured
  correctly but the placeholder text is not a substitute for real legal drafting
- Set real Razorpay/Cloudinary/SMTP credentials and switch `FLIGHT_PROVIDER` to a real provider once
  implemented
- Rotate `AUTH_SECRET` and the seeded admin password
- Point `MONGODB_URI` at a production database with backups configured
