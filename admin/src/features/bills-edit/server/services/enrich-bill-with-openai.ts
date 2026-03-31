import "server-only";

import { openai } from "@ai-sdk/openai";
import { generateText, stepCountIs } from "ai";
import { siteConfig } from "@/config/site.config";
import type { EnrichedContent } from "../../actions/enrich-bill-contents";

/**
 * OpenAI API + Web Search でコンテンツを生成する
 *
 * Claude CLI の代替として、OpenAI の web_search ツールを使い
 * 議案情報を収集して Hard/Normal 2バージョンのコンテンツを返す。
 */
export async function enrichBillWithOpenAi(
  modelId: string,
  billName: string,
  existingHardTitle: string,
  sessionInfo?: string,
  pdfUrl?: string | null
): Promise<
  { foundNewInfo: true; content: EnrichedContent } | { foundNewInfo: false }
> {
  const modelName = modelId.replace("openai/", "");

  const pdfInstruction = pdfUrl
    ? `\n\n## 参照PDF\n以下のURLに議案のPDFがあります。Web検索の参考情報として活用してください: ${pdfUrl}`
    : "";

  const sessionBlock = sessionInfo
    ? `\n\n## 定例会情報\n${sessionInfo}\n\n**重要**: コンテンツ内で定例会の日程に言及する場合は、必ず上記の正確な日付を使用してください。`
    : "";

  const systemPrompt = `あなたは${siteConfig.councilName}の議案について調査し、市民向けのコンテンツを作成する専門家です。

Web検索を使って議案の詳細情報を収集し、以下の2種類のコンテンツをJSON形式で返してください。

**難しいバージョン（hard）** - 専門家・詳細向け:
- content: 専門用語を含む詳細な説明（Markdown形式）。末尾に「## 参照」セクションを設けて参照URLをリスト形式で記載
- summary: content の要約（500文字以内）

**ふつうバージョン（normal）** - 一般市民向け:
- title: 現在のタイトル「${existingHardTitle || billName}」に専門用語が含まれていれば日常語に言い換えたタイトル。専門用語がなければそのまま
- content: hard の content の専門用語を可能な限り平易な言葉に置き換えた説明（Markdown形式）
- summary: normal の content の要約（500文字以内）

情報が十分に得られなかった場合は foundNewInfo: false を返してください。

必ず以下のJSON形式のみで応答してください（余分なテキストは不要）:

新情報あり:
{"foundNewInfo":true,"hard":{"content":"...","summary":"..."},"normal":{"title":"...","content":"...","summary":"..."}}

新情報なし:
{"foundNewInfo":false}`;

  const userPrompt = `議案「${billName}」について調査してください。

検索キーワード例:
- 「${siteConfig.councilName} ${billName}」
- 「${siteConfig.cityName} ${billName}」${pdfInstruction}${sessionBlock}`;

  const { text } = await generateText({
    model: openai(modelName),
    system: systemPrompt,
    prompt: userPrompt,
    // biome-ignore lint/suspicious/noExplicitAny: OpenAI web_search tool type incompatibility
    tools: { web_search: openai.tools.webSearch() } as any,
    stopWhen: stepCountIs(10),
  });

  // JSONを抽出
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("OpenAIの出力からJSONを抽出できませんでした");
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    foundNewInfo: boolean;
    hard?: { content: string; summary: string };
    normal?: { title: string; content: string; summary: string };
  };

  if (!parsed.foundNewInfo) {
    return { foundNewInfo: false };
  }

  if (!parsed.hard || !parsed.normal) {
    throw new Error("OpenAIの出力形式が不正です");
  }

  return {
    foundNewInfo: true,
    content: {
      hard: {
        content: parsed.hard.content ?? "",
        summary: parsed.hard.summary ?? "",
      },
      normal: {
        title: parsed.normal.title ?? "",
        content: parsed.normal.content ?? "",
        summary: parsed.normal.summary ?? "",
      },
    },
  };
}
