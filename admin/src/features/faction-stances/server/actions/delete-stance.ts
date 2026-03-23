"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@mirai-gikai/supabase";
import { invalidateWebCache } from "@/lib/utils/cache-invalidation";
import { routes } from "@/lib/routes";

export async function deleteStance(stanceId: string) {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("faction_stances")
      .delete()
      .eq("id", stanceId);

    if (error) {
      console.error("Error deleting stance:", error);
      throw new Error("会派見解の削除に失敗しました");
    }

    revalidatePath(routes.bills(), "layout");
    await invalidateWebCache();
    return { success: true };
  } catch (error) {
    console.error("Error in deleteStance:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "予期しないエラーが発生しました",
    };
  }
}
