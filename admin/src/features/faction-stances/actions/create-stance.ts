"use server";

import { createAdminClient } from "@mirai-gikai/supabase";
import { invalidateWebCache } from "@/lib/utils/cache-invalidation";
import type { StanceInput } from "../types";

export async function createStance(billId: string, data: StanceInput) {
  try {
    const supabase = createAdminClient();

    // みらい会派のIDを取得
    const { data: faction, error: factionError } = await supabase
      .from("factions")
      .select("id")
      .eq("name", "mirai")
      .single();

    if (factionError || !faction) {
      throw new Error("みらい会派が見つかりません");
    }

    const { error } = await supabase.from("faction_stances").insert({
      bill_id: billId,
      faction_id: faction.id,
      type: data.type,
      comment: data.comment || null,
    });

    if (error) {
      console.error("Error creating stance:", error);
      throw new Error("スタンスの作成に失敗しました");
    }

    invalidateWebCache();
    return { success: true };
  } catch (error) {
    console.error("Error in createStance:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "予期しないエラーが発生しました",
    };
  }
}
