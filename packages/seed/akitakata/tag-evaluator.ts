/**
 * 安芸高田市 議案タグ自動評価スクリプト
 *
 * 全 published 議案の bill_contents.summary + 議案名を元に
 * Claude CLI でタグを判定し、bills_tags テーブルに INSERT する。
 */

import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@mirai-gikai/supabase";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── タグ一覧（DBから取得） ────────────────────────────────────
type TagRow = { id: string; label: string };

async function fetchTags(): Promise<TagRow[]> {
  const { data, error } = await supabase.from("tags").select("id, label");
  if (error) throw new Error(`tags fetch error: ${error.message}`);
  return data ?? [];
}

// ─── Claude CLI でタグを判定 ──────────────────────────────────
function evaluateTags(
  billName: string,
  summary: string,
  availableTags: TagRow[]
): string[] {
  const tagList = availableTags.map((t) => `- ${t.label}`).join("\n");

  const prompt = `あなたは安芸高田市議会の議案を分析するアシスタントです。
以下の議案に対して、適切なタグを選択してください。

## 選択可能なタグ
${tagList}

## ルール
- 1議案に複数タグ付与可（最大3つ）
- 必ず1つ以上付与すること
- 予算・補正予算を含む議案は必ず「予算・財政💰」を付与する
- 発議・意見書・議員条例は「議員提出📣」を必ず付与する

## 出力形式（JSONのみ出力、説明文不要）
{"tags": ["タグラベル1", "タグラベル2"]}

## 議案情報
名称: ${billName}
内容（要約）: ${summary}`;

  const escaped = prompt.replace(/'/g, "'\\''");
  try {
    const raw = execSync(`claude -p '${escaped}' --output-format text`, {
      encoding: "utf-8",
      timeout: 60_000,
    });
    const match = raw.match(/\{[\s\S]*?\}/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]) as { tags: string[] };
    return parsed.tags ?? [];
  } catch (e) {
    console.error("  Claude error:", (e as Error).message?.slice(0, 100));
    return [];
  }
}

// ─── メイン ───────────────────────────────────────────────────
async function main() {
  const tags = await fetchTags();
  console.log(`\n📌 利用可能タグ: ${tags.map((t) => t.label).join(", ")}\n`);

  // published 議案 + normal summary を取得
  const { data: bills, error } = await supabase
    .from("bills")
    .select(
      `id, name, bill_number,
       bill_contents!inner(difficulty_level, summary)`
    )
    .eq("publish_status", "published")
    .eq("bill_contents.difficulty_level", "normal");

  if (error) throw new Error(`bills fetch: ${error.message}`);
  if (!bills || bills.length === 0) {
    console.log("published 議案がありません");
    return;
  }

  console.log(`🚀 ${bills.length}件の議案を処理\n`);

  for (const bill of bills) {
    const summary = Array.isArray(bill.bill_contents)
      ? (bill.bill_contents[0]?.summary ?? "")
      : ((bill.bill_contents as { summary: string } | null)?.summary ?? "");

    console.log(`────────────────────────────────`);
    console.log(`📋 [${bill.bill_number ?? "-"}] ${bill.name.slice(0, 35)}...`);

    // 既存タグを確認
    const { count } = await supabase
      .from("bills_tags")
      .select("*", { count: "exact", head: true })
      .eq("bill_id", bill.id);

    if ((count ?? 0) > 0) {
      console.log(`  ⏭️  タグ付与済み（${count}件）、スキップ`);
      continue;
    }

    // Claude でタグ評価
    console.log("  🤖 タグ評価中...");
    const labelResults = evaluateTags(bill.name, summary, tags);

    if (labelResults.length === 0) {
      console.error("  ❌ タグ評価失敗");
      continue;
    }

    // ラベル → ID に変換
    const tagIds = labelResults
      .map((label) => tags.find((t) => t.label === label)?.id)
      .filter((id): id is string => !!id);

    if (tagIds.length === 0) {
      console.error(`  ❌ マッチするタグなし: ${labelResults.join(", ")}`);
      continue;
    }

    // bills_tags に INSERT
    const inserts = tagIds.map((tag_id) => ({ bill_id: bill.id, tag_id }));
    const { error: insertError } = await supabase
      .from("bills_tags")
      .insert(inserts);

    if (insertError) {
      console.error(`  ❌ INSERT error: ${insertError.message}`);
    } else {
      console.log(`  ✅ タグ付与: ${labelResults.join(", ")}`);
    }
  }

  console.log("\n\n✨ タグ付け完了");
}

main().catch(console.error);
