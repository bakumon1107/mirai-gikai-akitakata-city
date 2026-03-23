"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@mirai-gikai/supabase";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { invalidateWebCache } from "@/lib/utils/cache-invalidation";
import { routes } from "@/lib/routes";
import type { DeleteCommitteeInput } from "../../shared/types";

export async function deleteCommittee(input: DeleteCommitteeInput) {
  try {
    await requireAdmin();

    const supabase = createAdminClient();

    // 議案が紐付いている場合は削除不可
    const { count, error: countError } = await supabase
      .from("bills")
      .select("*", { count: "exact", head: true })
      .eq("committee_id", input.id);

    if (countError) {
      return { error: `委員会の確認に失敗しました: ${countError.message}` };
    }

    if (count && count > 0) {
      return { error: `議案が${count}件紐付いているため削除できません` };
    }

    const { error } = await supabase
      .from("committees")
      .delete()
      .eq("id", input.id);

    if (error) {
      if (error.code === "23503") {
        return { error: "議案が紐付いているため削除できません" };
      }
      if (error.code === "PGRST116") {
        return { error: "委員会が見つかりません" };
      }
      return { error: `委員会の削除に失敗しました: ${error.message}` };
    }

    revalidatePath(routes.committees());
    await invalidateWebCache();

    return { success: true };
  } catch (error) {
    console.error("Delete committee error:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "委員会の削除中にエラーが発生しました" };
  }
}
