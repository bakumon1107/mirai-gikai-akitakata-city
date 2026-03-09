import { createAdminClient } from "@mirai-gikai/supabase";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { CouncilSession } from "../../shared/types";

/**
 * 指定日時点で開催中の定例会を取得
 * 指定日が開始日と終了日の範囲内にある会期を返す
 */
export async function getCurrentCouncilSession(
  date: Date
): Promise<CouncilSession | null> {
  // YYYY-MM-DD形式に変換
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const targetDate = `${year}-${month}-${day}`;

  return _getCachedCurrentCouncilSession(targetDate);
}

const _getCachedCurrentCouncilSession = unstable_cache(
  async (targetDate: string): Promise<CouncilSession | null> => {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("council_sessions")
      .select("*")
      .lte("start_date", targetDate)
      .or(`end_date.gte.${targetDate},end_date.is.null`)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch current council session:", error);
      return null;
    }

    return data;
  },
  ["current-council-session"],
  {
    revalidate: 3600, // 1時間（3600秒）
    tags: [CACHE_TAGS.COUNCIL_SESSIONS],
  }
);
