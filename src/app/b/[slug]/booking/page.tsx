import { notFound } from "next/navigation";
import { getBusinessBySlug, getServices } from "@/lib/business";
import BookingFlow from "./BookingFlow";

// Server wrapper: загружает business + services по slug и передаёт их
// клиентскому BookingFlow пропсами (page может принимать только params).
export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();
  const services = await getServices(business.id);

  return (
    <BookingFlow
      slug={slug}
      businessId={business.id}
      businessName={business.name}
      services={services}
    />
  );
}
