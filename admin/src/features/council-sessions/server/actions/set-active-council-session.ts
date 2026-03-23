"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { routes } from "@/lib/routes";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import {
  findCouncilSessionById,
  setActiveCouncilSessionRecord,
} from "../repositories/council-session-repository";

export type SetActiveCouncilSessionInput = {
  id: string;
};

export async function setActiveCouncilSession(
  input: SetActiveCouncilSessionInput
) {
  try {
    await requireAdmin();

    await setActiveCouncilSessionRecord(input.id);

    const data = await findCouncilSessionById(input.id);

    revalidatePath(routes.councilSessions());
    await invalidateWebCache([
      WEB_CACHE_TAGS.COUNCIL_SESSIONS,
      WEB_CACHE_TAGS.BILLS,
    ]);
    return { data };
  } catch (error) {
    console.error("Set active council session error:", error);
    return {
      error: getErrorMessage(
        error,
        "アクティブセッションの設定中にエラーが発生しました"
      ),
    };
  }
}
