import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { CouncilSession } from "../../shared/types";
import { getActiveCouncilSession } from "./get-active-council-session";
import { findPreviousCouncilSession } from "../repositories/council-session-repository";

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
    return findPreviousCouncilSession(activeStartDate);
  },
  ["previous-council-session"],
  {
    revalidate: 3600, // 1時間
    tags: [CACHE_TAGS.COUNCIL_SESSIONS],
  }
);
