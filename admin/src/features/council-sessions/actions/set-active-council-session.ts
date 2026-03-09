"use server";

import { createAdminClient } from "@mirai-gikai/supabase";
import { requireAdmin } from "@/features/auth/lib/auth-server";
import { invalidateWebCache } from "@/lib/utils/cache-invalidation";

export type SetActiveCouncilSessionInput = {
  id: string;
};

export async function setActiveCouncilSession(
  input: SetActiveCouncilSessionInput
) {
  try {
    await requireAdmin();

    const supabase = createAdminClient();

    // Atomic operation: set only the target session as active
    // Uses a database function to avoid race conditions
    const { error: rpcError } = await supabase.rpc(
      "set_active_council_session",
      {
        target_session_id: input.id,
      }
    );

    if (rpcError) {
      return {
        error: `アクティブセッションの設定に失敗しました: ${rpcError.message}`,
      };
    }

    // Fetch the updated session to return
    const { data, error } = await supabase
      .from("council_sessions")
      .select()
      .eq("id", input.id)
      .single();

    if (error) {
      return {
        error: `セッション情報の取得に失敗しました: ${error.message}`,
      };
    }

    await invalidateWebCache();
    return { data };
  } catch (error) {
    console.error("Set active council session error:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return {
      error: "アクティブセッションの設定中にエラーが発生しました",
    };
  }
}
