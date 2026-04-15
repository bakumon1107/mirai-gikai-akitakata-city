import { unstable_cache } from "next/cache";
import type { GeneralQuestion } from "../../shared/types";
import {
  findGeneralQuestionById,
  findGeneralQuestionsBySession,
} from "../repositories/general-question-repository";

export const getGeneralQuestionsBySession = unstable_cache(
  async (councilSessionId: string): Promise<GeneralQuestion[]> => {
    return findGeneralQuestionsBySession(councilSessionId);
  },
  ["general-questions-by-session"],
  { revalidate: 3600 }
);

export const getGeneralQuestionById = unstable_cache(
  async (id: string): Promise<GeneralQuestion | null> => {
    return findGeneralQuestionById(id);
  },
  ["general-question-by-id"],
  { revalidate: 3600 }
);
