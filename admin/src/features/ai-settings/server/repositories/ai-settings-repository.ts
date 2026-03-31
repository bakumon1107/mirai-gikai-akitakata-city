import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";

export type AiSettingRow = {
  feature_id: string;
  model: string;
  updated_at: string;
};

export async function getAllAiSettings(): Promise<AiSettingRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ai_settings")
    .select("feature_id, model, updated_at")
    .order("feature_id");

  if (error) {
    console.error("Failed to fetch ai_settings:", error);
    return [];
  }

  return (data ?? []) as AiSettingRow[];
}

export async function updateAiSettingModel(
  featureId: string,
  model: string
): Promise<{ error: string | null }> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("ai_settings")
    .upsert({ feature_id: featureId, model }, { onConflict: "feature_id" });

  if (error) {
    console.error("Failed to update ai_setting:", error);
    return { error: error.message };
  }

  return { error: null };
}
