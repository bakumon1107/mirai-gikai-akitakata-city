"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@mirai-gikai/supabase";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { invalidateWebCache } from "@/lib/utils/cache-invalidation";
import { routes } from "@/lib/routes";
import type { UpdateFactionInput } from "../../shared/types";

export async function updateFaction(input: UpdateFactionInput) {
  try {
    await requireAdmin();

    const supabase = createAdminClient();

    if (!input.name || input.name.trim().length === 0) {
      return { error: "識別名を入力してください" };
    }

    if (!input.display_name || input.display_name.trim().length === 0) {
      return { error: "表示名を入力してください" };
    }

    const { data, error } = await supabase
      .from("factions")
      .update({
        name: input.name.trim(),
        display_name: input.display_name.trim(),
        alternative_names: input.alternative_names,
        logo_url: input.logo_url || null,
        sort_order: input.sort_order,
        is_active: input.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return { error: "この識別名は既に存在します" };
      }
      if (error.code === "PGRST116") {
        return { error: "会派が見つかりません" };
      }
      return { error: `会派の更新に失敗しました: ${error.message}` };
    }

    revalidatePath(routes.factions());
    await invalidateWebCache();

    return { data };
  } catch (error) {
    console.error("Update faction error:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "会派の更新中にエラーが発生しました" };
  }
}
