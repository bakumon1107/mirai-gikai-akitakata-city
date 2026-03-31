"use server";

import "server-only";

import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { createAdminClient } from "@mirai-gikai/supabase";
import { getAiModel } from "@/features/ai-settings/server/loaders/get-ai-model";
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

/** OpenAI画像生成モデルの種別 */
type OpenAiImageModel = "dall-e-2" | "dall-e-3" | "gpt-image-1";

/** モデルごとの設定 */
type ImageModelConfig = {
  size: string;
  maxPromptLength: number;
  quality?: string;
  useSummaryForContext: boolean;
};

function getImageModelConfig(model: OpenAiImageModel): ImageModelConfig {
  switch (model) {
    case "dall-e-2":
      return {
        size: "1024x1024",
        maxPromptLength: 1000,
        useSummaryForContext: true,
      };
    case "dall-e-3":
      return {
        size: "1792x1024",
        maxPromptLength: 4000,
        quality: "standard",
        useSummaryForContext: false,
      };
    case "gpt-image-1":
      return {
        size: "1536x1024",
        maxPromptLength: 4000,
        quality: "medium",
        useSummaryForContext: false,
      };
  }
}

/** OpenAI 画像生成の実装 */
function createOpenAiImageGenerator(
  apiKey: string,
  model: OpenAiImageModel
): ImageGenerator {
  const openai = new OpenAI({ apiKey });
  const config = getImageModelConfig(model);

  return {
    async generate(prompt: string) {
      const response = await openai.images.generate({
        model,
        prompt,
        n: 1,
        size: config.size as "1024x1024" | "1792x1024" | "1536x1024",
        ...(config.quality
          ? { quality: config.quality as "standard" | "medium" }
          : {}),
      });
      const url = response.data?.[0]?.url;
      // gpt-image-1 は url ではなく b64_json を返す場合がある
      if (url) return { url };

      const b64 = response.data?.[0]?.b64_json;
      if (b64) {
        // base64 を data URL に変換（後続のfetchでバイナリ取得可能にする）
        return { url: `data:image/png;base64,${b64}` };
      }
      return null;
    },
  };
}

/**
 * ai_settings のモデルIDからOpenAI画像モデル名を抽出する
 * 例: "openai/dall-e-3" → "dall-e-3"
 */
function parseOpenAiImageModel(modelId: string): OpenAiImageModel | null {
  const modelName = modelId.replace("openai/", "");
  const valid: OpenAiImageModel[] = ["dall-e-2", "dall-e-3", "gpt-image-1"];
  return valid.includes(modelName as OpenAiImageModel)
    ? (modelName as OpenAiImageModel)
    : null;
}

// ─── Google Imagen ───────────────────────────────────────

/** Google Imagen モデルの種別 */
type GoogleImagenModel =
  | "imagen-4-fast"
  | "imagen-4-standard"
  | "imagen-4-ultra";

/** ai_settings のモデルIDからGoogle Imagenモデル名を抽出する */
function parseGoogleImagenModel(modelId: string): GoogleImagenModel | null {
  const modelName = modelId.replace("google/", "");
  const valid: GoogleImagenModel[] = [
    "imagen-4-fast",
    "imagen-4-standard",
    "imagen-4-ultra",
  ];
  return valid.includes(modelName as GoogleImagenModel)
    ? (modelName as GoogleImagenModel)
    : null;
}

/** Google Imagen API のモデルID（API用フルネーム） */
function getImagenApiModelId(model: GoogleImagenModel): string {
  switch (model) {
    case "imagen-4-fast":
      return "imagen-4.0-fast-generate-001";
    case "imagen-4-standard":
      return "imagen-4.0-generate-001";
    case "imagen-4-ultra":
      return "imagen-4.0-ultra-generate-001";
  }
}

/** Google Imagen 画像生成の実装 */
function createGoogleImagenGenerator(
  apiKey: string,
  model: GoogleImagenModel
): ImageGenerator {
  const client = new GoogleGenAI({ apiKey });
  const apiModelId = getImagenApiModelId(model);

  return {
    async generate(prompt: string) {
      const response = await client.models.generateImages({
        model: apiModelId,
        prompt,
        config: {
          numberOfImages: 1,
          aspectRatio: "16:9",
        },
      });

      const imageBytes = response?.generatedImages?.[0]?.image?.imageBytes;
      if (!imageBytes) return null;

      return { url: `data:image/png;base64,${imageBytes}` };
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

    // DB設定からモデルを取得（フォールバック: dall-e-3）
    const modelId = await getAiModel("thumbnail-generation", "openai/dall-e-3");

    const provider = modelId.split("/")[0];

    let generator: ImageGenerator;
    let config: ImageModelConfig;

    if (deps?.imageGenerator) {
      // テスト用のカスタムジェネレーター
      generator = deps.imageGenerator;
      config = getImageModelConfig("dall-e-3"); // テスト時のデフォルト
    } else if (provider === "google") {
      const imagenModel = parseGoogleImagenModel(modelId);
      if (!imagenModel) {
        return {
          success: false,
          error: `不明な画像生成モデルです: ${modelId}`,
        };
      }

      const googleApiKey = process.env.GOOGLE_AI_API_KEY;
      if (!googleApiKey) {
        return {
          success: false,
          error: "GOOGLE_AI_API_KEY が設定されていません",
        };
      }

      generator = createGoogleImagenGenerator(googleApiKey, imagenModel);
      // Google Imagen はプロンプト長の制限が緩いため dall-e-3 相当を使用
      config = {
        size: "16:9",
        maxPromptLength: 4000,
        useSummaryForContext: false,
      };
    } else {
      const openAiModel = parseOpenAiImageModel(modelId);
      if (!openAiModel) {
        return {
          success: false,
          error: `不明な画像生成モデルです: ${modelId}`,
        };
      }

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return {
          success: false,
          error: "OPENAI_API_KEY が設定されていません",
        };
      }

      generator = createOpenAiImageGenerator(apiKey, openAiModel);
      config = getImageModelConfig(openAiModel);
    }

    // 1. 議案コンテンツ（ふつう）を取得してプロンプトに含める
    let billContext: string | undefined;
    if (billId !== "new") {
      try {
        const contents = await findBillContentsByBillId(billId);
        const normalEntry = contents.find(
          (c) => c.difficulty_level === "normal"
        );
        if (normalEntry) {
          billContext = config.useSummaryForContext
            ? normalEntry.summary || undefined
            : normalEntry.content || undefined;
        }
      } catch {
        // コンテンツ取得失敗時はタイトルのみで生成
      }
    }

    // 2. 画像生成
    const prompt = buildThumbnailPrompt(
      billName,
      billContext,
      config.maxPromptLength
    );
    const result = await generator.generate(prompt);
    if (!result) {
      return {
        success: false,
        error: "画像の生成に失敗しました",
      };
    }

    // 3. 生成画像をバイナリ取得
    let imageBuffer: Buffer;
    if (result.url.startsWith("data:")) {
      // data URL (base64) の場合
      const base64Data = result.url.split(",")[1];
      imageBuffer = Buffer.from(base64Data, "base64");
    } else {
      const imageResponse = await fetch(result.url);
      if (!imageResponse.ok) {
        return {
          success: false,
          error: "生成された画像のダウンロードに失敗しました",
        };
      }
      imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    }

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
