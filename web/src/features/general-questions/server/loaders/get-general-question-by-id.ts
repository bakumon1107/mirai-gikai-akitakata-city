import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { GeneralQuestion } from "../../shared/types";
import { findPublishedGeneralQuestionById } from "../repositories/general-questions-repository";

export async function getGeneralQuestionById(
  id: string
): Promise<GeneralQuestion | null> {
  return _getCached(id);
}

const _getCached = unstable_cache(
  async (id: string): Promise<GeneralQuestion | null> => {
    return findPublishedGeneralQuestionById(id);
  },
  ["general-question-by-id"],
  {
    revalidate: 600,
    tags: [CACHE_TAGS.GENERAL_QUESTIONS],
  }
);
