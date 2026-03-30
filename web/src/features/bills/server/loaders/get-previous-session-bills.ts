import { unstable_cache } from "next/cache";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { getPreviousCouncilSession } from "@/features/council-sessions/server/loaders/get-previous-council-session";
import type { CouncilSession } from "@/features/council-sessions/shared/types";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { BillWithContent } from "../../shared/types";
import {
  findPreviousSessionBills,
  findTagsByBillIds,
  findBillIdsWithPublicInterview,
  countPublishedBillsByDietSession,
} from "../repositories/bill-repository";

const MAX_PREVIEW_BILLS = 5;

export type PreviousSessionBillsResult = {
  session: CouncilSession;
  bills: BillWithContent[];
  totalBillCount: number;
} | null;

/**
 * 前回の定例会とその議案を取得（プレビュー用、最大5件）
 * 前回の会期がない場合はnullを返す
 */
export async function getPreviousSessionBills(): Promise<PreviousSessionBillsResult> {
  const previousSession = await getPreviousCouncilSession();
  if (!previousSession) {
    return null;
  }

  const difficultyLevel = await getDifficultyLevel();
  const [bills, totalBillCount] = await Promise.all([
    _getCachedPreviousSessionBills(previousSession.id, difficultyLevel),
    _getCachedPreviousSessionBillCount(previousSession.id, difficultyLevel),
  ]);

  return {
    session: previousSession,
    bills,
    totalBillCount,
  };
}

const _getCachedPreviousSessionBills = unstable_cache(
  async (
    councilSessionId: string,
    difficultyLevel: DifficultyLevelEnum
  ): Promise<BillWithContent[]> => {
    const data = await findPreviousSessionBills(
      councilSessionId,
      difficultyLevel,
      MAX_PREVIEW_BILLS
    );

    if (data.length === 0) {
      return [];
    }

    // タグ情報とインタビュー状態を取得
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
  ["previous-session-bills"],
  {
    revalidate: 600, // 10分
    tags: [CACHE_TAGS.BILLS, CACHE_TAGS.INTERVIEW_CONFIGS],
  }
);

const _getCachedPreviousSessionBillCount = unstable_cache(
  async (
    dietSessionId: string,
    difficultyLevel: DifficultyLevelEnum
  ): Promise<number> => {
    return countPublishedBillsByDietSession(dietSessionId, difficultyLevel);
  },
  ["previous-session-bill-count"],
  {
    revalidate: 600,
    tags: [CACHE_TAGS.BILLS],
  }
);
