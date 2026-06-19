import { redirect } from "next/navigation";

// Сохраняем старый путь /booking → перенаправляем на основной бизнес.
export default function BookingRedirect() {
  redirect("/b/barberbook/booking");
}
