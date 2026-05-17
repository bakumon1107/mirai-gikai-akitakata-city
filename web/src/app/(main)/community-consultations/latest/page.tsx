import { notFound, redirect } from "next/navigation";
import { getLatestConsultation } from "@/features/community-consultations/server/loaders/get-latest-consultation";
import { routes } from "@/lib/routes";

export default async function CommunityConsultationLatestPage() {
  const consultation = await getLatestConsultation();

  if (!consultation) {
    notFound();
  }

  redirect(routes.communityConsultationDetail(consultation.fiscalYear));
}
