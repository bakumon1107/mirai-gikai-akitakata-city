/**
 * seed-bill-discussions.ts
 *
 * 安芸高田市議会の会議録PDFをパースし、
 * 議案ごとの質疑情報をAIで要約してDBに投入する。
 *
 * 使い方:
 *   # PDF→テキスト変換（要 poppler-utils）
 *   pdftotext -layout <minutes.pdf> /tmp/gijiroku.txt
 *
 *   # 実行
 *   tsx --env-file=../../.env akitakata/seed-bill-discussions.ts /tmp/gijiroku.txt
 *   tsx --env-file=../../.env akitakata/seed-bill-discussions.ts /tmp/gijiroku.txt --dry-run
 *
 * 前提:
 *   - bill_discussions テーブルが存在すること（マイグレーション適用済み）
 *   - .env に SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY が設定されていること
 */

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createAdminClient } from "../shared/helper";
import {
  countExchanges,
  groupIntoDiscussions,
  parseMinutes,
} from "./parse-minutes";

// ---- 設定 ----

const CLAUDE_PATH = process.env.CLAUDE_CLI_PATH || "claude";
const SESSION_DAY = 1;

// ---- Claude CLI呼び出し ----

function callClaude(prompt: string): string {
  const tmpFile = path.join(os.tmpdir(), `seed-discussions-${Date.now()}.txt`);
  fs.writeFileSync(tmpFile, prompt, "utf-8");

  try {
    const env = { ...process.env };
    delete env.CLAUDECODE;
    delete env.CLAUDE_CODE;

    const result = execSync(
      `"${CLAUDE_PATH}" --dangerously-skip-permissions -p "$(cat ${tmpFile})"`,
      {
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024,
        env,
        shell: "/bin/bash",
      }
    );
    return result.trim();
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

// ---- AI要約プロンプト ----

function buildSummaryPrompt(
  questionText: string,
  answerText: string
): string {
  return `あなたは安芸高田市議会の会議録を要約するアシスタントです。

以下は議案に関する市議会での質疑応答です。
市民が読みやすいように、それぞれ2〜3文で要約してください。

## 質問者の発言
${questionText}

## 答弁者の発言
${answerText}

以下のJSON形式のみで出力してください（他のテキストは一切含めないこと）:
{
  "question_summary": "...",
  "answer_summary": "..."
}`;
}

// ---- メイン処理 ----

async function main() {
  const isDryRun = process.argv.includes("--dry-run");
  const minutesFile = process.argv.find(
    (a) => !a.startsWith("--") && a.endsWith(".txt")
  );

  if (!minutesFile) {
    console.error(
      "使い方: tsx akitakata/seed-bill-discussions.ts <minutes.txt> [--dry-run]"
    );
    process.exit(1);
  }

  console.log(
    isDryRun
      ? "🔍 DRY RUN モード（DB更新なし）"
      : "🚀 seed-bill-discussions 開始"
  );

  if (!fs.existsSync(minutesFile)) {
    console.error(`❌ 会議録ファイルが見つかりません: ${minutesFile}`);
    process.exit(1);
  }

  const minutesText = fs.readFileSync(minutesFile, "utf-8");
  console.log(`📄 会議録読み込み: ${minutesFile} (${minutesText.length} chars)`);

  // パース
  const speeches = parseMinutes(minutesText);
  console.log(`💬 発言ブロック数: ${speeches.length}`);

  const groups = groupIntoDiscussions(speeches);
  console.log(`👥 質疑グループ数: ${groups.length}`);

  for (const g of groups) {
    console.log(
      `  - ${g.questionerName}（${g.questionerNumber || "番不明"}） → 議案: [${g.billNumbers.join(", ")}]`
    );
  }

  if (isDryRun) {
    console.log("\n✅ DRY RUN 完了");
    return;
  }

  // Supabaseクライアント
  const supabase = createAdminClient();

  // 議案番号 → bill_id マッピングを取得
  const { data: bills, error: billsError } = await supabase
    .from("bills")
    .select("id, bill_number")
    .eq("publish_status", "published")
    .not("bill_number", "is", null);

  if (billsError) {
    console.error("❌ bills取得エラー:", billsError.message);
    process.exit(1);
  }

  // bill_number は DB では生数字形式（例: "22"）で格納されている
  const billMap = new Map(
    (bills ?? [])
      .filter((b) => b.bill_number)
      .map((b) => [String(b.bill_number), b.id])
  );
  console.log(`\n📋 公開議案数: ${billMap.size}`);

  let insertCount = 0;
  let skipCount = 0;

  for (const group of groups) {
    console.log(
      `\n処理中: ${group.questionerName}（${group.questionerNumber || "番不明"}）→ 議案: [${group.billNumbers.join(", ")}]`
    );

    if (group.billNumbers.length === 0) {
      console.log("  ⚠️  議案番号なし → スキップ");
      skipCount++;
      continue;
    }

    // 質問テキスト・答弁テキストを結合
    const questionSpeeches = group.speeches.filter(
      (s) => s.speakerType === "questioner"
    );
    const answerSpeeches = group.speeches.filter(
      (s) => s.speakerType === "answerer"
    );

    const questionText = questionSpeeches.map((s) => s.text).join("\n\n");
    const answerText = answerSpeeches.map((s) => s.text).join("\n\n");

    if (!questionText.trim() || !answerText.trim()) {
      console.log("  ⚠️  質問または答弁テキストなし → スキップ");
      skipCount++;
      continue;
    }

    const exchanges = countExchanges(group.speeches);
    const primaryAnswerer = answerSpeeches[0];

    // AI要約
    console.log("  🤖 AI要約生成中...");
    let questionSummary = "";
    let answerSummary = "";

    try {
      const raw = callClaude(
        buildSummaryPrompt(
          questionText.slice(0, 2000),
          answerText.slice(0, 2000)
        )
      );
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        questionSummary = parsed.question_summary ?? "";
        answerSummary = parsed.answer_summary ?? "";
        console.log(`  ✅ 要約生成: Q="${questionSummary.slice(0, 40)}..."`);
      } else {
        console.log("  ⚠️  JSONパース失敗, raw:", raw.slice(0, 100));
      }
    } catch (e) {
      console.error("  ❌ AI要約エラー:", e);
    }

    // 各議案に対してレコードを挿入
    for (const billNum of group.billNumbers) {
      // 先頭ゼロを除去して DB の bill_number と照合
      const normalizedNum = String(parseInt(billNum, 10));
      const billId = billMap.get(normalizedNum);

      if (!billId) {
        console.log(
          `  ⚠️  議案第${billNum}号 → DB未登録またはunpublished → スキップ`
        );
        skipCount++;
        continue;
      }

      const record = {
        bill_id: billId,
        session_day: SESSION_DAY,
        questioner_name: group.questionerName,
        questioner_number: group.questionerNumber || null,
        questioner_party: null, // 安芸高田は無所属/会派不明のため省略
        question_summary: questionSummary,
        question_raw: questionText,
        answerer_role: primaryAnswerer?.speakerRole ?? null,
        answerer_name: primaryAnswerer?.speakerName ?? null,
        answer_summary: answerSummary,
        answer_raw: answerText,
        exchange_count: exchanges,
      };

      const { error } = await supabase
        .from("bill_discussions")
        .upsert(record, {
          onConflict: "bill_id,questioner_name",
          ignoreDuplicates: false,
        });

      if (error) {
        console.error(`  ❌ 議案第${billNum}号 upsertエラー:`, error.message);
      } else {
        console.log(`  ✅ 議案第${billNum}号 → upsert完了`);
        insertCount++;
      }
    }
  }

  console.log("\n🎉 完了");
  console.log(`  挿入/更新: ${insertCount} 件`);
  console.log(`  スキップ: ${skipCount} 件`);
}

main().catch(console.error);
