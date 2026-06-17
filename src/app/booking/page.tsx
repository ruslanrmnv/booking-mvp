"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { SERVICES, buildTimeSlots, formatPrice } from "@/lib/mock-data";
import { BUSINESS_NAME } from "@/lib/site";
import type { Service } from "@/types";
import { supabase } from "@/lib/supabase";

type Step = "service" | "datetime" | "details" | "confirm";
const STEPS: Step[] = ["service", "datetime", "details", "confirm"];

export default function BookingPage() {
  const [step, setStep]                       = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate]       = useState("");
  const [selectedTime, setSelectedTime]       = useState("");
  const [form, setForm]                       = useState({ name: "", email: "", phone: "" });
  const [submitted, setSubmitted]             = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [errorMsg, setErrorMsg]               = useState("");
  const [slots, setSlots]                     = useState<{ time: string; available: boolean }[]>([]);
  const [slotsLoading, setSlotsLoading]       = useState(false);

  /* ── Fetch available slots ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!selectedDate) { setSlots([]); return; }
    async function fetchSlots() {
      setSlotsLoading(true);
      const { data } = await supabase.rpc("get_booked_times", { p_date: selectedDate });
      const bookedTimes = (data ?? []).map(
        (r: { booking_time: string }) => r.booking_time.substring(11, 16)
      );
      setSlots(buildTimeSlots(bookedTimes));
      setSlotsLoading(false);
    }
    fetchSlots();
  }, [selectedDate]);

  /* ── Submit ─────────────────────────────────────────────────────────────── */
  async function handleSubmit() {
    if (loading || !selectedService || !selectedDate || !selectedTime ||
        !form.name.trim() || !form.email.trim() || !form.phone.trim()) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const { error } = await supabase.from("bookings").insert([{
        name:         form.name,
        email:        form.email,
        phone:        form.phone.trim() || null,
        service:      selectedService.name,
        booking_time: `${selectedDate}T${selectedTime}:00`,
      }]);
      if (error) { setErrorMsg("Couldn't save your booking — please try again."); return; }
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  /* ── Success screen ─────────────────────────────────────────────────────── */
  if (submitted) {
    const cal = selectedService
      ? buildCalendarLinks(selectedService, selectedDate, selectedTime)
      : null;

    return (
      <div className="min-h-screen bg-ivory flex flex-col">
        {/* Step 5 of 5 — the flow's final, confirmed state */}
        <BookingHeader step={5} />

        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <p className="sr-only" role="status">
            Booking confirmed for {selectedService?.name} on {selectedDate} at {selectedTime}.
          </p>

          <div className="w-full max-w-md text-center">
            {/* Plain checkmark — no rotation, no texture, no stamp */}
            <div className="mx-auto w-16 h-16 rounded-full bg-amber flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12.5L10 17.5L19 7"
                  stroke="#FAF6F0" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <h1 className="text-espresso text-3xl sm:text-4xl font-bold tracking-tight mt-6">
              Booking confirmed
            </h1>
            <p className="text-espresso/70 text-base mt-2">
              We&apos;ll confirm shortly by email.
            </p>

            {/* Summary — same clean, borderless layout as Review */}
            <div className="mt-10">
              <p className="text-espresso text-xl font-semibold">
                {selectedService?.name}
                <span className="text-espresso/70 mx-2">·</span>
                <span className="text-amber tabular-nums">
                  {selectedService ? formatPrice(selectedService.price) : ""}
                </span>
              </p>
              <p className="text-espresso/75 text-base font-medium mt-2">
                {formatBookingDate(selectedDate)} · {selectedTime}
              </p>
              <p className="text-espresso/70 text-sm mt-8">
                Booking for {form.name} · {form.email}
                {form.phone.trim() && ` · ${form.phone.trim()}`}
              </p>
            </div>

            {/* Post-booking action — add the appointment to a calendar */}
            {cal && (
              <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href={cal.ics}
                  download="booking.ics"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl
                             bg-sand border border-walnut/40 text-espresso text-sm font-medium
                             hover:bg-walnut/15 hover:border-walnut/50 transition-colors duration-150
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber
                             focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
                >
                  <CalendarIcon /> Add to calendar
                </a>
                <a
                  href={cal.google}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl
                             bg-sand border border-walnut/40 text-espresso text-sm font-medium
                             hover:bg-walnut/15 hover:border-walnut/50 transition-colors duration-150
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber
                             focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
                >
                  <CalendarIcon /> Google Calendar
                </a>
              </div>
            )}

            <Link
              href="/"
              className="inline-block mt-10 text-espresso/70 text-sm
                         hover:text-espresso/80 transition-colors duration-150
                         focus-visible:outline-none focus-visible:underline"
            >
              Back to home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  /* ── Step number — Service 1 · Date/time 2 · Details 3 · Review 4
     (the confirmed success screen above is step 5 of 5). ──────────────────── */
  const stepNumber = STEPS.indexOf(step) + 1;

  /* ── Booking flow ──────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-ivory flex flex-col">
      <BookingHeader step={stepNumber} />

      {/* Content anchored below the header (not floating in a centered void) */}
      <main className="flex-1 px-6 py-10 sm:py-12">
        <div className="w-full max-w-md mx-auto">

          {/* ── STEP 1: SERVICE ─────────────────────────────────────────── */}
          {step === "service" && (
            <div>
              <h1 className="text-espresso text-3xl sm:text-4xl font-bold tracking-tight mb-8">
                Choose a service
              </h1>

              <div className="space-y-3">
                {SERVICES.map((s) => (
                  <ServiceCard
                    key={s.id}
                    service={s}
                    onSelect={() => { setSelectedService(s); setStep("datetime"); }}
                  />
                ))}
              </div>

              <p className="text-center mt-12">
                <Link
                  href="/login"
                  className="text-espresso/70 text-sm hover:text-espresso
                             transition-colors duration-150
                             focus-visible:outline-none focus-visible:underline"
                >
                  Business owner?
                </Link>
              </p>
            </div>
          )}

          {/* ── STEP 2: DATE & TIME ─────────────────────────────────────── */}
          {step === "datetime" && selectedService && (
            <div>
              <StepSummary
                service={selectedService}
                onChange={() => setStep("service")}
              />

              <h1 className="text-espresso text-3xl sm:text-4xl font-bold tracking-tight mb-6">
                Pick a date &amp; time
              </h1>

              {/* Custom date strip — no native input */}
              <DateStrip
                value={selectedDate}
                onChange={(d) => { setSelectedDate(d); setSelectedTime(""); }}
              />

              {/* Time slots */}
              {selectedDate && (
                <div className="mt-8">
                  {slotsLoading
                    ? <p className="text-espresso/70 text-sm">Loading…</p>
                    : <SlotGrid slots={slots} selected={selectedTime} onSelect={setSelectedTime} />
                  }
                </div>
              )}

              <div className="mt-10 space-y-1">
                <PrimaryBtn
                  disabled={!selectedDate || !selectedTime}
                  onClick={() => setStep("details")}
                  helper={!selectedDate ? "Choose a date to continue" : "Select a time to continue"}
                >
                  Continue
                </PrimaryBtn>
                <BackBtn onClick={() => setStep("service")} />
              </div>
            </div>
          )}

          {/* ── STEP 3: DETAILS ─────────────────────────────────────────── */}
          {step === "details" && selectedService && (
            <div>
              <StepSummary
                service={selectedService}
                dateTime={`${formatBookingDate(selectedDate)} · ${selectedTime}`}
                onChange={() => setStep("datetime")}
              />

              <h1 className="text-espresso text-3xl sm:text-4xl font-bold tracking-tight mb-6">
                Your details
              </h1>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-sand text-espresso placeholder:text-espresso/70
                             text-base px-5 py-4 rounded-xl border border-walnut/20
                             focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/50
                             transition-colors duration-150"
                />
                <input
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-sand text-espresso placeholder:text-espresso/70
                             text-base px-5 py-4 rounded-xl border border-walnut/20
                             focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/50
                             transition-colors duration-150"
                />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-sand text-espresso placeholder:text-espresso/70
                             text-base px-5 py-4 rounded-xl border border-walnut/20
                             focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/50
                             transition-colors duration-150"
                />
              </div>
              <p className="text-espresso/70 text-xs mt-2">
                We&apos;ll text you an appointment reminder.
              </p>

              <div className="mt-10 space-y-1">
                <PrimaryBtn
                  disabled={!form.name.trim() || !form.email.trim() || !form.phone.trim()}
                  onClick={() => setStep("confirm")}
                  helper="Enter your name, email, and phone number to continue"
                >
                  Review booking
                </PrimaryBtn>
                <BackBtn onClick={() => setStep("datetime")} />
              </div>
            </div>
          )}

          {/* ── STEP 4: CONFIRM ─────────────────────────────────────────── */}
          {step === "confirm" && selectedService && (
            <div>
              <h1 className="text-espresso text-3xl sm:text-4xl font-bold tracking-tight mb-8">
                Review &amp; confirm
              </h1>

              {/* Borderless review block — no box, no table rows */}
              <div>
                <p className="text-espresso text-2xl font-semibold leading-snug">
                  {selectedService.name}
                  <span className="text-espresso/70 mx-2">·</span>
                  <span className="text-amber tabular-nums">
                    {formatPrice(selectedService.price)}
                  </span>
                </p>
                <p className="text-espresso/75 text-lg font-medium mt-2">
                  {formatBookingDate(selectedDate)} · {selectedTime}
                </p>
                <p className="text-espresso/70 text-xs mt-1">
                  {selectedService.duration} min
                </p>

                {/* Vertical gap, no border line */}
                <p className="text-espresso/70 text-sm mt-9">
                  Booking for {form.name} · {form.email}
                  {form.phone.trim() && ` · ${form.phone.trim()}`}
                </p>
              </div>

              {errorMsg && (
                <p className="text-oxblood text-sm mt-6">{errorMsg}</p>
              )}

              <div className="mt-10 space-y-1">
                <PrimaryBtn onClick={handleSubmit} disabled={loading}>
                  {loading ? "Booking…" : "Confirm booking"}
                </PrimaryBtn>
                <BackBtn onClick={() => setStep("details")} />
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

/** Service option as a card (sand surface) — replaces bordered rows */
function ServiceCard({ service, onSelect }: { service: Service; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="group w-full text-left bg-sand rounded-2xl px-6 py-5
                 border border-walnut/40 shadow-md
                 flex items-center justify-between gap-6
                 hover:bg-walnut/15 hover:border-walnut/50 transition-colors duration-150
                 focus-visible:outline-none focus-visible:ring-2
                 focus-visible:ring-amber focus-visible:ring-offset-2
                 focus-visible:ring-offset-ivory"
    >
      <div>
        <p className="text-espresso font-medium text-base leading-snug">
          {service.name}
        </p>
        <p className="text-espresso/70 text-sm mt-0.5">{service.duration} min</p>
      </div>
      {/* Price — important numeric value, amber */}
      <span className="text-amber text-xl font-bold tabular-nums shrink-0">
        {formatPrice(service.price)}
      </span>
    </button>
  );
}

/** Compact summary of the current selection, shown on later steps */
function StepSummary({
  service,
  dateTime,
  onChange,
}: {
  service: Service;
  dateTime?: string;
  onChange: () => void;
}) {
  return (
    <div className="bg-sand rounded-2xl border border-walnut/40 shadow-md px-5 py-4 mb-8 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-espresso font-semibold text-base truncate">
          {service.name}
          <span className="text-espresso/70 mx-2">·</span>
          <span className="text-espresso tabular-nums">{formatPrice(service.price)}</span>
        </p>
        <p className="text-espresso/70 text-sm mt-0.5">
          {dateTime ? dateTime : `${service.duration} min`}
        </p>
      </div>
      <button
        onClick={onChange}
        className="text-espresso/70 text-sm font-medium shrink-0
                   hover:text-espresso transition-colors duration-150
                   focus-visible:outline-none focus-visible:underline"
      >
        Change
      </button>
    </div>
  );
}

/** 10-day horizontal scrollable date strip. Replaces native <input type="date"> */
function DateStrip({
  value,
  onChange,
}: {
  value: string;
  onChange: (d: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const days = Array.from({ length: 10 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().split("T")[0];
    return {
      iso,
      weekday: d.toLocaleDateString("en", { weekday: "short" }),
      date:    d.getDate(),
    };
  });

  /* Desktop arrow scrolling — additive; touch-swipe still works via overflow-x. */
  function scroll(direction: 1 | -1) {
    const el = scrollRef.current;
    if (!el) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * 200, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <div className="flex items-center gap-3">
      <ScrollArrow direction="left" onClick={() => scroll(-1)} />

      {/* Hide scrollbar but keep scrollability (touch swipe + arrows).
          px/py give the focus & selected rings room so they're never clipped
          by the overflow container or sat under the arrows. */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto px-2 py-2"
        style={{ scrollbarWidth: "none" }}
      >
        {days.map((d) => {
          const selected = d.iso === value;
          return (
            <button
              key={d.iso}
              onClick={() => onChange(d.iso)}
              className={`flex flex-col items-center min-h-[44px] py-3 px-3.5 rounded-xl border
                          flex-shrink-0 min-w-[3.5rem] transition-colors duration-150
                          focus-visible:outline-none focus-visible:ring-2
                          focus-visible:ring-amber focus-visible:ring-offset-2
                          focus-visible:ring-offset-ivory
                ${selected
                  ? "bg-amber text-ivory border-amber"
                  : "bg-sand text-espresso/70 border-walnut/20 hover:bg-walnut/15 hover:text-espresso hover:border-walnut/30"
                }`}
            >
              <span className={`text-[10px] uppercase tracking-wide ${
                selected ? "text-ivory" : "text-espresso/70"
              }`}>
                {d.weekday}
              </span>
              <span className="text-lg font-semibold tabular-nums leading-none mt-1">
                {d.date}
              </span>
            </button>
          );
        })}
      </div>

      <ScrollArrow direction="right" onClick={() => scroll(1)} />
    </div>
  );
}

/** Round token-styled arrow to scroll the date strip on desktop */
function ScrollArrow({
  direction,
  onClick,
}: {
  direction: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "left" ? "Show earlier dates" : "Show later dates"}
      className="shrink-0 w-9 h-9 rounded-full bg-sand text-espresso/70
                 hidden md:flex items-center justify-center
                 hover:bg-walnut/15 hover:text-espresso transition-colors duration-150
                 focus-visible:outline-none focus-visible:ring-2
                 focus-visible:ring-amber focus-visible:ring-offset-2
                 focus-visible:ring-offset-ivory"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d={direction === "left" ? "M15 18L9 12L15 6" : "M9 6L15 12L9 18"}
          stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

/** Slot grid grouped into morning/afternoon */
function SlotGrid({
  slots,
  selected,
  onSelect,
}: {
  slots: { time: string; available: boolean }[];
  selected: string;
  onSelect: (t: string) => void;
}) {
  const am = slots.filter((s) => parseInt(s.time) < 12);
  const pm = slots.filter((s) => parseInt(s.time) >= 12);

  if (!slots.length) {
    return <p className="text-espresso/70 text-sm">No slots available on this day.</p>;
  }

  return (
    <div className="space-y-6">
      {am.length > 0 && (
        <div>
          <p className="text-espresso/70 text-xs font-medium mb-2.5">Morning</p>
          <SlotRow slots={am} selected={selected} onSelect={onSelect} />
        </div>
      )}
      {pm.length > 0 && (
        <div>
          <p className="text-espresso/70 text-xs font-medium mb-2.5">Afternoon</p>
          <SlotRow slots={pm} selected={selected} onSelect={onSelect} />
        </div>
      )}
    </div>
  );
}

function SlotRow({
  slots,
  selected,
  onSelect,
}: {
  slots: { time: string; available: boolean }[];
  selected: string;
  onSelect: (t: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {slots.map(({ time, available }) => (
        <button
          key={time}
          disabled={!available}
          onClick={() => onSelect(time)}
          className={`min-h-[44px] py-3 rounded-lg text-sm tabular-nums border transition-colors duration-150
                      focus-visible:outline-none focus-visible:ring-2
                      focus-visible:ring-amber focus-visible:ring-offset-1
                      focus-visible:ring-offset-ivory
            ${selected === time
              ? "bg-amber text-ivory border-amber font-semibold"
              : available
              ? "bg-sand text-espresso border-walnut/20 hover:bg-walnut/15 hover:border-walnut/30"
              : "border-transparent text-espresso/30 line-through cursor-not-allowed"
            }`}
        >
          {time}
        </button>
      ))}
    </div>
  );
}

/**
 * Full-width primary action — solid amber, the single dominant action.
 * When disabled it takes a clearly muted (non-amber) style, and `helper`
 * text below explains what's still needed to proceed.
 */
function PrimaryBtn({
  children,
  onClick,
  disabled,
  helper,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  helper?: string;
}) {
  return (
    <div>
      <button
        onClick={onClick}
        disabled={disabled}
        className="w-full bg-amber text-ivory text-base font-semibold py-4 rounded-xl
                   hover:bg-amber/90 transition-colors duration-150
                   disabled:bg-walnut/20 disabled:text-espresso/45 disabled:cursor-not-allowed
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber
                   focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
      >
        {children}
      </button>
      {disabled && helper && (
        <p className="mt-2 text-center text-espresso/70 text-xs" role="status">
          {helper}
        </p>
      )}
    </div>
  );
}

/** Back as a subordinate text link — no competing visual weight */
function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-center text-espresso/70 text-sm py-3
                 hover:text-espresso/70 transition-colors duration-150
                 focus-visible:outline-none focus-visible:underline"
    >
      Back
    </button>
  );
}

/** Format ISO date → "Tuesday, June 18" (no UTC shift) */
function formatBookingDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month:   "long",
    day:     "numeric",
  });
}

/**
 * Persistent header shown on every step: business name + "Step N of 5" and a
 * progress bar. Gives the flow context so it doesn't read as a floating form.
 */
function BookingHeader({ step, total = 5 }: { step: number; total?: number }) {
  const pct = Math.round((step / total) * 100);
  return (
    <header className="sticky top-0 z-50 bg-ivory/95 backdrop-blur-sm border-b border-walnut/25">
      <div className="max-w-md mx-auto px-6 pt-5 pb-4">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-espresso text-base font-semibold tracking-tight
                       hover:text-espresso/70 transition-colors duration-150
                       focus-visible:outline-none focus-visible:underline"
          >
            {BUSINESS_NAME}
          </Link>
          <span className="text-espresso/70 text-sm font-medium tabular-nums shrink-0">
            Step {step} of {total}
          </span>
        </div>
        <div
          className="mt-3 h-[3px] bg-walnut/20 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label={`Step ${step} of ${total}`}
        >
          <div
            className="h-full bg-espresso/40 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </header>
  );
}

/** Small calendar glyph for the post-booking actions */
function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 9.5h18M8 2.5v4M16 2.5v4"
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Build an .ics data URI and a Google Calendar template URL for the booking.
 * Times are treated as local/floating (no tz suffix), matching how the slot
 * was chosen. Duration comes from the selected service.
 */
function buildCalendarLinks(service: Service, dateISO: string, timeHM: string) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const [hh, mm] = timeHM.split(":").map(Number);
  const start = new Date(y, m - 1, d, hh, mm);
  const end = new Date(start.getTime() + service.duration * 60000);

  const fmt = (dt: Date) =>
    `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}` +
    `T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;

  const startStr = fmt(start);
  const endStr = fmt(end);
  const title = `${service.name} at ${BUSINESS_NAME}`;
  const details = `Your ${service.name} appointment at ${BUSINESS_NAME}.`;

  const ics =
    "data:text/calendar;charset=utf8," +
    encodeURIComponent(
      [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        `PRODID:-//${BUSINESS_NAME}//Booking//EN`,
        "BEGIN:VEVENT",
        `UID:${startStr}-${Math.random().toString(36).slice(2)}@barberbook`,
        `DTSTAMP:${startStr}`,
        `DTSTART:${startStr}`,
        `DTEND:${endStr}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${details}`,
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n")
    );

  const google =
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(title)}` +
    `&dates=${startStr}/${endStr}` +
    `&details=${encodeURIComponent(details)}`;

  return { ics, google };
}
