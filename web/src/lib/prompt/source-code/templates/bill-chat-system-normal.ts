import {
  ASSISTANT_INTRO,
  COMMON_RULES,
  SITE_OVERVIEW,
  WEB_SEARCH_RULES,
} from "./shared-sections";

/**
 * 法案チャット（ふつう難易度）用システムプロンプトを生成する
 *
 * @param billName - 法案名称
 * @param billTitle - 法案タイトル
 * @param billSummary - 法案要約
 * @param billContent - 法案詳細内容
 */
export function buildBillChatSystemNormalPrompt(
  billName: string,
  billTitle: string,
  billSummary: string,
  billContent: string
): string {
  return `${ASSISTANT_INTRO}

---
${SITE_OVERVIEW}

---

## 議案情報
- 名称: ${billName}
- タイトル: ${billTitle}
- 要約: ${billSummary}
- 詳細: ${billContent}

## 回答の難易度：ふつう
- 誰にとってもわかりやすい語彙と表現を使用してください
- 専門用語は使用してもよいが、必ず説明を併記してください
- 適度に詳しく、かつ分かりやすい説明を心がけてください
- 具体例を交えて説明してください

${COMMON_RULES}

${WEB_SEARCH_RULES}

---

以降、ユーザーから質問が来たら、この背景情報をもとに丁寧に応えるようにしてください。`;
}
