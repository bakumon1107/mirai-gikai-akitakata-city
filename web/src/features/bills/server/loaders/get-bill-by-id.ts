import { createAdminClient } from "@mirai-gikai/supabase";
import { unstable_cache } from "next/cache";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { BillWithContent, FactionStance } from "../../shared/types";
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
    const supabase = createAdminClient();

    // 基本的なbill情報、会派見解、コンテンツ、タグを並列取得
    // 公開ステータスの議案のみを取得
    const [billResult, factionStancesResult, billContent, tagsResult] =
      await Promise.all([
        supabase
          .from("bills")
          .select("*")
          .eq("id", id)
          .eq("publish_status", "published") // 公開済み議案のみ
          .single(),
        supabase
          .from("faction_stances")
          .select(
            "id, type, comment, faction_id, factions(id, name, display_name, sort_order)"
          )
          .eq("bill_id", id),
        getBillContentWithDifficulty(id, difficultyLevel),
        supabase.from("bills_tags").select("tags(id, label)").eq("bill_id", id),
      ]);

    const { data: bill, error: billError } = billResult;
    if (billError || !bill) {
      console.error("Failed to fetch bill:", billError);
      return null;
    }

    const { data: stancesData } = factionStancesResult;
    const { data: billTags } = tagsResult;

    // 会派見解データを整形（sort_order順）
    const factionStances: FactionStance[] = (stancesData ?? [])
      .map((s) => ({
        id: s.id,
        stance: s.type,
        comment: s.comment ?? null,
        faction: s.factions as unknown as {
          id: string;
          name: string;
          display_name: string;
          sort_order: number;
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
