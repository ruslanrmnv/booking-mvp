# BarberBook — Project Context

## Overview
BarberBook is a booking platform MVP for service businesses (starting with 
barbershops, salons). Multi-tenant via slug-based routing — each business has 
its own public pages at `/b/[slug]`. In practice one business exists today 
(`barberbook`), but data (businesses, services, bookings) is fully 
per-business. See Architecture Decisions for what is and isn't built.

## Tech Stack
- Frontend: Next.js 16.2.9 (App Router), TypeScript, Tailwind CSS 3.4
- Backend: Supabase (PostgreSQL, Auth via @supabase/ssr)
- Typography: single typeface — Inter, loaded via next/font/google. No serif, 
  no display face, no italics anywhere. Hierarchy via font-weight and size only.

## Design System
Color tokens (tailwind.config.ts) — use ONLY these, no other colors, no gradients:
- ivory #FAF6F0 — base page background (light theme)
- espresso #2B1D14 — primary text
- amber #9C5A1B — primary accent. Reserve for the single primary CTA per 
  screen and key numeric values (price, selected time).
- oxblood #6B2D2D — secondary accent / error states, used sparingly
- walnut #8A6A4B — borders/dividers
- sand #EFE6D8 — elevated card/section surfaces

Light theme only for now. Dark mode is planned but NOT implemented — do not 
add it unless explicitly asked.

Design reference: real professional booking software (Cal.com, Calendly, 
Fresha) — NOT a branded marketing/artisan-style site. No decorative motifs, 
no fake/non-real data visualizations. Cards over bordered table-rows. One 
dominant primary action per screen. Generous whitespace.

## Routes & Key Files
- `/b/[slug]/layout.tsx` — server 404 guard: loads the business by slug, 
  notFound() if missing. Pages re-read the same business via getBusinessBySlug 
  (cache()-deduped per request) — layouts can't pass props to child pages.
- `/b/[slug]` — src/app/b/[slug]/page.tsx (server) + ./NextOpenSlot.tsx 
  (client) — customer landing: hero, live "next open slot" (real computed 
  value, not hardcoded), services list. Business name + services read from DB.
- `/b/[slug]/booking` — src/app/b/[slug]/booking/page.tsx (server) loads 
  business + services and renders ./BookingFlow.tsx (client) — the 4-step flow 
  (service → date/time → details → review) + success screen. Sub-components 
  inline in BookingFlow: ServiceCard, StepSummary, DateStrip + ScrollArrow, 
  SlotGrid/SlotRow, PrimaryBtn, BackBtn, BookingHeader, formatBookingDate.
- `/` and `/booking` — src/app/page.tsx, src/app/booking/page.tsx — thin 
  redirects to `/b/barberbook` and `/b/barberbook/booking` (primary business).
- `/login` — src/app/login/page.tsx — Supabase password auth
- `/dashboard` — src/app/dashboard/page.tsx — bookings list + stats, scoped to 
  the owner's business (businesses.owner_id = auth.uid()); protected by proxy
- src/lib/business.ts — getBusinessBySlug, getServices — cache()-wrapped 
  server reads of businesses/services via the anon server client.
- src/lib/mock-data.ts — buildTimeSlots (09:00–17:00, 30-min slots), 
  formatPrice. (Services now live in the DB, not here.)
- src/lib/supabase.ts — browser client (createBrowserClient) + 
  createServerSupabase() (anon, empty cookies) for public server-side reads.
- src/lib/site.ts — BUSINESS_NAME, generic app-brand fallback (login, root 
  layout metadata, dashboard initial state). Customer-facing name comes from DB.
- src/types/index.ts — Service, Booking, TimeSlot
- src/proxy.ts — protects /dashboard, redirects to /login if no session; 
  `/b/[slug]`, `/`, `/booking` are public (Next.js 16 `proxy` convention, 
  formerly `middleware.ts`)

