// Услуги теперь живут в БД (таблица services, по бизнесу). Здесь остаются
// только чистые хелперы, используемые во всём флоу бронирования.

// "HH:MM" → минуты от полуночи. Некорректный вход → NaN.
function toMinutes(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

// Чистая функция: принимает уже занятые "HH:MM" + рабочие часы бизнеса и
// возвращает сетку 30-минутных слотов. close_time включается (последний слот
// может начинаться ровно в close_time — как было при хардкоде 09:00–17:00).
// Используется в /booking и на лендинге для реальных данных из Supabase.
export function buildTimeSlots(
  bookedTimes: string[],
  openTime = "09:00",
  closeTime = "17:00"
): { time: string; available: boolean }[] {
  const open = toMinutes(openTime);
  const close = toMinutes(closeTime);
  const slots: { time: string; available: boolean }[] = [];
  if (Number.isNaN(open) || Number.isNaN(close) || close < open) return slots;
  for (let t = open; t <= close; t += 30) {
    const time = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
    slots.push({ time, available: !bookedTimes.includes(time) });
  }
  return slots;
}

export function formatPrice(price: number): string {
  return `${price} ₼`;
}
