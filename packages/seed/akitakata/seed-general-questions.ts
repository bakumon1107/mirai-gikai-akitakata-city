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

type GeneratedTopic = {
  title: string;
  question_summary: string;
  answer_summary: string;
  answerer_role: string;
  answerer_name: string;
  raw_question?: string | null;
  raw_answer?: string | null;
};

type QuestionerSection = {
  questionerName: string;
  questionerNumber: number | null;
  fullName: string;
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

// ─── テキスト前処理 ──────────────────────────────────────────

/**
 * 会議録テキストから不要な要素を除去する
 * - 【速報版】ページマーカー行（前後の空白行も含む）
 * - 議長の進行発言（「答弁を求めます」「以上で答弁を終わります」「○○議員。」等）
 */
function cleanMinutesText(text: string): string {
  return text
    // 【速報版】を含む行（前のページ番号行も含めて）を除去
    .replace(/^[ \t]*\d+[ \t]*\n[ \t]*【速報版】[ \t]*\n?/gm, "")
    .replace(/【速報版】/g, "")
    // 議長の発言ブロック（○〜議 長 で始まる行から次の○まで）を除去
    .replace(/^○[^\n]*議\s*長[^\n]*\n(?:[^○\n][^\n]*\n)*/gm, "")
    // ページ番号だけの行（空白＋数字1〜3桁）を除去
    .replace(/^[ \t]*\d{1,3}[ \t]*$/gm, "")
    // 連続する空行を1行に圧縮
    .replace(/\n{3,}/g, "\n\n");
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

// ─── プロンプト ──────────────────────────────────────────────

function buildPrompt(questionerName: string, sectionText: string): string {
  const cleanedText = cleanMinutesText(sectionText);
  return `あなたは市議会の会議録を市民向けに整理する専門家です。
以下の一般質問の会議録テキスト（${questionerName}議員）を市民がわかりやすい形に構造化してください。

**出力は必ず最初の文字から最後の文字まで JSON のみとすること。前置きや説明文は一切不要。**

## 会議録テキスト
${cleanedText}

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

// ─── 出席議員一覧からフルネームマップを構築 ────────────────────

/**
 * 「２．出席議員は次のとおりである」セクションから
 * 議員番号→フルネームのマップを作成する
 */
function buildMemberNameMap(text: string): Map<number, string> {
  const map = new Map<number, string>();
  const startIdx = text.indexOf("出席議員は次のとおりである");
  if (startIdx < 0) return map;
  const sectionText = text.slice(startIdx, startIdx + 1000);

  const toHalf = (s: string) =>
    s.replace(/[０-９]/g, (c) => String(c.charCodeAt(0) - 0xff10));

  // 「１番    氏 名」「１０番       氏   名」のパターン（全角数字+番+スペース+氏名）
  // 氏名部分はスペース・全角スペース区切りの漢字/かな文字列
  const ENTRY_RE = /([０-９]{1,2})番[ 　]{1,8}((?:[^\s０-９\d\n]+[ 　]*){1,4})/g;
  let m: RegExpExecArray | null;
  while ((m = ENTRY_RE.exec(sectionText)) !== null) {
    const num = parseInt(toHalf(m[1]), 10);
    const name = m[2].replace(/\s/g, "").trim();
    if (!isNaN(num) && name.length >= 2 && name.length <= 8) {
      map.set(num, name);
    }
  }
  return map;
}

// ─── テキスト分割 ────────────────────────────────────────────

function splitByQuestioner(text: string, fullText = text): QuestionerSection[] {
  // 出席議員一覧は文書冒頭にあるため、GQスライス前のフルテキストから構築する
  const memberNameMap = buildMemberNameMap(fullText);

  // 「8番、新田議員。」（カンマ）「10番 児玉議員。」（スペース）「9 番 山根議員。」（番の前後にスペース）の形式に対応
  const SECTION_START_RE =
    /([0-9０-９]+)\s*番[、，\s]([^\n。]{1,10}?)議員[。\n]/g;

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

    // 形式1: 「8番、新田和明でございます」「6番 南沢克彦です。」（数字+番+名前）
    // 「の」を含むものは質問番号（「2番、次の質問です。」）の誤マッチを防ぐため除外
    const fullNameByNumber = rawText.match(
      /[0-9０-９]+\s*番[、，\s][^\nの。]{2,15}でございます|[0-9０-９]+\s*番[、，\s][^\nの。]{2,15}です[。\n]/
    );
    // 形式2: 「熊高昌三です。」（数字なし、姓+名で計4〜5文字以内）
    // ○ではじまる議員発言の最初のブロックから抽出
    const firstSpeakerBlock = rawText.match(/○[^\n]+\n(?:[^\n]*\n){0,3}/)?.[0] ?? "";
    const fullNameDirect = firstSpeakerBlock.match(/([^\s　。、\n（(]{2,6}(?:でございます|です)[。\n])/);
    const fullName = fullNameByNumber
      ? fullNameByNumber[0]
          .replace(/^[0-9０-９]+\s*番[、，\s]/, "")
          .replace(/でございます.*/, "")
          .replace(/です[。\n].*/, "")
          .trim()
      : fullNameDirect
        ? fullNameDirect[1]
            .replace(/でございます.*/, "")
            .replace(/です[。\n].*/, "")
            .trim()
        : memberNameMap.get(parseInt(num, 10)) ?? name.replace(/\s/g, "");

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
  const sections = splitByQuestioner(gqText, minutesText);
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

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const questionOrder = i + 1;

    console.log(
      `\n処理中 [${questionOrder}/${sections.length}]: ${section.questionerNumber}番 ${section.questionerName}`
    );

    let topics: GeneratedTopic[] = [];
    let questionerParty: string | null = null;
    let summary = "";

    console.log("  🤖 AI構造化中...");
    try {
      const raw = callClaude(buildPrompt(section.questionerName, section.rawText));
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
        `  ✅ ${topics.length} トピック: ${topics.map((t) => t.title).join(" / ")}`
      );
    } catch (e) {
      console.error("  ❌ AI構造化エラー:", e);
    }

    const record = {
      council_session_id: councilSessionId,
      session_day: sessionDay,
      question_order: questionOrder,
      questioner_name: section.fullName || section.questionerName,
      questioner_number: section.questionerNumber,
      questioner_party: questionerParty,
      summary,
      topics,
      raw_text: section.rawText,
      source_url: null,
      publish_status: "draft",
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
  console.log("  publish_status は 'draft' で登録されました。DBを直接更新して公開してください。");
}

main().catch(console.error);
