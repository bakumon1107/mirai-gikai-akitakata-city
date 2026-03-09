import { createAdminClient } from "@mirai-gikai/supabase";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { CouncilSession } from "../../shared/types";
import { getActiveCouncilSession } from "./get-active-council-session";

/**
 * 前回の定例会を取得
 * アクティブなセッションより古いセッションを返す
 * アクティブなセッションがない場合、または古いセッションがない場合はnullを返す
 */
export async function getPreviousCouncilSession(): Promise<CouncilSession | null> {
  const activeSession = await getActiveCouncilSession();

  // アクティブなセッションがない場合はnullを返す
  if (!activeSession) {
    return null;
  }

  return _getCachedPreviousCouncilSession(activeSession.start_date);
}

const _getCachedPreviousCouncilSession = unstable_cache(
  async (activeStartDate: string): Promise<CouncilSession | null> => {
    const supabase = createAdminClient();

    // アクティブなセッションより古いセッションを取得（start_dateで比較）
    const { data: previousSession, error: previousError } = await supabase
      .from("council_sessions")
      .select("*")
      .lt("start_date", activeStartDate)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (previousError) {
      console.error("Failed to fetch previous council session:", previousError);
      return null;
    }

    return previousSession;
  },
  ["previous-council-session"],
  {
    revalidate: 3600, // 1時間
    tags: [CACHE_TAGS.COUNCIL_SESSIONS],
  }
);
