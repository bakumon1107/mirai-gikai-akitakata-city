import { AI_MODELS } from "@/lib/ai/models";

/**
 * AI機能ごとの使用モデル情報
 *
 * 現時点では静的定義（ステップ1: 表示のみ）。
 * 今後ステップ2でDB管理に移行し、モデル切替UIを追加予定。
 */

export type AiFeatureConfig = {
  id: string;
  featureName: string;
  provider: string;
  model: string;
  configType: "db" | "constant" | "hardcoded" | "cli";
  configTypeLabel: string;
  description: string;
};

/** DB経由でモデル切替可能な機能のID一覧 */
export const CONFIGURABLE_FEATURE_IDS = [
  "interview-chat",
  "config-generation",
  "topic-analysis",
];

export const aiFeatureConfigs: AiFeatureConfig[] = [
  {
    id: "interview-chat",
    featureName: "インタビューチャット",
    provider: "OpenAI",
    model: AI_MODELS.gpt5_2,
    configType: "db",
    configTypeLabel: "DB設定（議案別）",
    description: "市民向けインタビュー対話。議案ごとにモデル変更可能。",
  },
  {
    id: "config-generation",
    featureName: "テーマ・質問生成",
    provider: "OpenAI",
    model: AI_MODELS.gpt5_2,
    configType: "hardcoded",
    configTypeLabel: "固定（コード内）",
    description: "インタビューのテーマ案・質問案をAIで生成。",
  },
  {
    id: "topic-analysis",
    featureName: "トピック分析",
    provider: "Google",
    model: AI_MODELS.gemini3_flash_preview,
    configType: "constant",
    configTypeLabel: "固定（定数）",
    description: "インタビュー意見の5段階分析パイプライン。",
  },
  {
    id: "bill-enrichment",
    featureName: "議案コンテンツ編集",
    provider: "Anthropic",
    model: "Claude CLI",
    configType: "cli",
    configTypeLabel: "固定（CLI）",
    description: "Web検索でHard版/Normal版の議案コンテンツを生成。",
  },
  {
    id: "ai-collection",
    featureName: "AI情報収集",
    provider: "Anthropic",
    model: "Claude CLI",
    configType: "cli",
    configTypeLabel: "固定（CLI）",
    description: "議案一覧・会派態度をWebから自動収集。",
  },
];
