// Услуги теперь живут в БД (таблица services, по бизнесу). Здесь остаются
// только чистые хелперы, используемые во всём флоу бронирования.

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

export function formatPrice(price: number): string {
  return `${price} ₼`;
}
