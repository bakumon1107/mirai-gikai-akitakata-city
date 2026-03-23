"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { routes } from "@/lib/routes";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import { trimOrNull } from "@/lib/utils/normalize-string";
import type { UpdateCouncilSessionInput } from "../../shared/types";
import { validateSlug } from "../../shared/utils/validate-slug";
import { updateCouncilSessionRecord } from "../repositories/council-session-repository";

export async function updateCouncilSession(input: UpdateCouncilSessionInput) {
  try {
    await requireAdmin();

    if (!input.name || input.name.trim().length === 0) {
      return { error: "定例会名を入力してください" };
    }

    if (!input.start_date) {
      return { error: "開始日を入力してください" };
    }

    const slugError = validateSlug(input.slug);
    if (slugError) {
      return { error: slugError };
    }

    const data = await updateCouncilSessionRecord(input.id, {
      name: input.name.trim(),
      slug: trimOrNull(input.slug),
      council_url: trimOrNull(input.council_url),
      start_date: input.start_date,
      end_date: input.end_date || null,
    });

    revalidatePath(routes.councilSessions());
    await invalidateWebCache([WEB_CACHE_TAGS.COUNCIL_SESSIONS]);
    return { data };
  } catch (error) {
    console.error("Update council session error:", error);
    return {
      error: getErrorMessage(error, "定例会の更新中にエラーが発生しました"),
    };
  }
}
