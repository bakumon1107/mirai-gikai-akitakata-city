import { getBillsByFeaturedTags } from "@/features/bills/server/loaders/get-bills-by-featured-tags";
import { getActiveCouncilSession } from "@/features/council-sessions/server/loaders/get-active-council-session";
import { getFeaturedBills } from "./get-featured-bills";
import { getPreviousSessionBills } from "./get-previous-session-bills";

/**
 * トップページ用のデータを並列取得する
 * BFF (Backend For Frontend) パターン
 */
export async function loadHomeData() {
  const [featuredBills, billsByTag, previousSessionData, activeSession] =
    await Promise.all([
      getFeaturedBills(),
      getBillsByFeaturedTags(),
      getPreviousSessionBills(),
      getActiveCouncilSession(),
    ]);

  return {
    billsByTag,
    featuredBills,
    previousSessionData,
    activeSessionSlug: activeSession?.slug ?? null,
  };
}
