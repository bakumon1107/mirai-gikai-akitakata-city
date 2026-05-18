import "server-only";
import type { CommunityConsultation } from "../../shared/types";
import { findLatestPublishedConsultation } from "../repositories/community-consultation-repository";

export async function getLatestConsultation(): Promise<CommunityConsultation | null> {
  return findLatestPublishedConsultation();
}
