import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { CouncilSession } from "../../shared/types";
import { findAllPastCouncilSessions } from "../repositories/council-session-repository";

/**
 * 過去の定例会を全件取得（is_active=false、開始日の降順）
 */
export async function getAllPastSessions(): Promise<CouncilSession[]> {
  return _getCachedAllPastSessions();
}

const _getCachedAllPastSessions = unstable_cache(
  async (): Promise<CouncilSession[]> => {
    return findAllPastCouncilSessions();
  },
  ["all-past-sessions"],
  {
    revalidate: 3600, // 1 hour
    tags: [CACHE_TAGS.COUNCIL_SESSIONS],
  }
);
