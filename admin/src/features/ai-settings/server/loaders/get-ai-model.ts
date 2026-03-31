import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";

/**
 * 指定機能のAIモデルをDBから取得する。
 * 未設定の場合は fallback を返す。
 */
export async function getAiModel(
  featureId: string,
  fallback: string
): Promise<string> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("ai_settings")
    .select("model")
    .eq("feature_id", featureId)
    .single();

  return data?.model ?? fallback;
}
