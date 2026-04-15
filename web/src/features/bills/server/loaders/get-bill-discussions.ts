import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";

export type BillDiscussion = {
  id: string;
  bill_id: string;
  session_day: number;
  questioner_name: string;
  questioner_number: string | null;
  questioner_party: string | null;
  question_summary: string | null;
  question_raw: string | null;
  answerer_role: string | null;
  answerer_name: string | null;
  answer_summary: string | null;
  answer_raw: string | null;
  exchange_count: number;
  created_at: string;
};

/**
 * 指定議案の審議内容を取得する
 */
export async function getBillDiscussions(
  billId: string
): Promise<BillDiscussion[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("bill_discussions")
    .select("*")
    .eq("bill_id", billId)
    .order("session_day", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch bill discussions:", error);
    return [];
  }

  return data ?? [];
}
