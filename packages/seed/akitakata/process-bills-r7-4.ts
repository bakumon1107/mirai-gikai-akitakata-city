/**
 * 安芸高田市 令和7年第4回定例会 全議案の bill_contents 生成・DB登録スクリプト
 *
 * 処理内容:
 * 1. 未登録billsをINSERT（bill_numberで重複チェック）
 * 2. 全billのbill_contents(normal + hard)をclaude CLIで生成してINSERT
 *
 * 実行前にPDFをダウンロードしておくこと:
 *   bash packages/seed/akitakata/download-pdfs-r7-4.sh
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@mirai-gikai/supabase";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SESSION_R7_4 = "fd76e4ec-cd1c-482b-8e92-58f7f28b26f6";
const COM_SOUMU = "bf7b0596-a28f-4074-af9e-10b7c09e7dae"; // 総務文教常任委員会
const COM_SANGYO = "0b0384f5-387a-4fbb-88fe-526151f29aaf"; // 産業厚生常任委員会
const COM_YOSAN = "5fea66aa-c920-4705-9e76-bad67f1a30bd"; // 予算決算常任委員会

const PDF_DIR = "/tmp/akitakata-pdfs-r74";

type BillMeta = {
  billNumber: string;
  name: string;
  committeeId: string;
};

const BILLS: BillMeta[] = [
  { billNumber: "64", name: "安芸高田市事務分掌条例の一部を改正する条例", committeeId: COM_SOUMU },
  { billNumber: "65", name: "安芸高田市職員の給与に関する条例及び安芸高田市一般職の任期付職員の採用等に関する条例の一部を改正する条例", committeeId: COM_SOUMU },
  { billNumber: "66", name: "安芸高田市特別職の職員で常勤のものの給与及び旅費に関する条例の一部を改正する条例", committeeId: COM_SOUMU },
  { billNumber: "67", name: "安芸高田市財産区管理会条例の一部を改正する条例", committeeId: COM_SANGYO },
  { billNumber: "68", name: "安芸高田市財産区管理委員の報酬及び費用弁償等に関する条例の一部を改正する条例", committeeId: COM_SANGYO },
  { billNumber: "69", name: "安芸高田市坂財産区基金条例", committeeId: COM_SANGYO },
  { billNumber: "70", name: "安芸高田市公の施設の指定管理者の指定について", committeeId: COM_SANGYO },
  { billNumber: "71", name: "財産の無償譲渡について", committeeId: COM_SANGYO },
  { billNumber: "72", name: "安芸高田市特定乳児等通園支援事業の運営に関する基準を定める条例", committeeId: COM_SANGYO },
  { billNumber: "73", name: "安芸高田市乳児等通園支援事業の設備及び運営に関する基準を定める条例の一部を改正する条例", committeeId: COM_SANGYO },
  { billNumber: "74", name: "安芸高田市火入れに関する条例の一部を改正する条例", committeeId: COM_SANGYO },
  { billNumber: "75", name: "安芸高田市下水道事業受益者負担金及び分担金徴収条例の一部を改正する条例", committeeId: COM_SANGYO },
  { billNumber: "76", name: "安芸高田市火災予防条例の一部を改正する条例", committeeId: COM_SOUMU },
  { billNumber: "77", name: "令和7年度安芸高田市一般会計補正予算（第6号）", committeeId: COM_YOSAN },
  { billNumber: "78", name: "令和7年度安芸高田市国民健康保険特別会計補正予算（第3号）", committeeId: COM_YOSAN },
  { billNumber: "79", name: "令和7年度安芸高田市後期高齢者医療特別会計補正予算（第1号）", committeeId: COM_YOSAN },
  { billNumber: "80", name: "令和7年度安芸高田市介護保険特別会計補正予算（第2号）", committeeId: COM_YOSAN },
  { billNumber: "81", name: "令和7年度安芸高田市コミュニティ・プラント特別会計補正予算（第1号）", committeeId: COM_YOSAN },
  { billNumber: "82", name: "令和7年度安芸高田市下水道事業会計補正予算（第2号）", committeeId: COM_YOSAN },
  { billNumber: "83", name: "令和7年度安芸高田市一般会計補正予算（第7号）", committeeId: COM_YOSAN },
  { billNumber: "h5", name: "安芸高田市議会の議員の報酬及び費用弁償等に関する条例の一部を改正する条例", committeeId: COM_SOUMU },
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
    const jsonMatch = raw.match(/```json\s*(\{[\s\S]*?\})\s*```/) ?? raw.match(/\{[\s\S]*\}/);
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
    .eq("council_session_id", SESSION_R7_4)
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
      council_session_id: SESSION_R7_4,
      committee_id: meta.committeeId,
      status: "approved",
      status_note: "本会議で可決",
      publish_status: "published",
      published_at: new Date("2025-12-01").toISOString(),
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
  console.log(`\n🚀 令和7年第4回定例会 議案登録開始: ${BILLS.length}件\n`);

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
