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
import type { CreateCouncilSessionInput } from "../../shared/types";
import { validateSlug } from "../../shared/utils/validate-slug";
import { createCouncilSessionRecord } from "../repositories/council-session-repository";

export async function createCouncilSession(input: CreateCouncilSessionInput) {
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

    const data = await createCouncilSessionRecord({
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
    console.error("Create council session error:", error);
    return {
      error: getErrorMessage(error, "定例会の作成中にエラーが発生しました"),
    };
  }
}
