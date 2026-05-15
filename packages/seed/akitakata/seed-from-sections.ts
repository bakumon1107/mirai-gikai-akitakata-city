/**
 * seed-from-sections.ts
 *
 * 個人別に分割・クリーニング済みのテキストファイルから直接DBへupsertする。
 * extract-sections.ts で作成した cleaned/ ファイルを使用。
 *
 * 使い方:
 *   tsx --env-file=../../.env akitakata/seed-from-sections.ts <session_slug> <session_day> [--dry-run] [--only <name>]
 *   例: tsx --env-file=../../.env akitakata/seed-from-sections.ts r8-1 1 --only 宍戸
 */

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { createAdminClient } from "../shared/helper";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type GeneratedTopic = {
  title: string;
  question_summary: string;
  answer_summary: string;
  answerer_role: string;
  answerer_name: string;
  raw_question?: string | null;
  raw_answer?: string | null;
};

function upsertViaCurl(record: Record<string, unknown>): void {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const tmpFile = path.join(os.tmpdir(), `seed-upsert-${Date.now()}.json`);
  fs.writeFileSync(tmpFile, JSON.stringify(record), "utf-8");
  try {
    execSync(
      `curl -sf -X POST "${supabaseUrl}/rest/v1/general_questions?on_conflict=council_session_id,session_day,question_order" \
        -H "apikey: ${serviceKey}" \
        -H "Authorization: Bearer ${serviceKey}" \
        -H "Content-Type: application/json" \
        -H "Prefer: resolution=merge-duplicates,return=minimal" \
        --data-binary @${tmpFile}`,
      { encoding: "utf-8", shell: "/bin/bash" }
    );
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

const CLAUDE_PATH = process.env.CLAUDE_CLI_PATH || "claude";

function callClaude(prompt: string): string {
  const tmpFile = path.join(os.tmpdir(), `seed-gq-${Date.now()}.txt`);
  fs.writeFileSync(tmpFile, prompt, "utf-8");
  try {
    const env = { ...process.env };
    delete env.CLAUDECODE;
    delete env.CLAUDE_CODE;
    return execSync(
      `"${CLAUDE_PATH}" --dangerously-skip-permissions -p "$(cat ${tmpFile})"`,
      {
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024,
        env,
        shell: "/bin/bash",
      }
    ).trim();
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

function buildPrompt(questionerName: string, sectionText: string): string {
  return `あなたは市議会の会議録を市民向けに整理する専門家です。
以下の一般質問の会議録テキスト（${questionerName}議員）を市民がわかりやすい形に構造化してください。

**出力は必ず最初の文字から最後の文字まで JSON のみとすること。前置きや説明文は一切不要。**

## 会議録テキスト
${sectionText}

## 出力形式（JSONのみ。説明文・前置き不要）
{
  "questioner_party": "会派名（テキストから読み取れない場合はnull）",
  "summary": "質問全体の要約（80字以内、市民向け）",
  "topics": [
    {
      "title": "テーマタイトル（20字以内）",
      "question_summary": "質問内容の要約（100字以内）",
      "answer_summary": "答弁内容の要約（100字以内）",
      "answerer_role": "答弁者の役職（複数いる場合は「○○局長・市長」のように連記）",
      "answerer_name": "答弁者の氏名（複数の場合は「氏名A・氏名B」のように連記。不明の場合は空文字）",
      "raw_question": "このテーマに対応する議員の質問発言を原文のまま抜粋（複数回の発言は改行で連結、600文字以内）",
      "raw_answer": "このテーマに対応する答弁者の発言を原文のまま抜粋（複数回の発言は改行で連結、600文字以内）"
    }
  ]
}

## 制約
- 事実のみを要約し、政治的評価や推測は含めない
- topicsは質問者が取り上げたテーマ単位で分割する
- 原文（会議録）に登場する行政略語・専門用語はそのまま使うこと（誤った言い換えは事実誤認になる）
- 中国語簡体字・繁体字を使わず、必ず日本語の漢字を使用すること
- answerer_name は役職と氏名を別にする（answerer_role に役職、answerer_name に氏名を格納）
- raw_question / raw_answer は要約せず、会議録テキストから該当発言を忠実に抜粋すること（各600文字以内）`;
}

// Mapping: cleaned filename prefix → DB questioner_name (for correct upsert key lookup)
const NAME_CORRECTIONS: Record<string, string> = {
  金内哲昭: "金行哲昭",
  南沢克彦: "南澤克彦",
};

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const onlyIdx = args.indexOf("--only");
  const onlyFilter = onlyIdx >= 0 ? args[onlyIdx + 1] : null;
  const nonFlagArgs = args.filter((a) => !a.startsWith("--") && a !== onlyFilter);

  if (nonFlagArgs.length < 2) {
    console.error(
      "使い方: tsx akitakata/seed-from-sections.ts <session_slug> <session_day> [--dry-run] [--only <name>]"
    );
    process.exit(1);
  }

  const [sessionSlug, sessionDayStr] = nonFlagArgs;
  const sessionDay = parseInt(sessionDayStr, 10);
  const dayPrefix = `r8-1-day${sessionDay}-`;

  const cleanedDir = path.resolve(
    __dirname,
    "../../../docs/akitakata/minutes/sections/cleaned"
  );

  const allFiles = fs.readdirSync(cleanedDir).filter((f) => f.startsWith(dayPrefix));
  const files = onlyFilter
    ? allFiles.filter((f) => f.includes(onlyFilter))
    : allFiles;

  files.sort();

  if (files.length === 0) {
    console.error(`❌ ファイルが見つかりません: ${cleanedDir}/${dayPrefix}*.txt`);
    process.exit(1);
  }

  console.log(isDryRun ? "🔍 DRY RUN モード" : "🚀 seed-from-sections 開始");
  console.log(`  セッション: ${sessionSlug} / 第${sessionDay}日`);
  console.log(`  対象ファイル: ${files.length}件\n`);

  if (isDryRun) {
    for (const f of files) {
      const size = fs.statSync(path.join(cleanedDir, f)).size;
      console.log(`  ${f} (${size}bytes)`);
    }
    return;
  }

  const supabase = createAdminClient();
  const { data: session, error: sessionError } = await supabase
    .from("council_sessions")
    .select("id")
    .eq("slug", sessionSlug)
    .single();

  if (sessionError || !session) {
    console.error(`❌ セッション未発見: ${sessionError?.message}`);
    process.exit(1);
  }

  const councilSessionId = session.id;

  // Get existing records to know question_order
  const { data: existing } = await supabase
    .from("general_questions")
    .select("id,questioner_name,question_order,session_day")
    .eq("council_session_id", councilSessionId)
    .eq("session_day", sessionDay)
    .order("question_order");

  console.log(`📅 council_session_id: ${councilSessionId}`);
  console.log(`📋 既存レコード: ${existing?.length ?? 0}件\n`);

  for (const file of files) {
    // Extract name from filename: r8-1-day1-02-佐々木智之.txt → 佐々木智之
    const match = file.match(/r8-1-day\d+-(\d+)-(.+)\.txt$/);
    if (!match) continue;
    const fileNum = parseInt(match[1], 10);
    const rawNameFromFile = match[2];
    const questionerName = NAME_CORRECTIONS[rawNameFromFile] ?? rawNameFromFile;

    // Find matching DB record
    const dbRecord = existing?.find((r) => r.questioner_name === questionerName);
    if (!dbRecord) {
      console.warn(`⚠️  DBレコード未発見: ${questionerName} (fileNum=${fileNum})`);
      continue;
    }

    const sectionText = fs.readFileSync(path.join(cleanedDir, file), "utf-8");
    console.log(
      `処理中 [order=${dbRecord.question_order}]: ${questionerName} (${sectionText.length}文字)`
    );

    let topics: GeneratedTopic[] = [];
    let questionerParty: string | null = null;
    let summary = "";

    console.log("  🤖 AI構造化中...");
    try {
      const raw = callClaude(buildPrompt(questionerName, sectionText));
      let cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const jsonStart = cleaned.indexOf("{");
      const jsonEnd = cleaned.lastIndexOf("}");
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
      }

      const parsed = JSON.parse(cleaned) as {
        questioner_party?: string | null;
        summary?: string;
        topics?: GeneratedTopic[];
      };

      questionerParty = parsed.questioner_party ?? null;
      summary = parsed.summary ?? "";
      topics = (parsed.topics ?? []).map((t) => ({
        title: t.title ?? "",
        question_summary: t.question_summary ?? "",
        answer_summary: t.answer_summary ?? "",
        answerer_role: t.answerer_role ?? "",
        answerer_name: t.answerer_name ?? "",
        raw_question: t.raw_question ?? null,
        raw_answer: t.raw_answer ?? null,
      }));

      console.log(
        `  ✅ ${topics.length}件のトピック (party=${questionerParty}, summary=${summary.slice(0, 30)}...)`
      );
    } catch (err) {
      console.error(`  ❌ AI構造化エラー: ${err}`);
      continue;
    }

    upsertViaCurl({
      council_session_id: councilSessionId,
      session_day: sessionDay,
      question_order: dbRecord.question_order,
      questioner_name: questionerName,
      questioner_party: questionerParty,
      summary,
      topics,
    });

    console.log(`  💾 upsert完了: ${questionerName}`);
  }

  console.log("\n✅ 完了");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
