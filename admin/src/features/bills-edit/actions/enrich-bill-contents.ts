"use server";

import { randomUUID } from "node:crypto";
import * as os from "node:os";
import * as path from "node:path";
import { siteConfig } from "@/config/site.config";
import {
  ClaudeTimeoutError,
  ClaudeUsageLimitError,
  cleanupTempFile,
  executeClaudeToFile,
  readCollectionOutput,
} from "@/features/ai-collection/server/utils/execute-claude";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";

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

function buildPrompt(
  billName: string,
  existingHardTitle: string,
  outputFilePath: string
): string {
  return `${siteConfig.councilName}の議案「${billName}」について、Web検索で関連情報を収集し、詳細なコンテンツを作成してください。

## 手順

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

    const prompt = buildPrompt(billName, existingHardTitle, outputFilePath);

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
