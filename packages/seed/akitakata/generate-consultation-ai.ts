/**
 * generate-consultation-ai.ts
 *
 * 地域懇談会のAI列（要約・意見種別・タグ・課題カード・年度サマリー）を生成してDBに保存する。
 *
 * 使い方:
 *   tsx --env-file=../../.env.production akitakata/generate-consultation-ai.ts [fiscal_year]
 *   例: tsx ... generate-consultation-ai.ts r7
 *
 * 環境変数:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (DB接続)
 *   ANTHROPIC_API_KEY                        (Claude API)
 */

import { execSync } from "node:child_process";
import { createAdminClient } from "../shared/helper";

const FISCAL_YEAR = process.argv[2] ?? "r7";

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
    .map((op) => `[${op.id}] ${op.department} #${op.opinion_number}: ${op.text.substring(0, 300)}`)
    .join("\n\n---\n\n");

  const prompt = `安芸高田市の地域懇談会に寄せられた住民意見を分析してください。

各意見について以下を判定してください：
1. opinion_type: "demand"(要望), "proposal"(提案), "complaint"(不満・問題指摘), "question"(質問)のいずれか
2. ai_summary: 意見を50文字以内で要約（体言止め不可、〜してほしい/〜が必要/〜について/等の形で）
3. tags: 以下のタグから1〜3個選択
${tagList}

## 出力形式（JSONのみ、説明文不要）
[
  {"id": "uuid1", "opinion_type": "demand", "ai_summary": "要約テキスト", "tags": ["タグ1"]},
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
  return result;
}

async function generateIssueCards(
  consultationId: string,
  supabase: ReturnType<typeof createAdminClient>
): Promise<void> {
  console.log("\n📊 課題カード生成中...");

  const { data: opinions } = await supabase
    .from("community_consultation_opinions")
    .select("text, department, ai_summary")
    .eq("consultation_id", consultationId);

  if (!opinions?.length) return;

  const sampleText = opinions
    .slice(0, 80)
    .map((o) => `[${o.department}] ${o.ai_summary ?? o.text.substring(0, 100)}`)
    .join("\n");

  const prompt = `安芸高田市の地域懇談会（令和7年度）で寄せられた住民意見を分析し、主要な課題・テーマを6つのカードにまとめてください。

## 出力形式（JSONのみ）
[
  {
    "title": "課題タイトル（10文字以内）",
    "body": "この課題の概要と市民の声を2〜3文で説明",
    "opinionCount": 関連する意見数（概数でよい）,
    "tags": ["関連タグ1", "関連タグ2"]
  },
  ...
]

## 意見サンプル（${opinions.length}件中）
${sampleText}`;

  const raw = callClaude(prompt);
  const cards = parseJson<object[]>(raw);
  if (!cards) {
    console.warn("⚠️ 課題カード生成失敗");
    return;
  }

  await supabase
    .from("community_consultations")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ ai_issue_cards: cards as any })
    .eq("id", consultationId);

  console.log(`✅ 課題カード ${cards.length}件生成`);
}

async function generateYearSummary(
  consultationId: string,
  supabase: ReturnType<typeof createAdminClient>
): Promise<void> {
  console.log("\n📝 年度サマリー生成中...");

  const { data: opinions } = await supabase
    .from("community_consultation_opinions")
    .select("ai_summary, department")
    .eq("consultation_id", consultationId);

  if (!opinions?.length) return;

  const grouped: Record<string, string[]> = {};
  for (const op of opinions) {
    if (!grouped[op.department]) grouped[op.department] = [];
    if (op.ai_summary) grouped[op.department].push(op.ai_summary);
  }

  const summary = Object.entries(grouped)
    .map(([dept, summaries]) => `【${dept}】${summaries.slice(0, 5).join("、")}`)
    .join("\n");

  const prompt = `安芸高田市の令和7年度地域懇談会（6会場、99名参加）の意見をまとめた年度サマリーを200文字以内で作成してください。部署ごとの主要課題と市民の声を端的に表現してください。

## 部署別意見サンプル
${summary}

