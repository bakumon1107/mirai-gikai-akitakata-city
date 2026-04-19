/**
 * seed-general-questions.ts
 *
 * 安芸高田市議会の一般質問PDFをパースし、
 * 議員ごとの質疑情報をAIで構造化してDBに投入する。
 *
 * 使い方:
 *   pdftotext -layout <pdf> /tmp/gijiroku.txt
 *   tsx --env-file=../../.env akitakata/seed-general-questions.ts \
 *     /tmp/gijiroku.txt <session_slug> <session_day> [--dry-run]
 *
 *   例:
 *   tsx --env-file=../../.env akitakata/seed-general-questions.ts \
 *     /tmp/r8-1-0305.txt r8-1 1
 */

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createAdminClient } from "../shared/helper";
import { parseMinutes } from "./parse-minutes";

// ─── 型 ──────────────────────────────────────────────────────

type Exchange = {
  speaker: "questioner" | "answerer";
  name: string;
  role?: string;
  text: string;
};

type Topic = {
  index: number;
  title: string;
  question_summary: string;
  answer_summary: string;
  exchanges: Exchange[];
};

type RadarScores = {
  行財政改革: number;
  "福祉・医療": number;
  "産業・経済": number;
  "教育・文化": number;
  "環境・インフラ": number;
};

type QuestionerSection = {
  questionerName: string;
  questionerNumber: number | null;
  fullName: string; // 姓名（例: "新田和明"）
  rawText: string;
};

// ─── curl upsert（execSync後にundiciのコネクションが壊れるため） ─────

