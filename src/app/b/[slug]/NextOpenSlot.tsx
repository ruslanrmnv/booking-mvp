"use client";

import { useEffect, useState } from "react";
import { buildTimeSlots } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";

// How many days ahead to scan before giving up.
const MAX_DAYS = 14;

/** Local YYYY-MM-DD (no UTC shift) */
function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** "Today" / "Tomorrow" / weekday name */
function dayLabel(offset: number, d: Date): string {
  if (offset === 0) return "Сегодня";
  if (offset === 1) return "Завтра";
  return d.toLocaleDateString("ru-RU", { weekday: "long" });
}

/**
 * Computes the soonest available slot, scanning forward day by day from today
 * using the same business-hours logic (09:00–17:00, 30-min) as the booking flow,
 * excluding times already taken (get_booked_times RPC) and, for today, times that
 * have already passed.
 */
export default function NextOpenSlot({ businessId }: { businessId: string }) {
  const [slot, setSlot]       = useState<{ label: string; time: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function findSlot() {
      const now = new Date();
      const nowHM =
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      for (let offset = 0; offset < MAX_DAYS; offset++) {
        const d = new Date();
        d.setDate(d.getDate() + offset);
        const date = isoDate(d);

        const { data } = await supabase.rpc("get_booked_times", {
          p_business_id: businessId,
          p_date: date,
        });
        const bookedTimes = (data ?? []).map(
          (r: { booking_time: string }) => r.booking_time.substring(11, 16)
        );

        const slots = buildTimeSlots(bookedTimes);
        // "HH:MM" zero-padded → lexical comparison is chronological.
        const candidate = slots.find(
          (s) => s.available && (offset > 0 || s.time > nowHM)
        );

        if (candidate) {
          if (!cancelled) {
            setSlot({ label: dayLabel(offset, d), time: candidate.time });
            setLoading(false);
          }
          return;
        }
      }

      if (!cancelled) {
        setSlot(null);
        setLoading(false);
      }
    }

    findSlot();
    return () => { cancelled = true; };
  }, [businessId]);

  if (loading) {
    return (
      <p className="text-amber text-3xl font-bold mt-1 tabular-nums" aria-busy="true">
        Проверяем…
      </p>
    );
  }

  if (!slot) {
    return (
      <p className="text-espresso text-2xl font-bold mt-1">
        Нет свободных мест в ближайшие {MAX_DAYS} дней
      </p>
    );
  }

  return (
    <p className="text-amber text-3xl font-bold mt-1 tabular-nums">
      {slot.label} · {slot.time}
    </p>
  );
}
