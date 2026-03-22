import { unstable_cache } from "next/cache";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { getActiveCouncilSession } from "@/features/council-sessions/server/loaders/get-active-council-session";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { ComingSoonBill } from "../../shared/types";
import {
  findComingSoonBills,
  findTagsByBillIds,
} from "../repositories/bill-repository";

/**
 * Coming Soon議案を取得する
 * publish_status = 'coming_soon' でアクティブな定例会の議案を取得
 * アクティブな定例会がない場合は全件取得
 */
export async function getComingSoonBills(): Promise<ComingSoonBill[]> {
  // キャッシュ外でcookiesにアクセス
  const difficultyLevel = await getDifficultyLevel();
  const activeSession = await getActiveCouncilSession();

  return _getCachedComingSoonBills(difficultyLevel, activeSession?.id ?? null);
}

const _getCachedComingSoonBills = unstable_cache(
  async (
    difficultyLevel: DifficultyLevelEnum,
    councilSessionId: string | null
  ): Promise<ComingSoonBill[]> => {
    const data = await findComingSoonBills(councilSessionId);
    if (data.length === 0) {
      return [];
    }

    // タグ情報を一括取得
    const billIds = data.map((bill) => bill.id);
    const tagsByBillId = await findTagsByBillIds(billIds);

    // bill_contentsからtitleを抽出（ユーザーの難易度設定を使用）
    return data.map((bill) => {
      const contents = bill.bill_contents as Array<{
        title: string;
        difficulty_level: string;
      }> | null;

      // ユーザーが選択した難易度のコンテンツを優先
      const preferredContent = contents?.find(
        (c) => c.difficulty_level === difficultyLevel
      );
      // フォールバック: normalを優先、それもなければ任意のコンテンツ
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
  ["coming-soon-bills-list"],
  {
    revalidate: 600, // 10分（600秒）
    tags: [CACHE_TAGS.BILLS],
  }
);
