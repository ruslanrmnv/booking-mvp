import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/mock-data";
import { getBusinessBySlug, getServices } from "@/lib/business";
import NextOpenSlot from "./NextOpenSlot";

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default async function LandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();
  const services = await getServices(business.id);

  return (
    <main className="min-h-screen flex flex-col bg-ivory">

      {/* ── Sticky header ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex items-center justify-between
                         px-6 sm:px-10 h-16 border-b border-walnut/15
                         bg-ivory/95 backdrop-blur-sm">
        {/* Plain wordmark — Inter, weight 600, no decoration */}
        <span className="text-espresso text-lg font-semibold tracking-tight">
          {business.name}
        </span>
        <Link
          href={`/b/${slug}/booking`}
          className="text-sm font-medium text-espresso/70 hover:text-espresso
                     transition-colors duration-150 rounded-sm
                     focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-amber focus-visible:ring-offset-2
                     focus-visible:ring-offset-ivory"
        >
          Записаться
        </Link>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="px-6 sm:px-10 pt-16 sm:pt-24 pb-16">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-espresso font-bold tracking-tight
                         text-4xl sm:text-5xl leading-tight max-w-2xl">
            Запишитесь на стрижку за несколько секунд.
          </h1>
          <p className="text-espresso/70 text-base mt-4 max-w-md">
            Выберите услугу и время — и всё готово. Без регистрации
            и без ожидания на телефоне.
          </p>

          {/* Next open slot — single primary CTA per screen */}
          <div className="mt-10 bg-sand rounded-2xl border border-walnut/40 shadow-md p-6 sm:p-8 max-w-md">
            <p className="text-espresso/70 text-sm">Ближайшее свободное время</p>
            <NextOpenSlot businessId={business.id} />
            <p className="text-espresso/70 text-sm mt-1">~45 мин · без ожидания</p>

            <Link
              href={`/b/${slug}/booking`}
              className="mt-6 inline-flex w-full items-center justify-center
                         bg-amber text-ivory text-base font-semibold
                         px-6 py-3.5 rounded-xl
                         hover:bg-amber/90 transition-colors duration-150
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-amber focus-visible:ring-offset-2
                         focus-visible:ring-offset-sand"
            >
              Забронировать это время
            </Link>
          </div>
        </div>
      </section>

      {/* ── Services ────────────────────────────────────────────────────── */}
      <section className="px-6 sm:px-10 pb-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-espresso text-2xl font-semibold tracking-tight mb-6">
            Услуги
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {services.map((s) => (
              <div key={s.id} className="bg-sand rounded-2xl border border-walnut/40 shadow-md p-6 flex flex-col">
                <p className="text-espresso text-base font-medium">{s.name}</p>
                <p className="text-espresso/70 text-sm mt-1">{s.duration} мин</p>
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
          © {new Date().getFullYear()} {business.name}
        </p>
        <Link
          href="/login"
          className="text-espresso/70 text-sm hover:text-espresso
                     transition-colors duration-150
                     focus-visible:outline-none focus-visible:underline"
        >
          Вы владелец бизнеса?
        </Link>
      </footer>

    </main>
  );
}
