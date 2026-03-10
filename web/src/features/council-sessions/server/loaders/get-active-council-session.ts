import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { CouncilSession } from "../../shared/types";
import { findActiveCouncilSession } from "../repositories/council-session-repository";

/**
 * アクティブな定例会を取得
 * is_active = true の会期を返す
 * アクティブな会期がない場合は null を返す
 */
export async function getActiveCouncilSession(): Promise<CouncilSession | null> {
  return _getCachedActiveCouncilSession();
}

const _getCachedActiveCouncilSession = unstable_cache(
  async (): Promise<CouncilSession | null> => {
    return findActiveCouncilSession();
  },
  ["active-council-session"],
  {
    revalidate: 3600, // 1 hour
    tags: [CACHE_TAGS.COUNCIL_SESSIONS],
  }
);
