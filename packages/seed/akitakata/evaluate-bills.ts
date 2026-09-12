/**
 * 議案のタグと注目フラグ（is_featured）をAIで評価し、ローカルJSONに出力する。
 *
 * **この工程を飛ばすとトップページに議案が1件も出ない。**
 * トップの「注目の議案」は `is_featured`、「タグ別議案一覧」は
 * `featured_priority` 付きタグに紐づく議案しか拾わないため、
 * タグ未設定の議案はDBに登録されていても画面に現れない。
 *
 * **このスクリプトはDBに一切書き込まない。**
 * 出力をレビューしてから ingest-bill-evaluations.ts で反映すること。
 *
 * 実行:
 *   source .env.production && \
 *   NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL \
 *   SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
 *   pnpm --filter @mirai-gikai/seed exec tsx akitakata/evaluate-bills.ts <session-slug>
 *
 * 評価ロジックは admin/src/features/ai-collection の auto-feature-evaluator と同じ考え方。
 */

import * as fs from "node:fs";
import {
  type BillForEval,
  callClaudeJson,
  createSeedClient,
  evaluationOutputPath,
  findBillsForEvaluation,
  isOpinionPaper,
} from "./lib/bill-pipeline";

/** tags テーブルの label と一致させること */
const AVAILABLE_TAGS = [
  "福祉・医療🏥",
  "教育📚",
  "住宅・まちづくり🏠",
  "移住・定住🏡",
  "農林業・環境🌿",
  "道路・インフラ🛣️",
  "議員提出📣",
  "予算・財政💰",
  "組織・人事👥",
] as const;

const FEATURE_THRESHOLD = 75;
const EVAL_BATCH_SIZE = 5;

export type EvalResult = {
  bill_number: string;
  score: number;
  excluded: boolean;
  reason: string;
  breakdown: { influence_range: number; life_impact: number; interest: number };
  primary_tag: string;
};

function buildEvalPrompt(bills: BillForEval[]): string {
  const billsText = bills
    .map(
      (b) =>
        `【ID:${b.billNumber}】${b.name}\nタイトル: ${b.title}\n概要: ${b.summary}\n本文:\n${b.content.slice(0, 800)}`
    )
    .join("\n\n---\n\n");

  return `あなたは安芸高田市議会の議案を市民目線で評価する専門家です。
以下の議案それぞれについて、市民への影響度を評価してください。

## 評価基準（100点満点）

### 1. 市民への直接影響範囲（45点満点）
- 45点: 安芸高田市民全体に広く影響する（医療・福祉・教育・交通・税など）
- 30点: 特定の世代や状況の市民に影響する（子育て世代、高齢者、移住者など）
- 15点: 一部の市民・事業者に影響する
- 0点:  市役所内部や特定業者のみ、一般市民への影響がほぼない

### 2. 生活への具体的変化（35点満点）
高く評価するのは「市民自身の」行動・選択肢・費用・受けられるサービスが変わる場合。
行政や業者・専門職の手続きや権限が変わるだけで、市民の日常に変化が生じない場合は低く評価すること。

- 35点: 市民自身の家計・日常生活に直接的・具体的な変化をもたらす
- 20点: 市民が受けられるサービスや手続きに変化が生じる
- 10点: 市民生活に間接的に影響する可能性がある
-  0点: 行政・業者・専門職側の手続きや権限・体制が変わるだけで、
        市民自身の行動・生活は変わらない

### 3. 話題性・関心度（20点満点）
- 20点: 移住・定住・過疎対策・医療・農林業・環境・子育てなど市民関心が高いテーマ
- 10点: 住宅・道路・産業・インフラなど一定の関心があるテーマ
- 0点:  行政内部の手続き・人事・会計処理など関心が低いテーマ

## 除外ルール
**意見書は市民の関心が高いため、除外せず（excluded: false）に評価してください。**
以下に該当する議案は、スコアに関係なく excluded: true にしてください：
- 予算案・補正予算案（条例・制度の変更を伴わないもの、および一般会計・特別会計・各財産区の予算案全般）
- 決算の認定（一般会計・特別会計・各財産区・事業会計のいずれも）
- 職員給与・定数・特殊勤務手当等の内部調整
- 和解・契約締結・外部監査契約のみの議案
- 人事案件（同意・諮問）
- 法令改正に伴う形式的な規定整備のみ

## 主要タグ選択
**excluded の議案も含め、全議案に必ずタグを1つ付けてください**
（タグが無いと議案一覧に表示されません）。
以下のタグから議案の内容に最も合うものを**1つだけ**選んでください：
${AVAILABLE_TAGS.map((t) => `- ${t}`).join("\n")}

- 発議・意見書・議員提案は「議員提出📣」を優先
- 予算・補正予算・決算認定は「予算・財政💰」を優先（他の条件と重なる場合も）
- 組織改編・人事・給与・同意・諮問は「組織・人事👥」

## 出力形式
必ずJSON配列のみを出力してください。説明文は不要です。

\`\`\`json
[
  {
    "bill_number": "<【ID:xxx】のxxxをそのまま返す>",
    "breakdown": {
      "influence_range": <0-45の整数>,
      "life_impact": <0-35の整数>,
      "interest": <0-20の整数>
    },
    "score": <合計点>,
    "excluded": <true|false>,
    "reason": "<50文字以内で評価理由>",
    "primary_tag": "<上記タグから1つ>"
  }
]
\`\`\`

## 評価対象議案

${billsText}`;
}