function upsertViaCurl(record: Record<string, unknown>): void {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const tmpFile = path.join(os.tmpdir(), `seed-upsert-${Date.now()}.json`);
  fs.writeFileSync(tmpFile, JSON.stringify(record), "utf-8");
  try {
    execSync(
      `curl -sf -X POST "${supabaseUrl}/rest/v1/general_questions?on_conflict=council_session_id,session_day,questioner_name" \
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

// ─── Claude CLI ──────────────────────────────────────────────

const CLAUDE_PATH = process.env.CLAUDE_CLI_PATH || "claude";

function callClaude(prompt: string): string {
  const tmpFile = path.join(os.tmpdir(), `seed-gq-${Date.now()}.txt`);
  fs.writeFileSync(tmpFile, prompt, "utf-8");
  try {
    const env = { ...process.env };
    delete env.CLAUDECODE;
    delete env.CLAUDE_CODE;
    const result = execSync(
      `"${CLAUDE_PATH}" --dangerously-skip-permissions -p "$(cat ${tmpFile})"`,
      { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024, env, shell: "/bin/bash" }
    );
    return result.trim();
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

// ─── プロンプト ──────────────────────────────────────────────

function buildEnrichedPrompt(questionerName: string, sectionText: string): string {
  return `あなたは安芸高田市議会の会議録を構造化するアシスタントです。

以下は${questionerName}議員の一般質問（全文）です。
以下のJSON形式で構造化してください。

## 会議録テキスト
${sectionText.slice(0, 8000)}

## 出力形式（JSONのみ。他のテキストは一切含めないこと）
{
  "overall_summary": "この議員の質問全体を通じた2〜3文の総括（何を問い、何が明らかになったか）",
  "questioner_stance": "建設的提案型 | 批判追及型 | 情報確認型 | 課題提起型 のいずれか1つ",
  "stance_analysis": "質問者の姿勢・スタンスに対する2〜3文の分析（行政に対してポジティブか批判的か、質問の目的・動機など）",
  "radar_scores": {
    "行財政改革": 3,
    "福祉・医療": 2,
    "産業・経済": 4,
    "教育・文化": 1,
    "環境・インフラ": 5
  },
  "topics": [
    {
      "index": 1,
      "title": "テーマのタイトル（20字以内）",
      "question_summary": "質問内容の概要（2〜3文、市民が読みやすい表現で）",
      "answer_summary": "答弁内容の概要（2〜3文、市民が読みやすい表現で）",
      "exchanges": [
        {
          "speaker": "questioner",
          "name": "${questionerName}",
          "text": "発言内容を1〜3文に要約（verbatimではなく要約）"
        },
        {
          "speaker": "answerer",
          "name": "藤本市長",
          "role": "市長",
          "text": "答弁内容を1〜3文に要約"
        }
      ]
    }
  ]
}

注意:
- topics の title は大枠テーマ名をそのまま短縮してください
- exchanges は質問者と答弁者の発言を交互に、実際の会話の流れに沿って記録してください（1テーマあたり2〜8往復程度）
- summary は事実のみ書き、意見・評価は含めないでください
- questioner_stance は行政への姿勢全体から判断してください
- stance_analysis はポジティブ/ネガティブ/中立の視点を含め、質問の背景・動機まで分析してください
- radar_scores の各軸は 1〜5 の整数で採点してください（質問テーマから判断。言及なし=1、軽く触れた=2、1テーマ程度=3、複数テーマ=4、中心的議題=5）`;
}

// ─── テキスト分割 ────────────────────────────────────────────

/**
 * 会議録テキストを議員ごとのセクションに分割する
 */
function splitByQuestioner(text: string): QuestionerSection[] {
  // 「X番、XXX議員。」で各セクションを特定
  const SECTION_START_RE =
    /([0-9０-９]+)番[、，]([^\n。]{1,10}?)議員[。\n]/g;

  const matches: Array<{ pos: number; num: string; name: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = SECTION_START_RE.exec(text)) !== null) {
    matches.push({ pos: m.index, num: m[1], name: m[2].trim() });
  }

  // 重複排除（同じ議員名が複数回登場する場合は最初のみ）
  const seen = new Set<string>();
  const unique = matches.filter(({ name }) => {
    const key = name.replace(/\s/g, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const sections: QuestionerSection[] = [];
  for (let i = 0; i < unique.length; i++) {
    const { pos, num, name } = unique[i];
    const end = i + 1 < unique.length ? unique[i + 1].pos : text.length;
    const rawText = text.slice(pos, end);

    // 氏名を取得（「○XXX 議 員\nXX番、XXX和明でございます」から）
    const fullNameMatch = rawText.match(
      /[0-9０-９]+番[、，].{1,20}でございます|[0-9０-９]+番[、，].{1,20}です[。\n]/
    );
    const fullName = fullNameMatch
      ? fullNameMatch[0]
          .replace(/^[0-9０-９]+番[、，]/, "")
          .replace(/でございます.*/, "")
          .replace(/です[。\n].*/, "")
          .trim()
      : name.replace(/\s/g, "");

    sections.push({
      questionerName: name.replace(/\s/g, ""),
      questionerNumber: parseInt(num, 10) || null,
      fullName,
      rawText,
    });
  }

  return sections;
}

// ─── メイン ──────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const nonFlagArgs = args.filter((a) => !a.startsWith("--"));

  if (nonFlagArgs.length < 3) {
    console.error(
      "使い方: tsx akitakata/seed-general-questions.ts <minutes.txt> <session_slug> <session_day> [--dry-run]"
    );
    console.error("  例: tsx ... /tmp/r8-1-0305.txt r8-1 1");
    process.exit(1);
  }

  const [minutesFile, sessionSlug, sessionDayStr] = nonFlagArgs;
  const sessionDay = parseInt(sessionDayStr, 10);

  if (!fs.existsSync(minutesFile)) {
    console.error(`❌ ファイルが見つかりません: ${minutesFile}`);
    process.exit(1);
  }

  console.log(isDryRun ? "🔍 DRY RUN モード" : "🚀 seed-general-questions 開始");
  console.log(`  セッション: ${sessionSlug} / 第${sessionDay}日`);

  const minutesText = fs.readFileSync(minutesFile, "utf-8");
  console.log(`📄 読み込み完了: ${minutesText.length} chars`);

  // 一般質問セクション以降のテキストを抽出
  const gqIndex = minutesText.indexOf("日程第2 一般質問");
  const gqText =
    gqIndex >= 0 ? minutesText.slice(gqIndex) : minutesText;

  // 発言ブロックにパース（話者識別のみ使用）
  const speeches = parseMinutes(gqText);
  console.log(`💬 発言ブロック: ${speeches.length} 件`);

  // 議員セクションに分割
  const sections = splitByQuestioner(gqText);
  console.log(`👥 質問者: ${sections.length} 名`);
  for (const s of sections) {
    console.log(
      `  ${s.questionerNumber}番 ${s.questionerName}（${s.fullName}）: ${s.rawText.length} chars`
    );
  }

  if (isDryRun) {
    console.log("\n✅ DRY RUN 完了");
    return;
  }

  const supabase = createAdminClient();

  // council_session_id を slug から取得
  const { data: session, error: sessionError } = await supabase
    .from("council_sessions")
    .select("id")
    .eq("slug", sessionSlug)
    .single();

  if (sessionError || !session) {
    console.error(
      `❌ セッション未発見 (slug=${sessionSlug}):`,
      sessionError?.message
    );
    process.exit(1);
  }

  const councilSessionId = session.id;
  console.log(`\n📅 council_session_id: ${councilSessionId}`);

  let insertCount = 0;
  let errorCount = 0;

  for (const section of sections) {
    console.log(
      `\n処理中: ${section.questionerNumber}番 ${section.questionerName}`
    );

    // AI でトピック構造化（exchanges + 総括 + スタンス分析を含む）
    console.log("  🤖 AI構造化中...");
    let topics: Topic[] = [];
    let overallSummary = "";
    let questionerStance = "";
    let stanceAnalysis = "";
    let radarScores: RadarScores | null = null;

    try {
      const raw = callClaude(
        buildEnrichedPrompt(section.questionerName, section.rawText)
      );
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        overallSummary = parsed.overall_summary ?? "";
        questionerStance = parsed.questioner_stance ?? "";
        stanceAnalysis = parsed.stance_analysis ?? "";
        radarScores = parsed.radar_scores ?? null;
        topics = (parsed.topics ?? []).map(
          (t: Omit<Topic, "exchanges"> & { exchanges?: Topic["exchanges"] }, i: number) => ({
            index: t.index ?? i + 1,
            title: t.title ?? "",
            question_summary: t.question_summary ?? "",
            answer_summary: t.answer_summary ?? "",
            exchanges: t.exchanges ?? [],
          })
        );
        console.log(
          `  ✅ ${topics.length} トピック: ${topics.map((t) => t.title).join(" / ")}`
        );
        console.log(`  📊 スタンス: ${questionerStance}`);
        if (radarScores) {
          console.log(`  📡 レーダー: ${JSON.stringify(radarScores)}`);
        }
      } else {
        console.log("  ⚠️  JSONパース失敗, raw:", raw.slice(0, 120));
      }
    } catch (e) {
      console.error("  ❌ AI構造化エラー:", e);
    }

    const record = {
      council_session_id: councilSessionId,
      session_day: sessionDay,
      questioner_name: section.fullName || section.questionerName,
      questioner_number: section.questionerNumber,
      topics: topics,
      overall_summary: overallSummary,
      questioner_stance: questionerStance,
      stance_analysis: stanceAnalysis,
      radar_scores: radarScores,
      pdf_url: null,
    };

    try {
      upsertViaCurl(record);
      console.log(`  ✅ upsert完了`);
      insertCount++;
    } catch (e) {
      console.error(`  ❌ upsertエラー:`, e);
      errorCount++;
    }
  }

  console.log("\n🎉 完了");
  console.log(`  挿入/更新: ${insertCount} 件`);
  console.log(`  エラー: ${errorCount} 件`);
}

main().catch(console.error);
