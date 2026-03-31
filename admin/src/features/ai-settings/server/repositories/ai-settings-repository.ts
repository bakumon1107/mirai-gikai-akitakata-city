import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";

export type AiSettingRow = {
  feature_id: string;
  model: string;
  updated_at: string;
};

/**
 * ai_settings テーブルの型は supabase.types.ts に未反映。
 * マイグレーション適用後に `pnpm db:types:gen` で型を再生成すること。
 * それまでは型アサーションで回避する。
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromAiSettings(supabase: ReturnType<typeof createAdminClient>) {
  // biome-ignore lint/suspicious/noExplicitAny: ai_settings 型未生成のため
  return (supabase as any).from("ai_settings");
}

export async function getAllAiSettings(): Promise<AiSettingRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await fromAiSettings(supabase)
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
  const { error } = await fromAiSettings(supabase).upsert(
    { feature_id: featureId, model },
    { onConflict: "feature_id" }
  );

  if (error) {
    console.error("Failed to update ai_setting:", error);
    return { error: error.message };
  }

  return { error: null };
}
