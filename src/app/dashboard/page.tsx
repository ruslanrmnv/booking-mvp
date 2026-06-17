"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SERVICES, formatPrice } from "@/lib/mock-data";
import { BUSINESS_NAME } from "@/lib/site";
import { supabase } from "@/lib/supabase";

// Форма строки из Supabase (реальная схема таблицы bookings)
type SupabaseBooking = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  service: string;       // название услуги текстом, не ID
  booking_time: string;  // ISO-строка, e.g. "2026-06-18T10:00:00"
};

// Цену ищем по названию услуги, не по ID
function getPriceByName(serviceName: string): number {
  return SERVICES.find((s) => s.name === serviceName)?.price ?? 0;
}


export default function DashboardPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<SupabaseBooking[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  useEffect(() => {
    async function fetchBookings() {
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .order("booking_time", { ascending: true });

      setBookings(data ?? []);
      setLoadingData(false);
    }

    fetchBookings();
  }, []);

  const total = bookings.length;
  const revenue = bookings.reduce((sum, b) => sum + getPriceByName(b.service), 0);

  return (
    <div className="min-h-screen bg-ivory text-espresso">
      {/* Sticky header — matches the public landing header */}
      <header className="sticky top-0 z-50 flex items-center justify-between
                         px-6 sm:px-10 h-16 border-b border-walnut/15
                         bg-ivory/95 backdrop-blur-sm">
        <span className="text-espresso text-lg font-semibold tracking-tight">
          {BUSINESS_NAME}
        </span>
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-espresso/70 hover:text-espresso
                       transition-colors duration-150 rounded-sm
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-amber focus-visible:ring-offset-2
                       focus-visible:ring-offset-ivory"
          >
            ← Public site
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-espresso/70 hover:text-espresso
                       transition-colors duration-150 rounded-sm
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-amber focus-visible:ring-offset-2
                       focus-visible:ring-offset-ivory"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto py-10 sm:py-12 px-6 sm:px-10">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-espresso mb-8">
          Dashboard
        </h1>

        {/* Stats — the dashboard's key figures, in amber */}
        <div className="grid grid-cols-2 gap-4 mb-12">
          <StatCard label="Total Bookings" value={loadingData ? "—" : String(total)} />
          <StatCard label="Revenue"        value={loadingData ? "—" : formatPrice(revenue)} />
        </div>

        {/* Bookings — section heading + single primary action */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold tracking-tight text-espresso">
            Upcoming Bookings
          </h2>
          <Link
            href="/booking"
            className="inline-flex items-center justify-center shrink-0
                       bg-amber text-ivory text-sm font-semibold
                       px-5 py-2.5 rounded-xl
                       hover:bg-amber/90 transition-colors duration-150
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-amber focus-visible:ring-offset-2
                       focus-visible:ring-offset-ivory"
          >
            + New booking
          </Link>
        </div>

        {loadingData ? (
          <div className="bg-sand rounded-2xl border border-walnut/40 shadow-md p-6">
            <p className="text-espresso/60 text-sm">Loading…</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-sand rounded-2xl border border-walnut/40 shadow-md p-6">
            <p className="text-espresso/60 text-sm">No bookings yet.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {bookings.map((b) => (
              <li
                key={b.id}
                className="bg-sand rounded-2xl border border-walnut/40 shadow-md p-5
                           flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-espresso font-medium truncate">{b.name}</p>
                  <p className="text-espresso/60 text-xs truncate">{b.email}</p>
                </div>
                <div className="flex flex-col sm:items-end gap-0.5 text-sm shrink-0">
                  <span className="text-espresso/80">{b.service}</span>
                  <span className="text-espresso tabular-nums">
                    {b.booking_time.substring(0, 10)} · {b.booking_time.substring(11, 16)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-sand rounded-2xl border border-walnut/40 shadow-md px-6 py-5">
      <p className="text-espresso/70 text-sm mb-1">{label}</p>
      <p className="text-amber text-3xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
