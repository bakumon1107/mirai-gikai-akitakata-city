import { unstable_cache } from "next/cache";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { BillWithContent, FactionStance } from "../../shared/types";
import {
  findFactionStancesByBillId,
  findPublishedBillById,
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
    const [bill, factionStancesRaw, billContent, tagsResult] =
      await Promise.all([
        findPublishedBillById(id),
        findFactionStancesByBillId(id),
        getBillContentWithDifficulty(id, difficultyLevel),
        findTagsByBillId(id),
      ]);

    if (!bill) {
      console.error("Failed to fetch bill");
      return null;
    }

    const billTags = tagsResult;

    const factionStances: FactionStance[] = factionStancesRaw
      .filter(
        (
          fs
        ): fs is typeof fs & {
          factions: NonNullable<(typeof fs)["factions"]>;
        } => fs.factions !== null
      )
      .map((fs) => ({
        id: fs.id,
        stance: fs.type,
        comment: fs.comment,
        faction: {
          id: fs.factions.id,
          name: fs.factions.name,
          display_name: fs.factions.display_name,
          sort_order: fs.factions.sort_order,
        },
      }))
      .sort((a, b) => a.faction.sort_order - b.faction.sort_order);

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
