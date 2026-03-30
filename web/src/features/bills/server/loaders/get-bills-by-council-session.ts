import { unstable_cache } from "next/cache";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { BillWithContent } from "../../shared/types";
import {
  findPublishedBillsByDietSession,
  findTagsByBillIds,
  findBillIdsWithPublicInterview,
} from "../repositories/bill-repository";

/**
 * 定例会IDに紐づく議案一覧を取得
 */
export async function getBillsByCouncilSession(
  councilSessionId: string
): Promise<BillWithContent[]> {
  const difficultyLevel = await getDifficultyLevel();
  return _getCachedBillsByCouncilSession(councilSessionId, difficultyLevel);
}

const _getCachedBillsByCouncilSession = unstable_cache(
  async (
    councilSessionId: string,
    difficultyLevel: DifficultyLevelEnum
  ): Promise<BillWithContent[]> => {
    const data = await findPublishedBillsByDietSession(
      councilSessionId,
      difficultyLevel
    );

    if (!data || data.length === 0) {
      return [];
    }

    // タグ情報とインタビュー状態を一括取得
    const billIds = data.map((item) => item.id);
    const [tagsByBillId, interviewBillIds] = await Promise.all([
      findTagsByBillIds(billIds),
      findBillIdsWithPublicInterview(billIds),
    ]);

    const billsWithContent: BillWithContent[] = data.map((item) => {
      const { bill_contents, ...bill } = item;
      return {
        ...bill,
        bill_content: Array.isArray(bill_contents)
          ? bill_contents[0]
          : undefined,
        tags: tagsByBillId.get(item.id) ?? [],
        hasPublicInterview: interviewBillIds.has(item.id),
      };
    });

    return billsWithContent;
  },
  ["bills-by-council-session"],
  {
    revalidate: 600, // 10分
    tags: [CACHE_TAGS.BILLS, CACHE_TAGS.INTERVIEW_CONFIGS],
  }
);
