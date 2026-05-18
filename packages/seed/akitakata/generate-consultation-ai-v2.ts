/**
 * generate-consultation-ai-v2.ts
 *
 * 地域懇談会の AI 列を2フェーズで再生成する。
 *
 * Phase 1 (generate): 全意見を Claude CLI で処理し /tmp/ai-results-<fiscal_year>.json に保存。
 *                     中断しても再実行で未処理分から再開する。
 * Phase 2 (commit):   保存済み JSON を確認後、DB を一括更新する。
 *                     既存データが消える期間をゼロにする。
 *
 * 使い方:
 *   # Phase 1: 生成だけ（DBは触らない）
 *   tsx --env-file=../../.env.production akitakata/generate-consultation-ai-v2.ts r7 generate
 *
 *   # Phase 2: DB一括更新（Phase 1 完了後）
 *   tsx --env-file=../../.env.production akitakata/generate-consultation-ai-v2.ts r7 commit
 *
 *   # 両方まとめて実行
 *   tsx --env-file=../../.env.production akitakata/generate-consultation-ai-v2.ts r7 all
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createAdminClient } from "../shared/helper";

const FISCAL_YEAR = process.argv[2] ?? "r7";
const MODE = (process.argv[3] ?? "all") as "generate" | "commit" | "all";
const RESULTS_FILE = `/tmp/ai-results-${FISCAL_YEAR}.json`;

const OPINION_TAGS = [
  "防災・防犯",
  "交通・インフラ",
  "農業・産業",
  "医療・福祉",
  "教育",
  "子育て",
  "移住・定住",
  "地域コミュニティ",
  "行財政",
  "観光・地域振興",
  "環境・自然",
  "スポーツ・文化",
  "空き家",
  "デジタル・ICT",
  "議会・行政改革",
];

type OpinionRow = {
  id: string;
  text: string;
  department: string;
  opinion_number: number | null;
};

type OpinionResult = {
  id: string;
  opinion_type: "demand" | "proposal" | "complaint" | "question";
  ai_summary: string;
  tags: string[];
};

type ResultsFile = {
  fiscal_year: string;
  generated_at: string;
  opinions: OpinionResult[];
};

function callClaude(prompt: string): string {
  const escaped = prompt.replace(/'/g, "'\\''");
  return execSync(`claude -p '${escaped}' --output-format text`, {
    encoding: "utf-8",
    timeout: 180_000,
  });
}

function parseJson<T>(raw: string): T | null {
  const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}

async function generateOpinionAi(
  opinions: OpinionRow[]
): Promise<OpinionResult[]> {
  const tagList = OPINION_TAGS.map((t) => `- ${t}`).join("\n");
  const opinionsText = opinions
    .map(
      (op) =>
        `[${op.id}] ${op.department} #${op.opinion_number}: ${op.text.substring(0, 400)}`
    )
    .join("\n\n---\n\n");

  const prompt = `安芸高田市の地域懇談会に寄せられた住民意見を分析してください。

各意見について以下を判定してください：
1. opinion_type: "demand"(要望), "proposal"(提案), "complaint"(不満・問題指摘), "question"(質問)のいずれか
2. ai_summary: 意見の核心を60文字以内で要約。原文の言葉を活かし、主語を省略せず「〜を要望」「〜が課題」「〜してほしい」等の形で。推測や補足は加えない。
3. tags: 以下のタグから1〜3個選択（リスト外のタグは使用禁止）
${tagList}

## 出力形式（JSONのみ、説明文不要）
[
  {"id": "uuid", "opinion_type": "demand", "ai_summary": "要約テキスト", "tags": ["タグ1"]},
  ...
]

## 意見一覧
${opinionsText}`;

  const raw = callClaude(prompt);
  const result = parseJson<OpinionResult[]>(raw);
  if (!result) {
    console.warn("⚠️ JSON parse failed, skipping batch");
    return [];
  }

  // タグをリストに存在するものだけに絞る
  const validTags = new Set(OPINION_TAGS);
  for (const r of result) {
    r.tags = (r.tags ?? []).filter((t) => validTags.has(t));
  }

  return result;
}

// ─── Phase 1: 生成 ────────────────────────────────────────────────────────────

async function phaseGenerate(
  supabase: ReturnType<typeof createAdminClient>,
  consultationId: string
) {
  console.log("\n📋 Phase 1: AI生成（DB未更新）");

  // 全意見取得
  const { data: allOpinions } = await supabase
    .from("community_consultation_opinions")
    .select("id, text, department, opinion_number")
    .eq("consultation_id", consultationId)
    .order("department")
    .order("opinion_number");

  if (!allOpinions?.length) {
    console.error("❌ 意見が見つかりません");
    return;
  }

  // 保存済み結果を読み込む（再開用）
  let savedResults: Map<string, OpinionResult> = new Map();
  if (fs.existsSync(RESULTS_FILE)) {
    const saved: ResultsFile = JSON.parse(
      fs.readFileSync(RESULTS_FILE, "utf-8")
    );
    savedResults = new Map(saved.opinions.map((r) => [r.id, r]));
    console.log(`  📂 保存済み: ${savedResults.size}件 (${RESULTS_FILE})`);
  }

  // 未処理の意見だけ処理
  const unprocessed = (allOpinions as OpinionRow[]).filter(
    (op) => !savedResults.has(op.id)
  );
  console.log(
    `  処理対象: ${unprocessed.length}件 / 全${allOpinions.length}件`
  );

  if (unprocessed.length === 0) {
    console.log("  ✅ 全件処理済みです");
    return;
  }

  const BATCH = 8;
  let processed = 0;

  for (let i = 0; i < unprocessed.length; i += BATCH) {
    const batch = unprocessed.slice(i, i + BATCH);
    process.stdout.write(
      `\r  ${processed}/${unprocessed.length}件 (batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(unprocessed.length / BATCH)})`
    );

    let results: OpinionResult[] = [];
    try {
      results = await generateOpinionAi(batch);
    } catch (e) {
      console.warn(
        `\n⚠️ batch失敗、スキップ: ${(e as Error).message?.substring(0, 80)}`
      );
    }

    for (const r of results) {
      savedResults.set(r.id, r);
    }

    // 都度ファイル保存（中断時の損失を最小化）
    const toSave: ResultsFile = {
      fiscal_year: FISCAL_YEAR,
      generated_at: new Date().toISOString(),
      opinions: Array.from(savedResults.values()),
    };
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(toSave, null, 2), "utf-8");

    processed += batch.length;
  }

  console.log(
    `\n✅ Phase 1完了: ${savedResults.size}件を ${RESULTS_FILE} に保存`
  );
  console.log("   内容を確認後、Phase 2 (commit) を実行してください");
}

// ─── Phase 2: DB一括更新 ──────────────────────────────────────────────────────

async function phaseCommit(
  supabase: ReturnType<typeof createAdminClient>,
  consultationId: string
) {
  console.log("\n🚀 Phase 2: DB一括更新");

  if (!fs.existsSync(RESULTS_FILE)) {
    console.error(`❌ 結果ファイルが見つかりません: ${RESULTS_FILE}`);
    console.error("   先に generate フェーズを実行してください");
    return;
  }

  const saved: ResultsFile = JSON.parse(
    fs.readFileSync(RESULTS_FILE, "utf-8")
  );
  console.log(
    `  ${saved.opinions.length}件を更新します (生成日時: ${saved.generated_at})`
  );

  // 1. opinion_tags を一括削除（この consultation の全意見）
  console.log("  🗑️  既存タグを削除中...");
  const { data: opinionIds } = await supabase
    .from("community_consultation_opinions")
    .select("id")
    .eq("consultation_id", consultationId);

  if (opinionIds?.length) {
    const ids = opinionIds.map((o) => o.id);
    const CHUNK = 100;
    for (let i = 0; i < ids.length; i += CHUNK) {
      await supabase
        .from("community_consultation_opinion_tags")
        .delete()
        .in("opinion_id", ids.slice(i, i + CHUNK));
    }
  }
  console.log("  ✅ タグ削除完了");

  // 2. opinion ai_summary / opinion_type を一括更新
  console.log("  ✏️  意見 ai_summary / opinion_type を更新中...");
  let updated = 0;
  for (const r of saved.opinions) {
    await supabase
      .from("community_consultation_opinions")
      .update({
        ai_summary: r.ai_summary,
        opinion_type: r.opinion_type,
      })
      .eq("id", r.id);
    updated++;
    if (updated % 50 === 0) {
      process.stdout.write(`\r    ${updated}/${saved.opinions.length}件`);
    }
  }
  console.log(`\n  ✅ 意見更新完了: ${updated}件`);

  // 3. タグを一括挿入
  console.log("  🏷️  タグを挿入中...");
  const tagRows = saved.opinions.flatMap((r) =>
    r.tags.map((tag) => ({ opinion_id: r.id, tag }))
  );

  const TAG_BATCH = 200;
  let tagInserted = 0;
  for (let i = 0; i < tagRows.length; i += TAG_BATCH) {
    const { error } = await supabase
      .from("community_consultation_opinion_tags")
      .insert(tagRows.slice(i, i + TAG_BATCH));
    if (error) {
      console.warn(`⚠️ タグ挿入エラー: ${error.message}`);
    }
    tagInserted += Math.min(TAG_BATCH, tagRows.length - i);
  }
  console.log(`  ✅ タグ挿入完了: ${tagInserted}件`);

  // 4. 課題カード再生成
  await regenerateIssueCards(supabase, consultationId, saved.opinions);

  // 5. 年度サマリー再生成
  await regenerateYearSummary(supabase, consultationId, saved.opinions);

  console.log("\n🎉 Phase 2完了");
}

async function regenerateIssueCards(
  supabase: ReturnType<typeof createAdminClient>,
  consultationId: string,
  opinions: OpinionResult[]
) {
  console.log("\n  📊 課題カード再生成中...");

  const { data: fullOpinions } = await supabase
    .from("community_consultation_opinions")
    .select("text, department")
    .eq("consultation_id", consultationId);

  if (!fullOpinions?.length) return;

  const tagList = OPINION_TAGS.map((t) => `- ${t}`).join("\n");

  // 部署ごとに均等サンプリング
  const byDept: Record<string, string[]> = {};
  for (const op of fullOpinions) {
    if (!byDept[op.department]) byDept[op.department] = [];
    byDept[op.department].push(op.text.substring(0, 120).replace(/\n/g, " "));
  }
  const sampleLines = Object.entries(byDept).flatMap(([dept, texts]) =>
    texts.slice(0, 8).map((t) => `[${dept}] ${t}`)
  );

  // タグ別件数を集計
  const tagCounts: Record<string, number> = {};
  for (const op of opinions) {
    for (const tag of op.tags) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }

  const prompt = `安芸高田市の令和7年度地域懇談会（6会場・99名・${opinions.length}件の意見）を分析し、市民が語った構造的な課題を6つのカードにまとめてください。

## 制約
- 特定の一意見でなく、複数の会場・部署に共通する課題を抽出すること
- tagsは以下リストから1〜3個のみ選択（リスト外は禁止）
${tagList}
- opinionCountはtags[0]の実際の件数を参考にすること（参考値: ${Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([t, n]) => `${t}:${n}`)
    .join(", ")}）

## 出力形式（JSONのみ）
[
  {
    "title": "課題タイトル（10文字以内）",
    "body": "この課題の背景・市民の声・課題の本質を2〜3文で説明",
    "opinionCount": tags[0]の件数（上記参考値を使用）,
    "tags": ["タグ1", "タグ2"]
  }
]

## 部署別意見サンプル
${sampleLines.join("\n")}`;

  const raw = callClaude(prompt);
  const cards = parseJson<object[]>(raw);
  if (!cards) {
    console.warn("  ⚠️ 課題カード生成失敗");
    return;
  }

  // opinionCount を実際のタグ件数で上書き
  const validTags = new Set(OPINION_TAGS);
  for (const card of cards as Array<{
    tags: string[];
    opinionCount: number;
  }>) {
    card.tags = card.tags.filter((t) => validTags.has(t));
    if (card.tags.length > 0) {
      card.opinionCount = tagCounts[card.tags[0]] ?? card.opinionCount;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await supabase
    .from("community_consultations")
    .update({ ai_issue_cards: cards as any })
    .eq("id", consultationId);

  console.log(`  ✅ 課題カード ${cards.length}件`);
  for (const c of cards as Array<{
    title: string;
    tags: string[];
    opinionCount: number;
  }>) {
    console.log(`    [${c.tags.join(", ")}] ${c.title} (${c.opinionCount}件)`);
  }
}

async function regenerateYearSummary(
  supabase: ReturnType<typeof createAdminClient>,
  consultationId: string,
  opinions: OpinionResult[]
) {
  console.log("\n  📝 年度サマリー再生成中...");

  const { data: fullOpinions } = await supabase
    .from("community_consultation_opinions")
    .select("ai_summary, department")
    .eq("consultation_id", consultationId);

  if (!fullOpinions?.length) return;

  const grouped: Record<string, string[]> = {};
  for (const op of fullOpinions) {
    if (!grouped[op.department]) grouped[op.department] = [];
    if (op.ai_summary) grouped[op.department].push(op.ai_summary);
  }

  const summary = Object.entries(grouped)
    .map(([dept, summaries]) => `【${dept}】${summaries.slice(0, 5).join("、")}`)
    .join("\n");

  const prompt = `安芸高田市の令和7年度地域懇談会（6会場、99名参加、${opinions.length}件の意見）の年度サマリーを200文字以内で作成してください。主要テーマと市民の声を端的に表現してください。

## 部署別意見サンプル
${summary}

## 出力形式
{"summary": "サマリーテキスト"}`;

  const raw = callClaude(prompt);
  const result = parseJson<{ summary: string }>(raw);
  if (!result) {
    console.warn("  ⚠️ 年度サマリー生成失敗");
    return;
  }

  await supabase
    .from("community_consultations")
    .update({ ai_year_summary: result.summary })
    .eq("id", consultationId);

  console.log(`  ✅ 年度サマリー: ${result.summary.substring(0, 60)}...`);
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!["generate", "commit", "all"].includes(MODE)) {
    console.error("Usage: tsx generate-consultation-ai-v2.ts <fiscal_year> <generate|commit|all>");
    process.exit(1);
  }

  const supabase = createAdminClient();

  const { data: consultation, error } = await supabase
    .from("community_consultations")
    .select("id, fiscal_year_label")
    .eq("fiscal_year", FISCAL_YEAR)
    .single();

  if (error || !consultation) {
    console.error(`❌ fiscal_year=${FISCAL_YEAR} が見つかりません`);
    process.exit(1);
  }

  console.log(`🚀 対象: ${consultation.fiscal_year_label} (${FISCAL_YEAR})`);
  console.log(`📁 結果ファイル: ${RESULTS_FILE}`);

  if (MODE === "generate" || MODE === "all") {
    await phaseGenerate(supabase, consultation.id);
  }

  if (MODE === "commit" || MODE === "all") {
    await phaseCommit(supabase, consultation.id);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
