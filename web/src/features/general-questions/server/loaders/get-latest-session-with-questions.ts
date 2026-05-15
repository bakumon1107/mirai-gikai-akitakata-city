import "server-only";
import { findLatestSessionSlugWithPublishedQuestions } from "../repositories/general-questions-repository";

export async function getLatestSessionWithQuestions(): Promise<string | null> {
  return findLatestSessionSlugWithPublishedQuestions();
}
