"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@mirai-gikai/supabase";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { invalidateWebCache } from "@/lib/utils/cache-invalidation";
import { routes } from "@/lib/routes";
import type { CreateCommitteeInput } from "../../shared/types";

export async function createCommittee(input: CreateCommitteeInput) {
  try {
    await requireAdmin();

    const supabase = createAdminClient();

    if (!input.name || input.name.trim().length === 0) {
      return { error: "委員会名を入力してください" };
    }

    const { data, error } = await supabase
      .from("committees")
      .insert({
        name: input.name.trim(),
        description: input.description || null,
        sort_order: input.sort_order,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return { error: "この委員会名は既に存在します" };
      }
      return { error: `委員会の作成に失敗しました: ${error.message}` };
    }

    revalidatePath(routes.committees());
    await invalidateWebCache();

    return { data };
  } catch (error) {
    console.error("Create committee error:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "委員会の作成中にエラーが発生しました" };
  }
}
