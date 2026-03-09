import { createAdminClient } from "@mirai-gikai/supabase";
import type { Bill } from "../types";

export type BillListItem = Bill & { stancesCount: number };

export async function getBills(): Promise<BillListItem[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("bills")
    .select("*, faction_stances(count)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`議案の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const stancesData = row.faction_stances as Array<{ count: number }> | null;
    return {
      ...row,
      stancesCount: stancesData?.[0]?.count ?? 0,
    };
  });
}