function toEvalResults(parsed: unknown): EvalResult[] | null {
  if (!Array.isArray(parsed)) return null;
  const results: EvalResult[] = [];
  for (const item of parsed) {
    if (typeof item !== "object" || item === null) return null;
    const r = item as Record<string, unknown>;
    if (typeof r.bill_number !== "string" || r.bill_number === "") return null;
    if (typeof r.score !== "number") return null;
    if (typeof r.excluded !== "boolean") return null;
    if (typeof r.primary_tag !== "string") return null;
    if (!AVAILABLE_TAGS.includes(r.primary_tag as (typeof AVAILABLE_TAGS)[number])) {
      console.error(`  ❌ 未知のタグ: ${r.primary_tag}`);
      return null;
    }
    results.push({
      bill_number: r.bill_number,
      score: r.score,
      excluded: r.excluded,
      reason: typeof r.reason === "string" ? r.reason : "",
      primary_tag: r.primary_tag,
      breakdown: (r.breakdown ?? {
        influence_range: 0,
        life_impact: 0,
        interest: 0,
      }) as EvalResult["breakdown"],
    });
  }
  return results;
}

async function main(): Promise<void> {
  const sessionSlug = process.argv[2];
  if (!sessionSlug) {
    console.error("使い方: tsx akitakata/evaluate-bills.ts <session-slug>");
    process.exitCode = 1;
    return;
  }

  const supabase = createSeedClient();
  const target = await findBillsForEvaluation(supabase, sessionSlug);
  if (!target) {
    process.exitCode = 1;
    return;
  }
  if (target.bills.length === 0) {
    console.error("評価対象の議案がありません（解説が未登録の可能性）");
    process.exitCode = 1;
    return;
  }

  const destPath = evaluationOutputPath(sessionSlug);
  console.log(
    `\n🤖 ${target.sessionName} 議案のタグ・注目フラグを評価: ${target.bills.length}件`
  );
  console.log(`   出力先: ${destPath}（DBには書き込みません）`);

  const allResults: EvalResult[] = [];
  let failures = 0;

  for (let i = 0; i < target.bills.length; i += EVAL_BATCH_SIZE) {
    const batch = target.bills.slice(i, i + EVAL_BATCH_SIZE);
    const nums = batch.map((b) => b.billNumber).join(", ");
    console.log(`\n🤖 バッチ評価中: ${nums}`);
    const results = toEvalResults(callClaudeJson(buildEvalPrompt(batch)));
    if (!results) {
      console.error(`  ❌ バッチ失敗 (${nums})`);
      failures += 1;
      continue;
    }
    allResults.push(...results);
    for (const r of results) {
      const bill = batch.find((b) => b.billNumber === r.bill_number);
      const opinion = bill ? isOpinionPaper(bill.name) : false;
      const isFeatured =
        opinion || (!r.excluded && r.score >= FEATURE_THRESHOLD);
      console.log(
        `  ${isFeatured ? "★" : " "} [${r.bill_number}] ${r.score}点 ${r.excluded ? "(除外)" : ""}${opinion ? "(意見書→注目)" : ""} ${r.primary_tag} - ${r.reason}`
      );
    }
  }

  // 取りこぼしがあると、その議案はタグが付かず一覧から消える
  const evaluated = new Set(allResults.map((r) => r.bill_number));
  const missing = target.bills
    .map((b) => b.billNumber)
    .filter((n) => !evaluated.has(n));

  fs.writeFileSync(
    destPath,
    `${JSON.stringify({ sessionSlug, results: allResults }, null, 2)}\n`,
    "utf-8"
  );

  if (missing.length > 0) {
    console.error(`\n❌ 未評価の議案: ${missing.join(", ")}`);
    console.error("   再実行するか、プロンプトを見直してください");
    process.exitCode = 1;
    return;
  }
  if (failures > 0) {
    console.error(`\n❌ ${failures}バッチが失敗しました`);
    process.exitCode = 1;
    return;
  }

  const featured = allResults.filter((r) => {
    const bill = target.bills.find((b) => b.billNumber === r.bill_number);
    return (
      (bill && isOpinionPaper(bill.name)) ||
      (!r.excluded && r.score >= FEATURE_THRESHOLD)
    );
  });
  console.log(`\n\n✨ 評価完了: 注目議案 ${featured.length}件`);
  console.log(
    "   内容をレビューしてから ingest-bill-evaluations.ts を実行してください"
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
