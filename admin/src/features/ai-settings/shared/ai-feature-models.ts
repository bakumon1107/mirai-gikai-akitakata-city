import { AI_MODELS } from "@/lib/ai/models";

/**
 * AI機能ごとの使用モデル情報
 *
 * modelCategory でモデル選択UIに表示するグループを決定する:
 * - "text": テキスト生成モデル（GPT, Gemini, Claude 等）
 * - "cli": CLI/Web検索系（Claude CLI or OpenAI API）
 * - "image": 画像生成モデル（DALL-E, Imagen 等）
 */

export type ModelCategory = "text" | "cli" | "image";

export type AiFeatureConfig = {
  id: string;
  featureName: string;
  provider: string;
  model: string;
  modelCategory: ModelCategory;
  description: string;
};

/** DB経由でモデル切替可能な機能のID一覧 */
export const CONFIGURABLE_FEATURE_IDS = [
  "interview-chat",
  "config-generation",
  "topic-analysis",
  "bill-enrichment",
  "ai-collection",
  "thumbnail-generation",
];

export const aiFeatureConfigs: AiFeatureConfig[] = [
  {
    id: "interview-chat",
    featureName: "インタビューチャット",
    provider: "OpenAI",
    model: AI_MODELS.gpt5_2,
    modelCategory: "text",
    description: "市民向けインタビュー対話。議案ごとにモデル変更可能。",
  },
  {
    id: "config-generation",
    featureName: "テーマ・質問生成",
    provider: "OpenAI",
    model: AI_MODELS.gpt5_2,
    modelCategory: "text",
    description: "インタビューのテーマ案・質問案をAIで生成。",
  },
  {
    id: "topic-analysis",
    featureName: "トピック分析",
    provider: "Google",
    model: AI_MODELS.gemini3_flash_preview,
    modelCategory: "text",
    description: "インタビュー意見の5段階分析パイプライン。",
  },
  {
    id: "bill-enrichment",
    featureName: "議案コンテンツ編集",
    provider: "Anthropic",
    model: "anthropic/claude-cli",
    modelCategory: "cli",
    description: "Web検索でHard版/Normal版の議案コンテンツを生成。",
  },
  {
    id: "ai-collection",
    featureName: "AI情報収集",
    provider: "Anthropic",
    model: "anthropic/claude-cli",
    modelCategory: "cli",
    description: "議案一覧・会派見解をWebから自動収集。",
  },
  {
    id: "thumbnail-generation",
    featureName: "AI画像生成",
    provider: "OpenAI",
    model: "openai/dall-e-3",
    modelCategory: "image",
    description: "議案サムネイル画像をAIで自動生成。",
  },
];
