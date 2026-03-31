import "server-only";

import { openai } from "@ai-sdk/openai";
import { generateText, stepCountIs } from "ai";
import { siteConfig } from "@/config/site.config";

type RawCollectionResult = {
  bills: Array<{
    billNumber?: string | null;
    title: string;
    summary: string;
    status: string;
    statusNote?: string | null;
    submitter?: string | null;
    sourceUrls?: string[];
  }>;
  factionStances: Array<{
    billTitle: string;
    factionName: string;
    stanceType: string;
    comment?: string | null;
    sourceUrls?: string[];
  }>;
  sources: string[];
};

/**
 * OpenAI API + Web Search で議案情報を収集する
 *
 * Claude CLI の代替として、OpenAI の web_search ツールを使い
 * 議案一覧と会派賛否を収集して構造化データを返す。
 */
export async function collectWithOpenAi(
  modelId: string,
  startDate: string,
  endDate: string,
  existingBillNumbers: string[]
): Promise<RawCollectionResult> {
  const modelName = modelId.replace("openai/", "");

  const existingSection =
    existingBillNumbers.length > 0
      ? `\n既に登録済みの議案番号（重複収集不要）:\n${existingBillNumbers.map((n) => `- ${n}`).join("\n")}\n`
      : "";

  const systemPrompt = `あなたは${siteConfig.councilName}の議案情報を調査する専門家です。
Web検索を使って正確な情報を収集し、JSON形式で返してください。
必ず以下のJSON形式のみで応答してください（余分なテキストは不要）。`;

  const userPrompt = `${siteConfig.councilName}の${startDate}から${endDate}の期間に審議された議案と各会派の賛否について調査してください。
${existingSection}
調査サイト:
- ${siteConfig.councilBillsDetailUrl} （${siteConfig.councilName}）

収集情報:
1. 議案一覧（議案番号・議案名・提出者・審議ステータス・概要）
2. 会派見解（${siteConfig.councilFactionExamples}）
   - 議決結果を掲載したPDF（「議決結果」「採決結果」等のリンク）がある場合は優先的に参照してください
   - PDFは表形式で会派ごとの賛否が記載されています

以下のJSON形式で返してください:
{
  "bills": [{"billNumber": null, "title": "議案名", "summary": "概要", "status": "submitted", "statusNote": null, "submitter": null, "sourceUrls": []}],
  "factionStances": [{"billTitle": "議案名", "factionName": "会派名", "stanceType": "for", "comment": null, "sourceUrls": []}],
  "sources": []
}

stanceTypeの値: "for"(賛成) | "against"(反対) | "neutral"(中立) | "absent"(欠席)

statusの値:
- "submitted": 提出・上程
- "in_committee": 委員会審査中
- "plenary_session": 本会議審議中
- "approved": 可決・承認・同意・採択（statusNoteに詳細を記載）
- "rejected": 否決・不採択

statusNoteの設定ルール（statusが "approved" の場合）:
- 「可決」→ null, 「原案可決」→ "原案可決", 「修正可決」→ "修正可決"
- 「承認」→ "承認", 「同意」→ "同意", 「採択」→ "採択", 「趣旨採択」→ "趣旨採択"

statusNoteの設定ルール（statusが "rejected" の場合）:
- 「否決」→ null, 「不採択」→ "不採択"`;

  const { text } = await generateText({
    model: openai(modelName),
    system: systemPrompt,
    prompt: userPrompt,
    // biome-ignore lint/suspicious/noExplicitAny: OpenAI web_search tool type incompatibility
    tools: { web_search: openai.tools.webSearch() } as any,
    stopWhen: stepCountIs(15),
  });

  // JSONを抽出
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(
      `OpenAIの出力からJSONを抽出できませんでした。出力: ${text.slice(0, 200)}`
    );
  }

  const parsed = JSON.parse(jsonMatch[0]) as RawCollectionResult;

  return {
    bills: Array.isArray(parsed.bills) ? parsed.bills : [],
    factionStances: Array.isArray(parsed.factionStances)
      ? parsed.factionStances
      : [],
    sources: Array.isArray(parsed.sources) ? parsed.sources : [],
  };
}