## 出力形式
{"summary": "サマリーテキスト"}`;

  const raw = callClaude(prompt);
  const result = parseJson<{ summary: string }>(raw);
  if (!result) {
    console.warn("⚠️ 年度サマリー生成失敗");
    return;
  }

  await supabase
    .from("community_consultations")
    .update({ ai_year_summary: result.summary })
    .eq("id", consultationId);

  console.log(`✅ 年度サマリー生成: ${result.summary.substring(0, 50)}...`);
}

async function generateMeetingQuotes(
  consultationId: string,
  supabase: ReturnType<typeof createAdminClient>
): Promise<void> {
  console.log("\n🏘️ 会場代表コメント生成中...");

  const { data: meetings } = await supabase
    .from("community_consultation_meetings")
    .select("id, location_name, theme, participant_count")
    .eq("consultation_id", consultationId);

  if (!meetings?.length) return;

  for (const meeting of meetings) {
    const prompt = `安芸高田市の地域懇談会（${meeting.location_name}会場、テーマ：${meeting.theme ?? "フリーテーマ"}、${meeting.participant_count}名参加）での市民の声を代表するような短い一言コメント（30〜50文字）を生成してください。実在の発言ではなく、その会場の雰囲気・テーマを反映した象徴的なコメントとして作成してください。

## 出力形式
{"quote": "コメントテキスト"}`;

    const raw = callClaude(prompt);
    const result = parseJson<{ quote: string }>(raw);
    if (!result) continue;

    await supabase
      .from("community_consultation_meetings")
      .update({ ai_representative_quote: result.quote })
      .eq("id", meeting.id);

    console.log(`  ✅ ${meeting.location_name}: ${result.quote.substring(0, 40)}...`);
  }
}

async function main() {
  const supabase = createAdminClient();

  // 懇談会取得
  const { data: consultation, error } = await supabase
    .from("community_consultations")
    .select("id, fiscal_year_label")
    .eq("fiscal_year", FISCAL_YEAR)
    .single();

  if (error || !consultation) {
    console.error(`❌ fiscal_year=${FISCAL_YEAR} が見つかりません。先に seed-community-consultations.ts を実行してください。`);
    process.exit(1);
  }

  console.log(`🚀 AI生成開始: ${consultation.fiscal_year_label} (${FISCAL_YEAR})`);

  // 意見取得（ai_summaryがnullのもの）
  const { data: opinions } = await supabase
    .from("community_consultation_opinions")
    .select("id, text, department, opinion_number")
    .eq("consultation_id", consultation.id)
    .is("ai_summary", null)
    .order("department")
    .order("opinion_number");

  if (!opinions?.length) {
    console.log("✅ 未処理の意見はありません");
  } else {
    console.log(`\n💬 意見AI生成: ${opinions.length}件を処理します`);
    const BATCH = 8;
    let processed = 0;

    for (let i = 0; i < opinions.length; i += BATCH) {
      const batch = opinions.slice(i, i + BATCH) as OpinionRow[];
      process.stdout.write(
        `\r  ${processed}/${opinions.length}件 (batch ${Math.floor(i / BATCH) + 1})`
      );

      let results: OpinionResult[] = [];
      try {
        results = await generateOpinionAi(batch);
      } catch (e) {
        console.warn(`\n⚠️ batch ${Math.floor(i / BATCH) + 1} 失敗、スキップ: ${(e as Error).message?.substring(0, 60)}`);
      }

      for (const result of results) {
        // opinion_type, ai_summary を更新
        await supabase
          .from("community_consultation_opinions")
          .update({
            opinion_type: result.opinion_type,
            ai_summary: result.ai_summary,
          })
          .eq("id", result.id);

        // タグ挿入
        if (result.tags?.length) {
          await supabase.from("community_consultation_opinion_tags").insert(
            result.tags.map((tag) => ({
              opinion_id: result.id,
              tag,
            }))
          );
        }
      }

      processed += batch.length;
    }

    console.log(`\n✅ 意見AI生成完了: ${processed}件`);
  }

  // 課題カード生成
  await generateIssueCards(consultation.id, supabase);

  // 年度サマリー生成
  await generateYearSummary(consultation.id, supabase);

  // 会場代表コメント生成
  await generateMeetingQuotes(consultation.id, supabase);

  console.log("\n🎉 全AI生成完了");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
