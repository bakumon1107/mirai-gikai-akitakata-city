import "server-only";
import type { CommunityConsultationListItem } from "../../shared/types";
import { findPublishedConsultations } from "../repositories/community-consultation-repository";

export async function getAllConsultations(): Promise<
  CommunityConsultationListItem[]
> {
  return findPublishedConsultations();
}