## Database & Security
Table `businesses`: id (uuid, PK), created_at, slug (text, unique), name 
(text), owner_id (uuid → auth.users; how /dashboard scopes to one business).
Table `services`: id (uuid, PK), business_id (uuid → businesses), name (text), 
duration (int, minutes), price (int, AZN), sort_order (int).
Table `bookings`: id (uuid, PK), created_at (timestamptz, default now()), 
name (text), service (text — service name, not id), booking_time (timestamptz), 
email (text), phone (text, nullable), business_id (uuid → businesses, NOT NULL).

RLS is enabled on all three. Policies:
- businesses / services: public SELECT (anon + authenticated) — needed so the 
  public /b/[slug] pages can load name + services.
- bookings anon_insert: INSERT, role anon, with_check business_id ∈ businesses
- bookings authenticated_insert: INSERT, with_check business_id is owner's
- bookings authenticated_select: SELECT, scoped to the owner's business 
  (business_id where businesses.owner_id = auth.uid())

RPC function `get_booked_times(p_business_id uuid, p_date date)` — SECURITY 
DEFINER, returns ONLY booking_time for that business+date. Used by anon clients 
to check slot availability without exposing other customers' name/email. The 
booking flow's availability check MUST always go through this RPC, never a 
direct SELECT on bookings from an anon context.

Never use or request the service_role key in any agent context. Schema 
changes (new columns, policies, etc.) are applied manually by the project 
owner via the Supabase SQL Editor — propose the SQL, don't try to execute it 
yourself.

## Architecture Decisions — Do NOT Do These Without Explicit Request
- Multi-tenancy is built at the data + routing layer (businesses/services 
  tables, business_id on bookings, /b/[slug] routing). But: one business per 
  owner (no business switcher UI), services are seeded via SQL only (no 
  dashboard CRUD), and there is NO per-tenant branding/config system. Don't 
  build those without an explicit request.
- No B2B marketing site, pricing tiers, or onboarding funnel.
- No booking "status"/cancellation field — there is no UI mechanism to use 
  it yet. Don't add half-built features (a field with no way to act on it).
- Don't build speculative features "for later" — build what's needed now, 
  keep code reasonably easy to extend, but don't pre-build infrastructure 
  for hypothetical future needs.

## Cache Invalidation Rule
Whenever you modify tailwind.config.ts, next.config.js/ts, postcss.config.js, 
or package.json (dependencies), you MUST run afterward:
Remove-Item -Recurse -Force .next
npm run dev
This is required because Next.js does not hot-reload Tailwind/build config 
changes — a stale .next cache will silently serve old styles even though 
source files are correct.

For all other code/component/content changes, do NOT restart the server — 
Fast Refresh handles it automatically. Restarting unnecessarily slows down 
iteration.

## Working Method
- Explain WHY before proposing a solution.
- Read the actual current code before changing it — don't assume.
- Work in small, reviewable steps. Don't redesign/refactor broadly in one pass 
  unless explicitly asked.
- Give exact file paths for any change.
- If something is ambiguous, ask before deciding — don't guess silently.
- Don't invent decorative elements, animations, or features beyond what's 
  explicitly requested.
- After completing a task, report exactly what changed, file by file. Don't 
  just say "done."

## Current Roadmap Status
Phase 1 (critical bug fixes: date carousel overlap, disabled button contrast, 
focus rings, card contrast) — done.
Phase 2 (booking flow UX: step indicator + header, phone field, add-to-calendar, 
hover/selected states — WITHOUT a "manage/cancel booking" link, since no 
cancellation mechanism exists) — in progress.
Phase 5 (accessibility: WCAG AA contrast, touch target sizes, mobile pass) — 
next after Phase 2.
Phase 3 (multi-tenancy) — data + routing layer done (slug routing, 
per-business services/bookings). Owner-facing tooling (service CRUD, business 
switcher, per-tenant branding) NOT built — see Architecture Decisions.
Phase 4 (B2B acquisition funnel) — explicitly deferred, do not start without 
explicit go-ahead.