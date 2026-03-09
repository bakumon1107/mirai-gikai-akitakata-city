import { createAdminClient } from "@mirai-gikai/supabase";
import type { FactionStance } from "../types";

export async function getStanceByBillId(
  billId: string
): Promise<FactionStance | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("faction_stances")
    .select("*")
    .eq("bill_id", billId)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      // スタンスが存在しないエラー以外はログに出力
      console.error("Failed to fetch stance:", error);
    }
    return null;
  }

  return data;
}
