import { getBillsByFeaturedTags } from "@/features/bills/server/loaders/get-bills-by-featured-tags";
import { getActiveCouncilSession } from "@/features/council-sessions/server/loaders/get-active-council-session";
import { getAllPastSessions } from "@/features/council-sessions/server/loaders/get-all-past-sessions";
import { getFeaturedBills } from "./get-featured-bills";

/**
 * トップページ用のデータを並列取得する
 * BFF (Backend For Frontend) パターン
 */
export async function loadHomeData() {
  const [featuredBills, billsByTag, pastSessions, activeSession] =
    await Promise.all([
      getFeaturedBills(),
      getBillsByFeaturedTags(),
      getAllPastSessions(),
      getActiveCouncilSession(),
    ]);

  return {
    billsByTag,
    featuredBills,
    pastSessions,
    activeSessionSlug: activeSession?.slug ?? null,
  };
}
