/**
 * 安芸高田市 令和8年第1回定例会 未登録3件の追加登録スクリプト
 *
 * 対象:
 *   第7号  安芸高田市過疎地域持続的発展計画の策定について
 *   第12号 安芸高田市定住促進住宅設置及び管理条例
 *   第22号 令和8年度 安芸高田市一般会計予算
 *
 * 実行コマンド:
 *   source .env.production && \
 *   NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL \
 *   SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
 *   pnpm --filter @mirai-gikai/seed exec tsx akitakata/process-bills-r8-1-missing.ts
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@mirai-gikai/supabase";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SESSION_R8_1 = "7e80877e-961d-43db-9baa-8ef0a2bbd99d";
const COM_SANGYO = "0b0384f5-387a-4fbb-88fe-526151f29aaf"; // 産業厚生常任委員会
const COM_YOSAN = "5fea66aa-c920-4705-9e76-bad67f1a30bd"; // 予算決算常任委員会

const PDF_DIR = "/tmp/akitakata-pdfs-r8-1";

type BillMeta = {
  billNumber: string;
  name: string;
  committeeId: string;
};

const BILLS: BillMeta[] = [
  {
    billNumber: "7",
    name: "安芸高田市過疎地域持続的発展計画の策定について",
    committeeId: COM_SANGYO,
  },
  {
    billNumber: "12",
    name: "安芸高田市定住促進住宅設置及び管理条例",
    committeeId: COM_SANGYO,
  },
  {
    billNumber: "22",
    name: "令和8年度 安芸高田市一般会計予算",
    committeeId: COM_YOSAN,
  },
];

function extractPdfText(billNumber: string): string {
  const path = `${PDF_DIR}/gian${billNumber}.pdf`;
  if (!existsSync(path)) {
    console.warn(`⚠️  PDF not found: ${path}`);
    return "";
  }
  try {
    return execSync(`pdftotext "${path}" -`, { encoding: "utf-8" });
  } catch {
    return "";
  }
}

type BillContentResult = {
  title: string;
  summary: string;
  content: string;
};

function buildPrompt(
  billName: string,
  pdfText: string,
  difficulty: "normal" | "hard"
): string {
  const trimmed = pdfText.slice(0, 6000);
  if (difficulty === "normal") {
    return `以下は安芸高田市議会の議案PDFテキストです。
市民にわかりやすく解説するbill_contentsをJSON形式で作成してください。

## 出力形式（JSONのみ出力、説明文不要）
{
  "title": "市民向けの短いタイトル（30文字以内）",
  "summary": "1〜2文の概要（何をする議案かを平易に）",
  "content": "# タイトル\\n\\n## どんな議案？\\n...\\n\\n## 具体的に何が変わる？\\n...\\n\\n## 市民への影響は？\\n...\\n\\n## 施行日\\n..."
}

## 議案名
${billName}

## 議案テキスト
${trimmed}`;
  } else {
    return `以下は安芸高田市議会の議案PDFテキストです。
法令・行政の専門知識を持つ読者向けに詳細なbill_contentsをJSON形式で作成してください。

## 出力形式（JSONのみ出力、説明文不要）
{
  "title": "専門的タイトル（40文字以内）",
  "summary": "法的・行政的観点からの概要（条文番号・根拠法令等を含む）",
  "content": "# タイトル\\n\\n## 改正の背景・根拠法令\\n...\\n\\n## 改正内容（新旧対照）\\n...\\n\\n## 施行日・経過措置\\n...\\n\\n## 関連条例・法令\\n..."
}

## 議案名
${billName}

## 議案テキスト
${trimmed}`;
  }
}

function callClaude(prompt: string): BillContentResult | null {
  try {
    const escaped = prompt.replace(/'/g, "'\\''");
    const raw = execSync(`claude -p '${escaped}' --output-format text`, {
      encoding: "utf-8",
      timeout: 120_000,
    });
    const jsonMatch =
      raw.match(/```json\s*(\{[\s\S]*?\})\s*```/) ?? raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const jsonStr = jsonMatch[1] ?? jsonMatch[0];
    return JSON.parse(jsonStr) as BillContentResult;
  } catch (e) {
    console.error("Claude error:", e);
    return null;
  }
}

async function ensureBill(meta: BillMeta): Promise<string | null> {
  const { data: existing } = await supabase
    .from("bills")
    .select("id")
    .eq("bill_number", meta.billNumber)
    .eq("council_session_id", SESSION_R8_1)
    .maybeSingle();

  if (existing) {
    console.log(`  ⏭️  既存: id=${existing.id}`);
    return existing.id;
  }

  const { data: inserted, error } = await supabase
    .from("bills")
    .insert({
      name: meta.name,
      bill_number: meta.billNumber,
      council_session_id: SESSION_R8_1,
      committee_id: meta.committeeId,
      status: "approved",
      status_note: "本会議で可決",
      publish_status: "published",
      published_at: new Date("2026-03-01").toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error(`  ❌ INSERT error for ${meta.name}:`, error.message);
    return null;
  }
  console.log(`  ✅ INSERT: id=${inserted.id}`);
  return inserted.id;
}

async function hasContent(
  billId: string,
  difficulty: "normal" | "hard"
): Promise<boolean> {
  const { count } = await supabase
    .from("bill_contents")
    .select("id", { count: "exact", head: true })
    .eq("bill_id", billId)
    .eq("difficulty_level", difficulty);
  return (count ?? 0) > 0;
}

async function insertContent(
  billId: string,
  difficulty: "normal" | "hard",
  content: BillContentResult
) {
  const { error } = await supabase.from("bill_contents").insert({
    bill_id: billId,
    difficulty_level: difficulty,
    title: content.title,
    summary: content.summary,
    content: content.content,
  });
  if (error) console.error(`  ❌ bill_contents INSERT error:`, error.message);
}

async function main() {
  console.log(`\n🚀 令和8年第1回定例会 未登録3件 追加登録開始\n`);

  for (const meta of BILLS) {
    console.log(`\n────────────────────────────────`);
    console.log(`📋 [第${meta.billNumber}号] ${meta.name.slice(0, 40)}`);

    const billId = await ensureBill(meta);
    if (!billId) continue;

    const pdfText = extractPdfText(meta.billNumber);
    if (!pdfText) {
      console.warn(`  ⚠️  PDFなし → bill_contents生成スキップ`);
      continue;
    }

    for (const diff of ["normal", "hard"] as const) {
      const already = await hasContent(billId, diff);
      if (already) {
        console.log(`  ⏭️  ${diff}: 既存スキップ`);
        continue;
      }
      console.log(`  🤖 ${diff} 生成中...`);
      const result = callClaude(buildPrompt(meta.name, pdfText, diff));
      if (result) {
        await insertContent(billId, diff, result);
        console.log(`  ✅ ${diff}: "${result.title}"`);
      } else {
        console.error(`  ❌ ${diff} 生成失敗`);
      }
    }
  }

  console.log(`\n\n✨ 全処理完了`);
}

main().catch(console.error);
