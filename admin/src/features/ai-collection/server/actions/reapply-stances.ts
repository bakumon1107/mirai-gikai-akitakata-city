"use server";

import { createAdminClient } from "@mirai-gikai/supabase";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { invalidateWebCache } from "@/lib/utils/cache-invalidation";
import { routes } from "@/lib/routes";
import { loadRun } from "../utils/storage";
import { findFactionByName } from "../utils/faction-matching";

type ReapplyStancesInput = {
  runId: string;
  /** 再取り込みする DraftFactionStance.id のリスト */
  stanceIds: string[];
};

type ReapplyResult = {
  success: boolean;
  appliedCount: number;
  warnings: string[];
  error?: string;
};

/**
 * 指定した会派見解を再取り込みする。
 * 既にDBに存在する場合は上書き（upsert）する。
 * 対象の議案・会派はDBから名前で検索する。
 */
export async function reapplyStances(
  input: ReapplyStancesInput
): Promise<ReapplyResult> {
  try {
    await requireAdmin();

    const run = await loadRun(input.runId);
    if (!run) {
      return {
        success: false,
        appliedCount: 0,
        warnings: [],
        error: "収集ランが見つかりません",
      };
    }

    const targetStances = run.factionStances.filter((s) =>
      input.stanceIds.includes(s.id)
    );

    if (targetStances.length === 0) {
      return {
        success: true,
        appliedCount: 0,
        warnings: ["取り込み対象の会派見解がありません"],
      };
    }

    const supabase = createAdminClient();
    const warnings: string[] = [];
    let appliedCount = 0;

    // 全会派を一括取得
    const { data: allFactions } = await supabase
      .from("factions")
      .select("id, display_name, alternative_names");
    const factions = allFactions ?? [];

    for (const stance of targetStances) {
      if (stance.stanceType === "absent") {
        warnings.push(
          `会派「${stance.factionName}」の「${stance.billTitle}」への欠席は適用をスキップしました`
        );
        continue;
      }

      // 議案をDBから検索
      const { data: bill } = await supabase
        .from("bills")
        .select("id")
        .eq("name", stance.billTitle)
        .maybeSingle();

      if (!bill) {
        warnings.push(
          `議案「${stance.billTitle}」がDBに見つかりません。スキップしました。`
        );
        continue;
      }

      // 会派をマッチング
      const faction = findFactionByName(factions, stance.factionName);
      if (!faction) {
        warnings.push(
          `会派「${stance.factionName}」が見つかりません。別名を設定してから再度お試しください。`
        );
        continue;
      }

      const { error: stanceError } = await supabase
        .from("faction_stances")
        .upsert(
          {
            bill_id: bill.id,
            faction_id: faction.id,
            type: stance.stanceType as "for" | "against" | "neutral",
            comment: stance.comment || null,
          },
          { onConflict: "bill_id,faction_id" }
        );

      if (stanceError) {
        warnings.push(
          `会派「${stance.factionName}」のスタンス取り込みに失敗: ${stanceError.message}`
        );
      } else {
        appliedCount++;
      }
    }

    revalidatePath(routes.bills());
    await invalidateWebCache();

    return { success: true, appliedCount, warnings };
  } catch (error) {
    console.error("Reapply stances error:", error);
    return {
      success: false,
      appliedCount: 0,
      warnings: [],
      error:
        error instanceof Error
          ? error.message
          : "再取り込み中にエラーが発生しました",
    };
  }
}
