"use server";

import "server-only";

import OpenAI from "openai";
import { createAdminClient } from "@mirai-gikai/supabase";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { findBillContentsByBillId } from "../repositories/bill-edit-repository";
import { buildThumbnailPrompt } from "../../shared/utils/build-thumbnail-prompt";

export type GenerateThumbnailResult =
  | { success: true; thumbnailUrl: string }
  | { success: false; error: string };

/** 画像生成のインターフェース（テスト時にFake実装に差し替え可能） */
export interface ImageGenerator {
  generate(prompt: string): Promise<{ url: string } | null>;
}

type DalleModel = "dall-e-2" | "dall-e-3";

/** モデルに応じた画像サイズを返す */
function getImageSize(model: DalleModel): "1792x1024" | "1024x1024" {
  // DALL-E 2 は 1792x1024 に対応していないため 1024x1024 を使用
  return model === "dall-e-2" ? "1024x1024" : "1792x1024";
}

/** OpenAI DALL-E を使ったデフォルト実装 */
function createDalleGenerator(
  apiKey: string,
  model: DalleModel
): ImageGenerator {
  const openai = new OpenAI({ apiKey });
  return {
    async generate(prompt: string) {
      const response = await openai.images.generate({
        model,
        prompt,
        n: 1,
        size: getImageSize(model),
        // DALL-E 2 は quality パラメータに対応していない
        ...(model === "dall-e-3" ? { quality: "standard" } : {}),
      });
      const url = response.data?.[0]?.url;
      return url ? { url } : null;
    },
  };
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateBillThumbnail(
  billId: string,
  billName: string,
  deps?: { imageGenerator?: ImageGenerator }
): Promise<GenerateThumbnailResult> {
  try {
    await requireAdmin();

    // billIdのバリデーション（"new" またはUUID形式のみ許可）
    if (billId !== "new" && !UUID_PATTERN.test(billId)) {
      return { success: false, error: "無効な議案IDです" };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey && !deps?.imageGenerator) {
      return {
        success: false,
        error: "OPENAI_API_KEY が設定されていません",
      };
    }

    const dalleModel: DalleModel =
      process.env.DALLE_MODEL === "dall-e-2" ? "dall-e-2" : "dall-e-3";
    const generator =
      deps?.imageGenerator ??
      createDalleGenerator(apiKey as string, dalleModel);

    // 1. 議案コンテンツ（ふつう）を取得してプロンプトに含める
    // DALL-E 2はプロンプト上限1000文字のため要約を使用、
    // DALL-E 3は4000文字まで使えるので内容を使用
    let billContext: string | undefined;
    if (billId !== "new") {
      try {
        const contents = await findBillContentsByBillId(billId);
        const normalEntry = contents.find(
          (c) => c.difficulty_level === "normal"
        );
        if (normalEntry) {
          billContext =
            dalleModel === "dall-e-2"
              ? normalEntry.summary || undefined
              : normalEntry.content || undefined;
        }
      } catch {
        // コンテンツ取得失敗時はタイトルのみで生成
      }
    }

    // 2. 画像生成
    const maxPromptLength = dalleModel === "dall-e-2" ? 1000 : 4000;
    const prompt = buildThumbnailPrompt(billName, billContext, maxPromptLength);
    const result = await generator.generate(prompt);
    if (!result) {
      return {
        success: false,
        error: "画像の生成に失敗しました",
      };
    }

    // 3. 生成画像をfetchしてバイナリ取得
    const imageResponse = await fetch(result.url);
    if (!imageResponse.ok) {
      return {
        success: false,
        error: "生成された画像のダウンロードに失敗しました",
      };
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // 4. Supabase Storageにアップロード
    const supabase = createAdminClient();
    const fileName = `ai_${billId}_${Date.now()}.png`;

    const { data, error } = await supabase.storage
      .from("bill-thumbnails")
      .upload(fileName, imageBuffer, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return {
        success: false,
        error: "画像のアップロードに失敗しました",
      };
    }

    const { data: urlData } = supabase.storage
      .from("bill-thumbnails")
      .getPublicUrl(data.path);

    return { success: true, thumbnailUrl: urlData.publicUrl };
  } catch (error) {
    console.error("Generate thumbnail error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "画像生成中にエラーが発生しました",
    };
  }
}
