"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@mirai-gikai/supabase";
import { invalidateWebCache } from "@/lib/utils/cache-invalidation";
import { routes } from "@/lib/routes";
import type { StanceInput } from "../../shared/types";

export async function upsertStance(
  billId: string,
  factionId: string,
  data: StanceInput
) {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase.from("faction_stances").upsert(
      {
        bill_id: billId,
        faction_id: factionId,
        type: data.type,
        comment: data.comment || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "bill_id,faction_id" }
    );

    if (error) {
      console.error("Error upserting stance:", error);
      throw new Error("会派見解の保存に失敗しました");
    }

    revalidatePath(routes.bills(), "layout");
    await invalidateWebCache();
    return { success: true };
  } catch (error) {
    console.error("Error in upsertStance:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "予期しないエラーが発生しました",
    };
  }
}
