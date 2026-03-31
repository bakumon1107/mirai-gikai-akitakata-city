/**
 * AI管理画面で選択可能なモデル一覧
 *
 * chat-model-options.ts と同じモデルセットだが、
 * AI管理ページ専用のバリデーション・グループ定義として独立させる。
 */

export type AiModelOption = {
  value: string;
  label: string;
};

export type AiModelGroup = {
  provider: string;
  options: AiModelOption[];
};

const OPENAI_MODELS: AiModelOption[] = [
  { value: "openai/gpt-4o-mini", label: "GPT-4o mini" },
  { value: "openai/gpt-5", label: "GPT-5" },
  { value: "openai/gpt-5-mini", label: "GPT-5 mini" },
  { value: "openai/gpt-5-nano", label: "GPT-5 nano" },
  { value: "openai/gpt-5-chat", label: "GPT-5 Chat" },
  { value: "openai/gpt-5.1-instant", label: "GPT-5.1 Instant" },
  { value: "openai/gpt-5.1-thinking", label: "GPT-5.1 Thinking" },
  { value: "openai/gpt-5.2", label: "GPT-5.2" },
];

const GOOGLE_MODELS: AiModelOption[] = [
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

const ANTHROPIC_MODELS: AiModelOption[] = [
  { value: "anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5" },
  { value: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6" },
  { value: "anthropic/claude-opus-4.6", label: "Claude Opus 4.6" },
];

export const AI_MODEL_OPTIONS: AiModelOption[] = [
  ...OPENAI_MODELS,
  ...GOOGLE_MODELS,
  ...ANTHROPIC_MODELS,
];

export const AI_MODEL_GROUPS: AiModelGroup[] = [
  { provider: "OpenAI", options: OPENAI_MODELS },
  { provider: "Google", options: GOOGLE_MODELS },
  { provider: "Anthropic", options: ANTHROPIC_MODELS },
];

export function isValidAiModel(model: string): boolean {
  return AI_MODEL_OPTIONS.some((opt) => opt.value === model);
}

export function getModelLabel(model: string): string {
  const opt = AI_MODEL_OPTIONS.find((o) => o.value === model);
  return opt?.label ?? model;
}
