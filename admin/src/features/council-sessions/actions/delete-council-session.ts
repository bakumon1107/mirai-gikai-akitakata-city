"use server";

import { createAdminClient } from "@mirai-gikai/supabase";
import { requireAdmin } from "@/features/auth/lib/auth-server";
import { invalidateWebCache } from "@/lib/utils/cache-invalidation";
import type { DeleteCouncilSessionInput } from "../types";

export async function deleteCouncilSession(input: DeleteCouncilSessionInput) {
  try {
    await requireAdmin();

    const supabase = createAdminClient();

    const { error } = await supabase
      .from("council_sessions")
      .delete()
      .eq("id", input.id);

    if (error) {
      return { error: `定例会の削除に失敗しました: ${error.message}` };
    }

    await invalidateWebCache();
    return { success: true };
  } catch (error) {
    console.error("Delete council session error:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "定例会の削除中にエラーが発生しました" };
  }
}
