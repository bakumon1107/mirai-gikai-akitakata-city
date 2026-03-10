import { unstable_cache } from "next/cache";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { BillWithContent, FactionStance } from "../../shared/types";
import {
  findPublishedBillById,
  findMiraiStanceByBillId,
  findTagsByBillId,
} from "../repositories/bill-repository";
import { getBillContentWithDifficulty } from "./helpers/get-bill-content";

export async function getBillById(id: string): Promise<BillWithContent | null> {
  // キャッシュ外でcookiesにアクセス
  const difficultyLevel = await getDifficultyLevel();
  return _getCachedBillById(id, difficultyLevel);
}

const _getCachedBillById = unstable_cache(
  async (
    id: string,
    difficultyLevel: DifficultyLevelEnum
  ): Promise<BillWithContent | null> => {
    // 基本的なbill情報、会派見解、コンテンツ、タグを並列取得
    // 公開ステータスの議案のみを取得
    const [bill, factionStancesResult, billContent, tagsResult] =
      await Promise.all([
        findPublishedBillById(id),
        findMiraiStanceByBillId(id),
        getBillContentWithDifficulty(id, difficultyLevel),
        findTagsByBillId(id),
      ]);

    if (!bill) {
      console.error("Failed to fetch bill");
      return null;
    }

    const billTags = tagsResult;

    // 川崎版は会派見解なし（mirai_stancesは議会全体のスタンス）
    const factionStances: FactionStance[] = [];

    // タグデータを整形
    const tags =
      billTags
        ?.map((bt) => bt.tags)
        .filter((tag): tag is { id: string; label: string } => tag !== null) ||
      [];

    return {
      ...bill,
      faction_stances: factionStances.length > 0 ? factionStances : undefined,
      bill_content: billContent || undefined,
      tags,
    };
  },
  ["bill-by-id"],
  {
    revalidate: 600, // 10分（600秒）
    tags: [CACHE_TAGS.BILLS],
  }
);
