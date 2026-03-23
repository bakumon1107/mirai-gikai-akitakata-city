"use server";

// TODO: 本番Supabaseへの反映
// 現状はローカルSupabase（.envのSUPABASE_URL）に適用しています。
// 本番反映時は以下のいずれかを検討:
// 1. 本番Supabaseの環境変数（SUPABASE_PROD_URL等）を用意してcreateAdminClient()を切り替え
// 2. supabase db push / migration でデータを移行
// 3. Supabase CLIの --db-url オプションで本番DBに直接接続

import { createAdminClient } from "@mirai-gikai/supabase";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { invalidateWebCache } from "@/lib/utils/cache-invalidation";
import { routes } from "@/lib/routes";
import { loadRun } from "../utils/storage";
import {
  findFactionByName,
  type FactionRecord,
} from "../utils/faction-matching";
import type { BillFieldOverride, DraftBill } from "../../shared/types";

type ApplyDraftsInput = {
  runId: string;
  newBillIds: string[];
  existingBillOverrides: BillFieldOverride[];
};

type ApplyResult = {
  success: boolean;
  appliedCount: number;
  warnings: string[];
  error?: string;
};

export async function applyDrafts(
  input: ApplyDraftsInput
): Promise<ApplyResult> {
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

    if (run.status !== "completed") {
      return {
        success: false,
        appliedCount: 0,
        warnings: [],
        error: "収集が完了していません",
      };
    }

    const supabase = createAdminClient();
    const warnings: string[] = [];
    let appliedCount = 0;

    // 全会派を一括取得（display_name・alternative_names でマッチングするため）
    const { data: allFactions } = await supabase
      .from("factions")
      .select("id, display_name, alternative_names");
    const factions: FactionRecord[] = allFactions ?? [];

    // Map from DraftBill.id to inserted/existing bill_id
    const billIdMap = new Map<string, string>();

    // --- Insert new bills ---
    const newBills = run.bills.filter((b) => input.newBillIds.includes(b.id));

    for (const draft of newBills) {
      const { data: inserted, error: billError } = await supabase
        .from("bills")
        .insert({
          name: draft.title,
          bill_number: draft.billNumber ?? "",
          status: mapBillStatus(draft.status),
          status_note: draft.statusNote || null,
          published_at: run.startDate,
          is_featured: false,
          publish_status: "draft",
        })
        .select("id")
        .single();

      if (billError) {
        warnings.push(
          `議案「${draft.title}」の挿入に失敗: ${billError.message}`
        );
        continue;
      }

      const billId = inserted.id;

      const contentRows = (["normal", "hard"] as const).map((level) => ({
        bill_id: billId,
        difficulty_level: level,
        title: draft.title,
        summary: draft.summary.slice(0, 500),
        content: draft.summary,
      }));

      const { error: contentsError } = await supabase
        .from("bill_contents")
        .insert(contentRows);

      if (contentsError) {
        warnings.push(
          `議案「${draft.title}」のコンテンツ挿入に失敗: ${contentsError.message}`
        );
      }

      billIdMap.set(draft.id, billId);
      appliedCount++;
    }

    // --- Update existing bills with field-level overrides ---
    for (const override of input.existingBillOverrides) {
      const draft = run.bills.find((b) => b.id === override.draftBillId);
      if (!draft) continue;

      const hasAnyUpdate =
        override.updateStatus ||
        override.updateContents ||
        override.stanceUpdates.some((s) => s.update);

      if (!hasAnyUpdate) continue;

      const { data: existing } = await supabase
        .from("bills")
        .select("id")
        .eq("bill_number", draft.billNumber ?? "")
        .maybeSingle();

      if (!existing) {
        warnings.push(`議案「${draft.title}」が見つかりません`);
        continue;
      }

      const billId = existing.id;
      let updated = false;

      if (override.updateStatus) {
        const { error: updateError } = await supabase
          .from("bills")
          .update({
            status: mapBillStatus(draft.status),
            status_note: draft.statusNote || null,
          })
          .eq("id", billId);

        if (updateError) {
          warnings.push(
            `議案「${draft.title}」のステータス更新に失敗: ${updateError.message}`
          );
        } else {
          updated = true;
        }
      }

      if (override.updateContents) {
        for (const level of ["normal", "hard"] as const) {
          const { error: upsertError } = await supabase
            .from("bill_contents")
            .upsert(
              {
                bill_id: billId,
                difficulty_level: level,
                title: draft.title,
                summary: draft.summary.slice(0, 500),
                content: draft.summary,
              },
              { onConflict: "bill_id,difficulty_level" }
            );

          if (upsertError) {
            warnings.push(
              `議案「${draft.title}」(${level})のコンテンツ更新に失敗: ${upsertError.message}`
            );
          } else {
            updated = true;
          }
        }
      }

      // Stance updates
      const stancesToUpdate = override.stanceUpdates.filter((s) => s.update);
      const draftStances = run.factionStances.filter(
        (s) => s.billTitle === draft.title
      );

      for (const stanceOverride of stancesToUpdate) {
        const draftStance = draftStances.find(
          (s) => s.factionName === stanceOverride.factionName
        );
        if (!draftStance) continue;

        if (draftStance.stanceType === "absent") {
          warnings.push(
            `会派「${draftStance.factionName}」の「${draft.title}」への欠席は適用をスキップしました`
          );
          continue;
        }

        const faction = findFactionByName(factions, stanceOverride.factionName);

        if (!faction) {
          warnings.push(
            `会派「${stanceOverride.factionName}」が見つかりません。スキップしました。`
          );
          continue;
        }

        const { error: stanceError } = await supabase
          .from("faction_stances")
          .upsert(
            {
              bill_id: billId,
              faction_id: faction.id,
              type: draftStance.stanceType as "for" | "against" | "neutral",
              comment: draftStance.comment || null,
            },
            { onConflict: "bill_id,faction_id" }
          );

        if (stanceError) {
          warnings.push(
            `会派「${stanceOverride.factionName}」のスタンス更新に失敗: ${stanceError.message}`
          );
        } else {
          updated = true;
        }
      }

      if (updated) {
        billIdMap.set(draft.id, billId);
        appliedCount++;
      }
    }

    // Apply faction stances for NEW bills only
    const newInsertedTitles = input.newBillIds
      .map((id) => run.bills.find((b) => b.id === id))
      .filter(
        (b): b is NonNullable<typeof b> => b != null && billIdMap.has(b.id)
      )
      .map((b) => b.title);

    const relatedStances = run.factionStances.filter((s) =>
      newInsertedTitles.includes(s.billTitle)
    );

    for (const stance of relatedStances) {
      if (stance.stanceType === "absent") {
        warnings.push(
          `会派「${stance.factionName}」の「${stance.billTitle}」への欠席は適用をスキップしました`
        );
        continue;
      }

      const matchedBill = run.bills.find((b) => b.title === stance.billTitle);
      if (!matchedBill) continue;
      const billId = billIdMap.get(matchedBill.id);
      if (!billId) continue;

      const faction = findFactionByName(factions, stance.factionName);

      if (!faction) {
        warnings.push(
          `会派「${stance.factionName}」が見つかりません。スキップしました。`
        );
        continue;
      }

      const { error: stanceError } = await supabase
        .from("faction_stances")
        .upsert(
          {
            bill_id: billId,
            faction_id: faction.id,
            type: stance.stanceType as "for" | "against" | "neutral",
            comment: stance.comment || null,
          },
          { onConflict: "bill_id,faction_id" }
        );

      if (stanceError) {
        warnings.push(
          `会派「${stance.factionName}」のスタンス挿入に失敗: ${stanceError.message}`
        );
      }
    }

    revalidatePath(routes.bills());
    await invalidateWebCache();

    return { success: true, appliedCount, warnings };
  } catch (error) {
    console.error("Apply drafts error:", error);
    return {
      success: false,
      appliedCount: 0,
      warnings: [],
      error:
        error instanceof Error ? error.message : "適用中にエラーが発生しました",
    };
  }
}

function mapBillStatus(
  status: DraftBill["status"]
): "submitted" | "in_committee" | "plenary_session" | "approved" | "rejected" {
  // 採択・趣旨採択は可決（approved）として扱う（詳細はstatus_noteに記録）
  if (status === "adopted" || status === "partially_adopted") {
    return "approved";
  }
  return status;
}
