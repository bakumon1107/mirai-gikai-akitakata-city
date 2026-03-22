import { unstable_cache } from "next/cache";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { ComingSoonBill } from "../../shared/types";
import {
  findComingSoonBills,
  findTagsByBillIds,
} from "../repositories/bill-repository";

/**
 * 指定した定例会のComing Soon議案を取得する
 */
export async function getComingSoonBillsBySession(
  councilSessionId: string
): Promise<ComingSoonBill[]> {
  const difficultyLevel = await getDifficultyLevel();
  return _getCachedComingSoonBillsBySession(councilSessionId, difficultyLevel);
}

const _getCachedComingSoonBillsBySession = unstable_cache(
  async (
    councilSessionId: string,
    difficultyLevel: DifficultyLevelEnum
  ): Promise<ComingSoonBill[]> => {
    const data = await findComingSoonBills(councilSessionId);
    if (data.length === 0) {
      return [];
    }

    // タグ情報を一括取得
    const billIds = data.map((bill) => bill.id);
    const tagsByBillId = await findTagsByBillIds(billIds);

    return data.map((bill) => {
      const contents = bill.bill_contents as Array<{
        title: string;
        difficulty_level: string;
      }> | null;

      const preferredContent = contents?.find(
        (c) => c.difficulty_level === difficultyLevel
      );
      const fallbackContent =
        contents?.find((c) => c.difficulty_level === "normal") || contents?.[0];

      return {
        id: bill.id,
        name: bill.name,
        title: preferredContent?.title || fallbackContent?.title || null,
        council_url: bill.council_sessions?.council_url ?? null,
        status: bill.status,
        tags: tagsByBillId.get(bill.id) ?? [],
      };
    });
  },
  ["coming-soon-bills-by-session"],
  {
    revalidate: 600,
    tags: [CACHE_TAGS.BILLS],
  }
);
