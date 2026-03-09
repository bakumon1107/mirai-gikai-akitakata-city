"use server";

import { createAdminClient } from "@mirai-gikai/supabase";
import { requireAdmin } from "@/features/auth/lib/auth-server";
import { invalidateWebCache } from "@/lib/utils/cache-invalidation";
import type { UpdateCouncilSessionInput } from "../types";

export async function updateCouncilSession(input: UpdateCouncilSessionInput) {
  try {
    await requireAdmin();

    const supabase = createAdminClient();

    // バリデーション
    if (!input.name || input.name.trim().length === 0) {
      return { error: "定例会名を入力してください" };
    }

    if (!input.start_date) {
      return { error: "開始日を入力してください" };
    }

    // slug のバリデーション（半角英数字とハイフンのみ）
    if (input.slug && !/^[a-z0-9-]+$/.test(input.slug)) {
      return {
        error: "スラッグは半角英小文字、数字、ハイフンのみ使用できます",
      };
    }

    // 日付の妥当性チェック（終了日が設定されている場合のみ）
    if (input.end_date) {
      const startDate = new Date(input.start_date);
      const endDate = new Date(input.end_date);
      if (endDate < startDate) {
        return { error: "終了日は開始日以降の日付を指定してください" };
      }
    }

    const { data, error } = await supabase
      .from("council_sessions")
      .update({
        name: input.name.trim(),
        slug: input.slug?.trim() || null,
        council_url: input.council_url?.trim() || null,
        start_date: input.start_date,
        end_date: input.end_date,
      })
      .eq("id", input.id)
      .select()
      .single();

    if (error) {
      return { error: `定例会の更新に失敗しました: ${error.message}` };
    }

    await invalidateWebCache();
    return { data };
  } catch (error) {
    console.error("Update council session error:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "定例会の更新中にエラーが発生しました" };
  }
}
