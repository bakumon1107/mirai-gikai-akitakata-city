"use server";

import { randomUUID } from "node:crypto";
import * as os from "node:os";
import * as path from "node:path";
import { createAdminClient } from "@mirai-gikai/supabase";
import { siteConfig } from "@/config/site.config";
import {
  ClaudeTimeoutError,
  ClaudeUsageLimitError,
  cleanupTempFile,
  executeClaudeToFile,
  readCollectionOutput,
} from "@/features/ai-collection/server/utils/execute-claude";
import { getAiModel } from "@/features/ai-settings/server/loaders/get-ai-model";
import { isClaudeCliModel } from "@/features/ai-settings/shared/ai-model-options";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { enrichBillWithOpenAi } from "../server/services/enrich-bill-with-openai";

export type EnrichedContent = {
  hard: {
    content: string;
    summary: string;
  };
  normal: {
    title: string;
    content: string;
    summary: string;
  };
};

export type EnrichBillContentsResult =
  | { success: true; foundNewInfo: true; content: EnrichedContent }
  | { success: true; foundNewInfo: false }
  | { success: false; error: string; isUsageLimit?: boolean };

/** 日付文字列をJST(YYYY/MM/DD)にフォーマット */
function formatDateJST(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/** billId から議案＋定例会情報を取得 */
async function fetchBillWithSession(billId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("bills")
    .select(
      "pdf_url, council_session_id, council_sessions(name, start_date, end_date)"
    )
    .eq("id", billId)
    .single();
  return data;
}

function buildPrompt(
  billName: string,
  existingHardTitle: string,
  outputFilePath: string,
  sessionInfo?: string,
  pdfUrl?: string | null
): string {
  const pdfStep = pdfUrl
    ? `
0. **【重要】まず以下の議案PDFを読み取ってください：**
   PDF URL: ${pdfUrl}
   - WebFetchでこのURLを取得してください。PDFの内容がテキストとして取得できた場合は、その内容を議案の一次情報として使用してください。
   - WebFetchでテキストが取得できない場合（バイナリ、文字化け等）は、WebFetchの結果に含まれるローカル保存先パスをReadで読み取ってください。Readツールは画像化されたPDFも視覚的に読み取れます。
   - PDFから得られた情報（提案理由、経緯、金額、当事者等）は、コンテンツ作成の最も重要な情報源として活用してください。

`
    : "";

  return `${siteConfig.councilName}の議案「${billName}」について、Web検索で関連情報を収集し、詳細なコンテンツを作成してください。
${sessionInfo ? `\n## この議案が審議される定例会の情報\n\n${sessionInfo}\n\n**重要**: コンテンツ内で定例会の日程（開会日・閉会日等）に言及する場合は、必ず上記の正確な日付を使用してください。Web検索結果の日付がズレている場合でも、上記の日付を優先してください。\n` : ""}
## 手順
${pdfStep}
1. 「${siteConfig.councilName} ${billName}」をWebで検索し、以下のサイトを中心に情報を収集してください：
   - ${siteConfig.councilName}公式サイト（${siteConfig.councilBillsDetailUrl}）
   - ${siteConfig.cityName}公式サイト
   - 関連するニュース・報道機関

2. 収集した情報が既存の情報と同じ内容のみの場合は foundNewInfo: false を書き込んで終了してください。

3. 新しい情報が得られた場合は以下の2種類のコンテンツを作成してください：

   **難しいバージョン（hard）** - 専門家・詳細向け:
   - content: 専門用語を含む詳細な説明（Markdown形式）。末尾に「## 参照」セクションを設けて参照URLをリスト形式で記載すること
   - summary: content の要約（500文字以内）

   **ふつうバージョン（normal）** - 一般市民向け:
   - title: 現在のタイトル「${existingHardTitle || billName}」に専門用語が含まれていれば日常語に言い換えたタイトル。専門用語がなければそのまま
   - content: hard の content の専門用語を可能な限り平易な言葉に置き換えた説明（Markdown形式）
   - summary: normal の content の要約（500文字以内）

## 出力

「${outputFilePath}」に Write ツールで以下のJSON形式で書き込んでください。

新情報あり:
{
  "foundNewInfo": true,
  "hard": {
    "content": "詳細内容（Markdown・末尾にURL記載）",
    "summary": "要約（500文字以内）"
  },
  "normal": {
    "title": "ふつうバージョンのタイトル",
    "content": "平易な内容（Markdown）",
    "summary": "要約（500文字以内）"
  }
}

新情報なし:
{
  "foundNewInfo": false
}`;
}

export async function enrichBillContents(
  _billId: string,
  billName: string,
  existingHardTitle: string
): Promise<EnrichBillContentsResult> {
  try {
    await requireAdmin();

    const tempId = randomUUID();
    const outputFilePath = path.join(os.tmpdir(), `bill_enrich_${tempId}.json`);

    // 定例会の日程情報とPDF URLを取得してプロンプトに含める
    let sessionInfo: string | undefined;
    let pdfUrl: string | null | undefined;
    try {
      const billData = await fetchBillWithSession(_billId);
      pdfUrl = billData?.pdf_url;
      const session = billData?.council_sessions;
      if (session && !Array.isArray(session)) {
        const startDate = formatDateJST(session.start_date);
        const endDate = session.end_date
          ? formatDateJST(session.end_date)
          : "未定";
        sessionInfo = `- 定例会名: ${session.name}\n- 開会日: ${startDate}\n- 閉会日: ${endDate}`;
      }
    } catch {
      // 定例会情報が取得できなくても処理は続行
    }

    const modelId = await getAiModel("bill-enrichment", "anthropic/claude-cli");

    // OpenAI API選択時は専用サービスで処理
    if (!isClaudeCliModel(modelId)) {
      try {
        const result = await enrichBillWithOpenAi(
          modelId,
          billName,
          existingHardTitle,
          sessionInfo,
          pdfUrl
        );
        if (!result.foundNewInfo) {
          return { success: true, foundNewInfo: false };
        }
        return { success: true, foundNewInfo: true, content: result.content };
      } catch (error) {
        console.error("[enrich-bill-contents] OpenAI error:", error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "OpenAI APIでのコンテンツ生成に失敗しました",
        };
      }
    }

    const prompt = buildPrompt(
      billName,
      existingHardTitle,
      outputFilePath,
      sessionInfo,
      pdfUrl
    );

    try {
      await executeClaudeToFile(prompt, outputFilePath);
    } catch (err) {
      if (err instanceof ClaudeUsageLimitError) {
        return { success: false, error: err.message, isUsageLimit: true };
      }
      if (err instanceof ClaudeTimeoutError) {
        console.error(
          "[enrich-bill-contents] タイムアウト診断情報:",
          err.diagnostics
        );
        return { success: false, error: err.message };
      }
      throw err;
    }

    let rawOutput: string;
    try {
      rawOutput = await readCollectionOutput(outputFilePath);
    } finally {
      await cleanupTempFile(outputFilePath);
    }

    // Claude の出力から JSON を抽出
    const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        error: "Claudeの出力からJSONを抽出できませんでした",
      };
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      foundNewInfo: boolean;
      hard?: { content: string; summary: string };
      normal?: { title: string; content: string; summary: string };
    };

    if (!parsed.foundNewInfo) {
      return { success: true, foundNewInfo: false };
    }

    if (!parsed.hard || !parsed.normal) {
      return { success: false, error: "Claudeの出力形式が不正です" };
    }

    return {
      success: true,
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
  } catch (error) {
    console.error("Enrich bill contents error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "補完中にエラーが発生しました",
    };
  }
}
