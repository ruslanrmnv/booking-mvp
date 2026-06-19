import { notFound } from "next/navigation";
import { getBusinessBySlug } from "@/lib/business";

// Server-гард: неизвестный slug → 404 для всех под-маршрутов /b/[slug]/*.
// Сами страницы читают тот же business через getBusinessBySlug (cache()
// дедуплицирует запрос), поэтому здесь данные дальше не прокидываем.
export default async function BusinessLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  return <>{children}</>;
}
