import { BookingDetail } from "@/features/bookings/booking-detail";

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <BookingDetail bookingId={id} />;
}
