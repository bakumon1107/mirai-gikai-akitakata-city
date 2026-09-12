/**
 * evaluate-bills.ts が出力した評価結果をDBに反映する。
 * 議案の `is_featured` と `bills_tags` を更新する。
 *
 * **レビュー済みの評価結果に対して実行すること。**
 *
 * 実行:
 *   source .env.production && \
 *   NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL \
 *   SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
 *   pnpm --filter @mirai-gikai/seed exec tsx akitakata/ingest-bill-evaluations.ts <session-slug> [--dry-run]
 */

import * as fs from "node:fs";
import {
  createSeedClient,
  evaluationOutputPath,
  findBillsForEvaluation,
  isOpinionPaper,
} from "./lib/bill-pipeline";
import type { EvalResult } from "./evaluate-bills";

const FEATURE_THRESHOLD = 75;

function readEvaluations(sessionSlug: string): EvalResult[] | null {
  const filePath = evaluationOutputPath(sessionSlug);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 評価結果がありません: ${filePath}`);
    console.error("   先に evaluate-bills.ts を実行してください");
    return null;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const results = (parsed as { results?: unknown }).results;
    if (!Array.isArray(results)) {
      console.error("❌ results 配列が見つかりません");
      return null;
    }
    return results as EvalResult[];
  } catch (e) {
    console.error("❌ JSON読み込み失敗:", e instanceof Error ? e.message : e);
    return null;
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const sessionSlug = args.find((a) => a !== "--dry-run");

  if (!sessionSlug) {
    console.error(
      "使い方: tsx akitakata/ingest-bill-evaluations.ts <session-slug> [--dry-run]"
    );
    process.exitCode = 1;
    return;
  }

  const supabase = createSeedClient();
  const target = await findBillsForEvaluation(supabase, sessionSlug);
  if (!target) {
    process.exitCode = 1;
    return;
  }

  const results = readEvaluations(sessionSlug);
  if (!results) {
    process.exitCode = 1;
    return;
  }

  const { data: allTags } = await supabase.from("tags").select("id, label");
  const tagByLabel = new Map((allTags ?? []).map((t) => [t.label, t.id]));
  const billByNumber = new Map(target.bills.map((b) => [b.billNumber, b]));

  console.log(
    isDryRun
      ? `\n🔍 DRY RUN: ${target.sessionName} 反映内容の確認のみ（DBは変更しません）`
      : `\n🚀 ${target.sessionName} タグ・注目フラグを反映: ${results.length}件`
  );

  // 反映前に全件チェックし、1件でも問題があれば何も書き込まない
  const problems: string[] = [];
  for (const r of results) {
    if (!billByNumber.has(r.bill_number)) {
      problems.push(`議案 ${r.bill_number} がDBに存在しません`);
    }
    if (!tagByLabel.has(r.primary_tag)) {
      problems.push(`タグ "${r.primary_tag}" がDBに存在しません`);
    }
  }
  const evaluated = new Set(results.map((r) => r.bill_number));
  for (const b of target.bills) {
    if (!evaluated.has(b.billNumber)) {
      problems.push(`議案 ${b.billNumber} の評価結果がありません`);
    }
  }
  if (problems.length > 0) {
    console.error("\n❌ 反映を中止します:");
    for (const p of problems) console.error(`  - ${p}`);
    process.exitCode = 1;
    return;
  }

  // 意見書はスコアに関わらず注目議案にする
  const featuredNumbers = new Set(
    results
      .filter((r) => {
        const bill = billByNumber.get(r.bill_number);
        if (bill && isOpinionPaper(bill.name)) return true;
        return !r.excluded && r.score >= FEATURE_THRESHOLD;
      })
      .map((r) => r.bill_number)
  );

  for (const r of results) {
    const bill = billByNumber.get(r.bill_number);
    if (!bill) continue;
    const isFeatured = featuredNumbers.has(r.bill_number);
    const opinion = isOpinionPaper(bill.name);
    console.log(
      `  ${isFeatured ? "★" : " "} [${r.bill_number}] ${r.primary_tag}${opinion ? " (意見書→注目)" : ""}`
    );
    if (isDryRun) continue;

    const { error: billError } = await supabase
      .from("bills")
      .update({ is_featured: isFeatured })
      .eq("id", bill.id);
    if (billError) {
      console.error(`  ❌ is_featured 更新失敗:`, billError.message);
      continue;
    }

    // タグは1議案1件に付け替える
    await supabase.from("bills_tags").delete().eq("bill_id", bill.id);
    const { error: tagError } = await supabase
      .from("bills_tags")
      .insert({ bill_id: bill.id, tag_id: tagByLabel.get(r.primary_tag)! });
    if (tagError) {
      console.error(`  ❌ bills_tags INSERT失敗:`, tagError.message);
    }
  }

  console.log(
    isDryRun
      ? `\n\n✨ DRY RUN 完了（注目議案 ${featuredNumbers.size}件）`
      : `\n\n✨ 完了: 注目議案 ${featuredNumbers.size}件`
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
