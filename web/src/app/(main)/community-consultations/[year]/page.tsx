import { notFound } from "next/navigation";
import { ConsultationDetail } from "@/features/community-consultations/client/components/consultation-detail";
import { getConsultationDetail } from "@/features/community-consultations/server/loaders/get-consultation-detail";

type Props = {
  params: Promise<{ year: string }>;
};

export default async function CommunityConsultationDetailPage({
  params,
}: Props) {
  const { year } = await params;

  const data = await getConsultationDetail(year);
  if (!data) {
    notFound();
  }

  return (
    <ConsultationDetail
      consultation={data.consultation}
      opinions={data.opinions}
    />
  );
}
