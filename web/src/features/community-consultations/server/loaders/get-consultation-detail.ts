import "server-only";
import type {
  CommunityConsultation,
  ConsultationOpinion,
} from "../../shared/types";
import {
  findConsultationByFiscalYear,
  findOpinionsByConsultationId,
} from "../repositories/community-consultation-repository";

export type ConsultationDetailData = {
  consultation: CommunityConsultation;
  opinions: ConsultationOpinion[];
};

export async function getConsultationDetail(
  fiscalYear: string
): Promise<ConsultationDetailData | null> {
  const consultation = await findConsultationByFiscalYear(fiscalYear);
  if (!consultation) return null;

  const opinions = await findOpinionsByConsultationId(consultation.id);

  return { consultation, opinions };
}
