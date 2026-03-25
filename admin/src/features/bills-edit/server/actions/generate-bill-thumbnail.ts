"use server";

import "server-only";

import OpenAI from "openai";
import { createAdminClient } from "@mirai-gikai/supabase";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { buildThumbnailPrompt } from "../../shared/utils/build-thumbnail-prompt";

export type GenerateThumbnailResult =
  | { success: true; thumbnailUrl: string }
  | { success: false; error: string };

/** 画像生成のインターフェース（テスト時にFake実装に差し替え可能） */
export interface ImageGenerator {
  generate(prompt: string): Promise<{ url: string } | null>;
}

/** OpenAI DALL-E 3 を使ったデフォルト実装 */
function createDalleGenerator(apiKey: string): ImageGenerator {
  const openai = new OpenAI({ apiKey });
  return {
    async generate(prompt: string) {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1792x1024",
        quality: "standard",
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

    const generator =
      deps?.imageGenerator ?? createDalleGenerator(apiKey as string);

    // 1. 画像生成
    const prompt = buildThumbnailPrompt(billName);
    const result = await generator.generate(prompt);
    if (!result) {
      return {
        success: false,
        error: "画像の生成に失敗しました",
      };
    }

    // 2. 生成画像をfetchしてバイナリ取得
    const imageResponse = await fetch(result.url);
    if (!imageResponse.ok) {
      return {
        success: false,
        error: "生成された画像のダウンロードに失敗しました",
      };
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // 3. Supabase Storageにアップロード
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
