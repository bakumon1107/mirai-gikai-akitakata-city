"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { routes } from "@/lib/routes";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import type { DeleteCouncilSessionInput } from "../../shared/types";
import { deleteCouncilSessionRecord } from "../repositories/council-session-repository";

export async function deleteCouncilSession(input: DeleteCouncilSessionInput) {
  try {
    await requireAdmin();

    await deleteCouncilSessionRecord(input.id);

    revalidatePath(routes.councilSessions());
    await invalidateWebCache([WEB_CACHE_TAGS.COUNCIL_SESSIONS]);
    return { success: true };
  } catch (error) {
    console.error("Delete council session error:", error);
    return {
      error: getErrorMessage(error, "定例会の削除中にエラーが発生しました"),
    };
  }
}
