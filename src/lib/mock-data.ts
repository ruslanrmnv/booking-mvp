import type { Service } from "@/types";

export const SERVICES: Service[] = [
  { id: "haircut",     name: "Haircut",          duration: 30, price: 2500 },
  { id: "beard",       name: "Beard Trim",        duration: 20, price: 1500 },
  { id: "haircut-beard", name: "Haircut + Beard", duration: 45, price: 3500 },
];

// Чистая функция: принимает уже занятые "HH:MM" и возвращает сетку слотов.
// Используется в /booking для реальных данных из Supabase.
export function buildTimeSlots(bookedTimes: string[]): { time: string; available: boolean }[] {
  const slots = [];
  for (let h = 9; h <= 17; h++) {
    for (const m of [0, 30]) {
      if (h === 17 && m === 30) continue;
      const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      slots.push({ time, available: !bookedTimes.includes(time) });
    }
  }
  return slots;
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
