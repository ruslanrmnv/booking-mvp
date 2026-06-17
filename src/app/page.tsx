import Link from "next/link";
import { SERVICES, formatPrice } from "@/lib/mock-data";
import { BUSINESS_NAME } from "@/lib/site";
import NextOpenSlot from "./NextOpenSlot";

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col bg-ivory">

      {/* ── Sticky header ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex items-center justify-between
                         px-6 sm:px-10 h-16 border-b border-walnut/15
                         bg-ivory/95 backdrop-blur-sm">
        {/* Plain wordmark — Inter, weight 600, no decoration */}
        <span className="text-espresso text-lg font-semibold tracking-tight">
          {BUSINESS_NAME}
        </span>
        <Link
          href="/booking"
          className="text-sm font-medium text-espresso/70 hover:text-espresso
                     transition-colors duration-150 rounded-sm
                     focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-amber focus-visible:ring-offset-2
                     focus-visible:ring-offset-ivory"
        >
          Book now
        </Link>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="px-6 sm:px-10 pt-16 sm:pt-24 pb-16">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-espresso font-bold tracking-tight
                         text-4xl sm:text-5xl leading-tight max-w-2xl">
            Book your next cut in seconds.
          </h1>
          <p className="text-espresso/70 text-base mt-4 max-w-md">
            Choose a service, pick a time, and you&apos;re set &mdash; no account,
            no waiting on hold.
          </p>

          {/* Next open slot — single primary CTA per screen */}
          <div className="mt-10 bg-sand rounded-2xl border border-walnut/40 shadow-md p-6 sm:p-8 max-w-md">
            <p className="text-espresso/70 text-sm">Next open slot</p>
            <NextOpenSlot />
            <p className="text-espresso/70 text-sm mt-1">~45 min · no wait</p>

            <Link
              href="/booking"
              className="mt-6 inline-flex w-full items-center justify-center
                         bg-amber text-ivory text-base font-semibold
                         px-6 py-3.5 rounded-xl
                         hover:bg-amber/90 transition-colors duration-150
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-amber focus-visible:ring-offset-2
                         focus-visible:ring-offset-sand"
            >
              Reserve this slot
            </Link>
          </div>
        </div>
      </section>

      {/* ── Services ────────────────────────────────────────────────────── */}
      <section className="px-6 sm:px-10 pb-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-espresso text-2xl font-semibold tracking-tight mb-6">
            Services
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {SERVICES.map((s) => (
              <div key={s.id} className="bg-sand rounded-2xl border border-walnut/40 shadow-md p-6 flex flex-col">
                <p className="text-espresso text-base font-medium">{s.name}</p>
                <p className="text-espresso/70 text-sm mt-1">{s.duration} min</p>
                <p className="text-amber text-2xl font-bold mt-4 tabular-nums">
                  {formatPrice(s.price)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-walnut/15 px-6 sm:px-10 py-6
                         flex items-center justify-between">
        <p className="text-espresso/70 text-sm">
          © {new Date().getFullYear()} {BUSINESS_NAME}
        </p>
        <Link
          href="/login"
          className="text-espresso/70 text-sm hover:text-espresso
                     transition-colors duration-150
                     focus-visible:outline-none focus-visible:underline"
        >
          Business owner?
        </Link>
      </footer>

    </main>
  );
}
