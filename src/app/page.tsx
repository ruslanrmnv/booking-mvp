import { redirect } from "next/navigation";

// Однобизнесовый MVP: корень ведёт на основной бизнес.
export default function Home() {
  redirect("/b/barberbook");
}
