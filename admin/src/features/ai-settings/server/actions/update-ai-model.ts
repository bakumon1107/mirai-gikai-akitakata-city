"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { routes } from "@/lib/routes";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import { CONFIGURABLE_FEATURE_IDS } from "../../shared/ai-feature-models";
import { isValidAiModel } from "../../shared/ai-model-options";
import { updateAiSettingModel } from "../repositories/ai-settings-repository";

export async function updateAiModel(featureId: string, model: string) {
  try {
    await requireAdmin();

    if (!CONFIGURABLE_FEATURE_IDS.includes(featureId)) {
      return { error: "この機能のモデルは変更できません" };
    }

    if (!isValidAiModel(model)) {
      return { error: "無効なモデルが選択されました" };
    }

    const result = await updateAiSettingModel(featureId, model);
    if (result.error) {
      return { error: `保存に失敗しました: ${result.error}` };
    }

    revalidatePath(routes.aiSettings());
    return { success: true };
  } catch (error) {
    console.error("Update AI model error:", error);
    return {
      error: getErrorMessage(error, "AIモデルの更新中にエラーが発生しました"),
    };
  }
}
