import { createAdminClient } from "@mirai-gikai/supabase";
import type { CouncilSession } from "../types";

export async function loadCouncilSessions(): Promise<CouncilSession[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("council_sessions")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) {
    throw new Error(`定例会の取得に失敗しました: ${error.message}`);
  }

  return data || [];
}
