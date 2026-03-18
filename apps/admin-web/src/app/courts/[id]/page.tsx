import { CourtDetail } from "@/features/courts/court-detail";

export const dynamic = "force-dynamic";

export default async function CourtDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <CourtDetail courtId={id} />;
}
