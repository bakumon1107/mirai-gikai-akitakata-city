"use server";

import type { Database } from "@mirai-gikai/supabase";
import { createAdminClient } from "@mirai-gikai/supabase";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { routes } from "@/lib/routes";

type ScalarUpdate = {
  name: string;
  status: Database["public"]["Enums"]["bill_status_enum"];
  status_note: string | null;
  publish_status: Database["public"]["Enums"]["bill_publish_status"];
  published_at: string | null;
  thumbnail_url: string | null;
  share_thumbnail_url: string | null;
  is_featured: boolean;
  committee_id: string | null;
  council_session_id: string | null;
};

type MergeBillsInput = {
  // 残すbill ID（このレコードが生き残る）
  keepBillId: string;
  // 削除するbill ID一覧
  deleteBillIds: string[];
  // 保持するスカラーフィールドの値
  billUpdate: ScalarUpdate;
  // 難易度ごとに保持するコンテンツID（どのbillのものでも可）
  contentSelections: Array<{ contentId: string; difficultyLevel: string }>;
  // 会派ごとに保持する会派見解ID（どのbillのものでも可）
  stanceSelections: Array<{ stanceId: string; factionId: string }>;
};

type MergeResult = {
  success: boolean;
  mergedCount: number;
  warnings: string[];
  error?: string;
};

export async function mergeBills(input: MergeBillsInput): Promise<MergeResult> {
  try {
    await requireAdmin();

    const supabase = createAdminClient();
    const warnings: string[] = [];
    const allBillIds = [input.keepBillId, ...input.deleteBillIds];

    // 1. スカラーフィールドを更新
    const { error: updateError } = await supabase
      .from("bills")
      .update({ ...input.billUpdate, updated_at: new Date().toISOString() })
      .eq("id", input.keepBillId);
    if (updateError)
      throw new Error(`フィールド更新に失敗: ${updateError.message}`);

    // 2. bill_contents の処理（2パスで実行）
    const { data: allContents } = await supabase
      .from("bill_contents")
      .select("id, bill_id, difficulty_level")
      .in("bill_id", allBillIds);

    const selectedContentIds = new Set(
      input.contentSelections.map((s) => s.contentId)
    );

    // Pass 1: 非選択コンテンツを削除（keepBillId側の競合を先に解消）
    for (const content of allContents ?? []) {
      if (!selectedContentIds.has(content.id)) {
        const { error } = await supabase
          .from("bill_contents")
          .delete()
          .eq("id", content.id);
        if (error)
          warnings.push(
            `コンテンツ削除に失敗(${content.difficulty_level}): ${error.message}`
          );
      }
    }

    // Pass 2: 選択コンテンツを keepBillId に移動
    for (const content of allContents ?? []) {
      if (
        selectedContentIds.has(content.id) &&
        content.bill_id !== input.keepBillId
      ) {
        const { error } = await supabase
          .from("bill_contents")
          .update({ bill_id: input.keepBillId })
          .eq("id", content.id);
        if (error)
          warnings.push(
            `コンテンツ移行に失敗(${content.difficulty_level}): ${error.message}`
          );
      }
    }

    // 3. faction_stances の処理（2パスで実行）
    const { data: allStances } = await supabase
      .from("faction_stances")
      .select("id, bill_id, faction_id")
      .in("bill_id", allBillIds);

    const selectedStanceIds = new Set(
      input.stanceSelections.map((s) => s.stanceId)
    );

    // Pass 1: 非選択スタンスを削除
    for (const stance of allStances ?? []) {
      if (!selectedStanceIds.has(stance.id)) {
        const { error } = await supabase
          .from("faction_stances")
          .delete()
          .eq("id", stance.id);
        if (error) warnings.push(`会派見解削除に失敗: ${error.message}`);
      }
    }

    // Pass 2: 選択スタンスを keepBillId に移動
    for (const stance of allStances ?? []) {
      if (
        selectedStanceIds.has(stance.id) &&
        stance.bill_id !== input.keepBillId
      ) {
        const { error } = await supabase
          .from("faction_stances")
          .update({ bill_id: input.keepBillId })
          .eq("id", stance.id);
        if (error) warnings.push(`会派見解移行に失敗: ${error.message}`);
      }
    }

    // 4. タグはすべてのbillの和集合を keepBillId に設定
    const { data: existingTags } = await supabase
      .from("bills_tags")
      .select("tag_id")
      .eq("bill_id", input.keepBillId);
    const existingTagIds = new Set((existingTags ?? []).map((t) => t.tag_id));

    for (const deleteBillId of input.deleteBillIds) {
      const { data: dupTags } = await supabase
        .from("bills_tags")
        .select("tag_id")
        .eq("bill_id", deleteBillId);
      for (const tag of dupTags ?? []) {
        if (!existingTagIds.has(tag.tag_id)) {
          await supabase
            .from("bills_tags")
            .insert({ bill_id: input.keepBillId, tag_id: tag.tag_id });
          existingTagIds.add(tag.tag_id);
        }
      }
    }

    // 5. 重複議案を削除（ON DELETE CASCADE で残関連データも自動削除）
    const { error: deleteError } = await supabase
      .from("bills")
      .delete()
      .in("id", input.deleteBillIds);
    if (deleteError)
      throw new Error(`重複議案の削除に失敗: ${deleteError.message}`);

    revalidatePath(routes.bills());
    revalidatePath(routes.billMerge());

    return { success: true, mergedCount: input.deleteBillIds.length, warnings };
  } catch (error) {
    console.error("Merge bills error:", error);
    return {
      success: false,
      mergedCount: 0,
      warnings: [],
      error:
        error instanceof Error ? error.message : "統合中にエラーが発生しました",
    };
  }
}
