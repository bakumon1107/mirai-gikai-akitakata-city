/**
 * AI管理画面で選択可能なモデル一覧
 *
 * 機能カテゴリ別に分類:
 * - テキスト生成: チャット、テーマ生成、トピック分析等
 * - CLI: Claude CLI（Web検索・PDF読み込み付き）
 * - 画像生成: サムネイル等
 */

export type AiModelOption = {
  value: string;
  label: string;
};

export type AiModelGroup = {
  provider: string;
  options: AiModelOption[];
};

// ─── テキスト生成モデル ───────────────────────────────

const OPENAI_TEXT_MODELS: AiModelOption[] = [
  { value: "openai/gpt-4o-mini", label: "GPT-4o mini" },
  { value: "openai/gpt-5", label: "GPT-5" },
  { value: "openai/gpt-5-mini", label: "GPT-5 mini" },
  { value: "openai/gpt-5-nano", label: "GPT-5 nano" },
  { value: "openai/gpt-5-chat", label: "GPT-5 Chat" },
  { value: "openai/gpt-5.1-instant", label: "GPT-5.1 Instant" },
  { value: "openai/gpt-5.1-thinking", label: "GPT-5.1 Thinking" },
  { value: "openai/gpt-5.2", label: "GPT-5.2" },
];

const GOOGLE_TEXT_MODELS: AiModelOption[] = [
  { value: "google/gemini-3-flash", label: "Gemini 3 Flash" },
  {
    value: "google/gemini-3-flash-preview",
    label: "Gemini 3 Flash Preview",
  },
  {
    value: "google/gemini-3.1-pro-preview",
    label: "Gemini 3.1 Pro Preview",
  },
];

const ANTHROPIC_TEXT_MODELS: AiModelOption[] = [
  { value: "anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5" },
  { value: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6" },
  { value: "anthropic/claude-opus-4.6", label: "Claude Opus 4.6" },
];

/** テキスト生成モデル全体 */
export const TEXT_MODEL_OPTIONS: AiModelOption[] = [
  ...OPENAI_TEXT_MODELS,
  ...GOOGLE_TEXT_MODELS,
  ...ANTHROPIC_TEXT_MODELS,
];

/** テキスト生成モデル（プロバイダー別グループ） */
export const TEXT_MODEL_GROUPS: AiModelGroup[] = [
  { provider: "OpenAI", options: OPENAI_TEXT_MODELS },
  { provider: "Google", options: GOOGLE_TEXT_MODELS },
  { provider: "Anthropic", options: ANTHROPIC_TEXT_MODELS },
];

// ─── CLI モデル（Web検索・PDF読み込み付き） ─────────────

const ANTHROPIC_CLI_MODELS: AiModelOption[] = [
  { value: "anthropic/claude-cli", label: "Claude CLI(/modelで設定)" },
];

const OPENAI_CLI_MODELS: AiModelOption[] = [
  { value: "openai/gpt-5", label: "GPT-5（API）" },
  { value: "openai/gpt-5-mini", label: "GPT-5 mini（API）" },
  { value: "openai/gpt-5.2", label: "GPT-5.2（API）" },
];

/** CLI/Web検索系モデル全体 */
export const CLI_MODEL_OPTIONS: AiModelOption[] = [
  ...ANTHROPIC_CLI_MODELS,
  ...OPENAI_CLI_MODELS,
];

/** CLI/Web検索系モデル（プロバイダー別グループ） */
export const CLI_MODEL_GROUPS: AiModelGroup[] = [
  { provider: "Anthropic", options: ANTHROPIC_CLI_MODELS },
  { provider: "OpenAI", options: OPENAI_CLI_MODELS },
];

// ─── 画像生成モデル ───────────────────────────────────

const OPENAI_IMAGE_MODELS: AiModelOption[] = [
  { value: "openai/gpt-image-1", label: "GPT Image 1" },
  { value: "openai/dall-e-3", label: "DALL-E 3" },
  { value: "openai/dall-e-2", label: "DALL-E 2" },
];

const GOOGLE_IMAGE_MODELS: AiModelOption[] = [
  { value: "google/imagen-4-fast", label: "Imagen 4 Fast" },
  { value: "google/imagen-4-standard", label: "Imagen 4 Standard" },
  { value: "google/imagen-4-ultra", label: "Imagen 4 Ultra" },
];

/** 画像生成モデル全体 */
export const IMAGE_MODEL_OPTIONS: AiModelOption[] = [
  ...OPENAI_IMAGE_MODELS,
  ...GOOGLE_IMAGE_MODELS,
];

/** 画像生成モデル（プロバイダー別グループ） */
export const IMAGE_MODEL_GROUPS: AiModelGroup[] = [
  { provider: "OpenAI", options: OPENAI_IMAGE_MODELS },
  { provider: "Google", options: GOOGLE_IMAGE_MODELS },
];

// ─── 後方互換エクスポート ─────────────────────────────

/** @deprecated TEXT_MODEL_OPTIONS を使用してください */
export const AI_MODEL_OPTIONS = TEXT_MODEL_OPTIONS;
/** @deprecated TEXT_MODEL_GROUPS を使用してください */
export const AI_MODEL_GROUPS = TEXT_MODEL_GROUPS;

// ─── ユーティリティ ───────────────────────────────────

const ALL_OPTIONS = [
  ...TEXT_MODEL_OPTIONS,
  ...CLI_MODEL_OPTIONS,
  ...IMAGE_MODEL_OPTIONS,
];

export function isValidAiModel(model: string): boolean {
  return ALL_OPTIONS.some((opt) => opt.value === model);
}

export function getModelLabel(model: string): string {
  const opt = ALL_OPTIONS.find((o) => o.value === model);
  return opt?.label ?? model;
}

/**
 * モデルIDからプロバイダー名を抽出する
 * 例: "openai/gpt-5.2" → "OpenAI", "anthropic/claude-cli" → "Anthropic"
 */
export function getProviderFromModel(model: string): string {
  const prefix = model.split("/")[0];
  const providers: Record<string, string> = {
    openai: "OpenAI",
    google: "Google",
    anthropic: "Anthropic",
  };
  return providers[prefix] ?? prefix;
}

/**
 * Claude CLI モデルかどうかを判定する
 */
export function isClaudeCliModel(model: string): boolean {
  return model === "anthropic/claude-cli";
}
