# BarberBook — Project Context

## Overview
BarberBook is a booking platform MVP for service businesses (starting with 
barbershops, salons). Currently single-tenant — built for one business, with 
the architecture deliberately kept open to extend to multi-tenant later, but 
NOT built as multi-tenant yet (see Architecture Decisions below).

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
- `/` — src/app/page.tsx + src/app/NextOpenSlot.tsx (client) — customer 
  landing: hero, live "next open slot" (real computed value, not hardcoded), 
  services list
- `/booking` — src/app/booking/page.tsx (client) — 4-step flow (service → 
  date/time → details → review) + success screen. Sub-components inline: 
  ServiceCard, StepSummary, DateStrip + ScrollArrow, SlotGrid/SlotRow, 
  PrimaryBtn, BackBtn, formatBookingDate
- `/login` — src/app/login/page.tsx — Supabase password auth
- `/dashboard` — src/app/dashboard/page.tsx — bookings list + stats, 
  protected by middleware
- src/lib/mock-data.ts — SERVICES, buildTimeSlots (09:00–17:00, 30-min slots), 
  formatPrice, MOCK_BOOKINGS (has a known pre-existing harmless type error — 
  out of scope, do not fix unless explicitly asked)
- src/lib/supabase.ts — browser client via createBrowserClient (@supabase/ssr)
- src/types/index.ts — Service, Booking, TimeSlot
- src/proxy.ts — protects /dashboard, redirects to /login if no session; 
  `/` and `/booking` are public (Next.js 16 `proxy` convention, formerly 
  `middleware.ts`)

## Database & Security
Table `bookings`: id (uuid, PK), created_at (timestamptz, default now()), 
name (text), service (text), booking_time (timestamptz), email (text).

RLS is enabled. Policies:
- anon_insert: INSERT, role anon, with_check true
- authenticated_insert: INSERT, role authenticated
- authenticated_select: SELECT, role authenticated

RPC function `get_booked_times(p_date date)` — SECURITY DEFINER, returns 
ONLY booking_time for that date. Used by anon clients to check slot 
availability without exposing other customers' name/email. The booking 
flow's availability check MUST always go through this RPC, never a direct 
SELECT on bookings from an anon context.

Never use or request the service_role key in any agent context. Schema 
changes (new columns, policies, etc.) are applied manually by the project 
owner via the Supabase SQL Editor — propose the SQL, don't try to execute it 
yourself.

## Architecture Decisions — Do NOT Do These Without Explicit Request
- No multi-tenant infrastructure (no tenant_id, no slug routing, no per-tenant 
  config/branding system). This is deliberately deferred until there is a 
  real second business or an explicit decision to build a demo.
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
Phase 3 (multi-tenancy) and Phase 4 (B2B acquisition funnel) — explicitly 
deferred, do not start without explicit go-ahead.