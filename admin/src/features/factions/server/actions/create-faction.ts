"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@mirai-gikai/supabase";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { invalidateWebCache } from "@/lib/utils/cache-invalidation";
import { routes } from "@/lib/routes";
import type { CreateFactionInput } from "../../shared/types";

export async function createFaction(input: CreateFactionInput) {
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
      .insert({
        name: input.name.trim(),
        display_name: input.display_name.trim(),
        alternative_names: input.alternative_names,
        logo_url: input.logo_url || null,
        sort_order: input.sort_order,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return { error: "この識別名は既に存在します" };
      }
      return { error: `会派の作成に失敗しました: ${error.message}` };
    }

    revalidatePath(routes.factions());
    await invalidateWebCache();

    return { data };
  } catch (error) {
    console.error("Create faction error:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "会派の作成中にエラーが発生しました" };
  }
}
