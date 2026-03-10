"use server";

import { createAdminClient } from "@mirai-gikai/supabase";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";

type MergeBillsInput = {
  primaryId: string;
  duplicateIds: string[];
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
    let mergedCount = 0;

    // Fetch primary bill's existing difficulty levels and faction ids
    const [
      { data: primaryContents },
      { data: primaryStances },
      { data: primaryTags },
    ] = await Promise.all([
      supabase
        .from("bill_contents")
        .select("difficulty_level")
        .eq("bill_id", input.primaryId),
      supabase
        .from("faction_stances")
        .select("faction_id")
        .eq("bill_id", input.primaryId),
      supabase
        .from("bills_tags")
        .select("tag_id")
        .eq("bill_id", input.primaryId),
    ]);

    const primaryDifficultyLevels = new Set(
      (primaryContents ?? []).map((c) => c.difficulty_level)
    );
    const primaryFactionIds = new Set(
      (primaryStances ?? []).map((s) => s.faction_id)
    );
    const primaryTagIds = new Set((primaryTags ?? []).map((t) => t.tag_id));

    for (const dupId of input.duplicateIds) {
      // Move bill_contents not already in primary
      const { data: dupContents } = await supabase
        .from("bill_contents")
        .select("id, difficulty_level")
        .eq("bill_id", dupId);

      for (const content of dupContents ?? []) {
        if (!primaryDifficultyLevels.has(content.difficulty_level)) {
          const { error } = await supabase
            .from("bill_contents")
            .update({ bill_id: input.primaryId })
            .eq("id", content.id);

          if (error) {
            warnings.push(
              `コンテンツ(${content.difficulty_level})の移行に失敗: ${error.message}`
            );
          } else {
            primaryDifficultyLevels.add(content.difficulty_level);
          }
        }
      }

      // Move faction_stances not already in primary
      const { data: dupStances } = await supabase
        .from("faction_stances")
        .select("id, faction_id")
        .eq("bill_id", dupId);

      for (const stance of dupStances ?? []) {
        if (!primaryFactionIds.has(stance.faction_id)) {
          const { error } = await supabase
            .from("faction_stances")
            .update({ bill_id: input.primaryId })
            .eq("id", stance.id);

          if (error) {
            warnings.push(`会派スタンスの移行に失敗: ${error.message}`);
          } else {
            primaryFactionIds.add(stance.faction_id);
          }
        }
      }

      // Move bills_tags not already in primary
      // bills_tags has composite PK (bill_id, tag_id), so INSERT + DELETE
      const { data: dupTags } = await supabase
        .from("bills_tags")
        .select("tag_id")
        .eq("bill_id", dupId);

      for (const tag of dupTags ?? []) {
        if (!primaryTagIds.has(tag.tag_id)) {
          const { error } = await supabase
            .from("bills_tags")
            .insert({ bill_id: input.primaryId, tag_id: tag.tag_id });

          if (error) {
            warnings.push(`タグの移行に失敗: ${error.message}`);
          } else {
            primaryTagIds.add(tag.tag_id);
          }
        }
      }

      // Delete duplicate bill (ON DELETE CASCADE handles remaining relations)
      const { error: deleteError } = await supabase
        .from("bills")
        .delete()
        .eq("id", dupId);

      if (deleteError) {
        warnings.push(`議案(${dupId})の削除に失敗: ${deleteError.message}`);
      } else {
        mergedCount++;
      }
    }

    revalidatePath("/bills");
    revalidatePath("/bills/merge");

    return { success: true, mergedCount, warnings };
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
