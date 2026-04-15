/**
 * 安芸高田市 令和8年第1回定例会 全議案の bill_contents 生成・DB登録スクリプト
 *
 * 処理内容:
 * 1. 既存bills のbill_numberを更新
 * 2. 未登録billsをINSERT
 * 3. 全billのbill_contents(normal + hard)をclaude CLIで生成してINSERT
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@mirai-gikai/supabase";

// ─── DB接続 ───────────────────────────────────────────────────
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── 固定ID ───────────────────────────────────────────────────
const SESSION_R8_1 = "7e80877e-961d-43db-9baa-8ef0a2bbd99d"; // 令和8年第1回定例会
const COM_SOUMU = "bf7b0596-a28f-4074-af9e-10b7c09e7dae"; // 総務文教常任委員会
const COM_SANGYO = "0b0384f5-387a-4fbb-88fe-526151f29aaf"; // 産業厚生常任委員会
const COM_YOSAN = "5fea66aa-c920-4705-9e76-bad67f1a30bd"; // 予算決算常任委員会

// ─── 議案マスタ ───────────────────────────────────────────────
type BillMeta = {
  billNumber: string; // DB の bill_number
  name: string; // 正式名称
  pdfKey: string; // /tmp/akitakata-pdfs/gian{pdfKey}.pdf
  committeeId: string;
};

const BILLS: BillMeta[] = [
  // ── 既存4議案（bill_number更新 + bill_contents追加） ──
  {
    billNumber: "7",
    name: "過疎地域持続的発展計画の策定について",
    pdfKey: "7",
    committeeId: COM_SOUMU,
  },
  {
    billNumber: "12",
    name: "安芸高田市定住促進住宅の設置管理条例",
    pdfKey: "12",
    committeeId: COM_SOUMU,
  },
  {
    billNumber: "16",
    name: "令和7年度安芸高田市一般会計補正予算（第10号）",
    pdfKey: "16",
    committeeId: COM_YOSAN,
  },
  {
    billNumber: "22",
    name: "令和8年度安芸高田市一般会計予算",
    pdfKey: "22",
    committeeId: COM_YOSAN,
  },
  // ── 既存3議案（hard版追加のみ） ──
  {
    billNumber: "2",
    name: "安芸高田市行政手続条例の一部を改正する条例",
    pdfKey: "2",
    committeeId: COM_SOUMU,
  },
  {
    billNumber: "3",
    name: "安芸高田市附属機関設置条例及び安芸高田市特別職の職員で非常勤のものの報酬及び費用弁償等に関する条例の一部を改正する条例",
    pdfKey: "3",
    committeeId: COM_SOUMU,
  },
  {
    billNumber: "4",
    name: "安芸高田市職員の旅費に関する条例の一部を改正する条例",
    pdfKey: "4",
    committeeId: COM_SOUMU,
  },
  // ── 新規登録 ──
  {
    billNumber: "5",
    name: "安芸高田市特別職の職員で常勤のものの給与及び旅費に関する条例の一部を改正する条例",
    pdfKey: "5",
    committeeId: COM_SOUMU,
  },
  {
    billNumber: "6",
    name: "安芸高田市職員の給与に関する条例等の一部を改正する条例",
    pdfKey: "6",
    committeeId: COM_SOUMU,
  },
  {
    billNumber: "8",
    name: "安芸高田市手数料条例の一部を改正する条例",
    pdfKey: "8",
    committeeId: COM_SOUMU,
  },
  {
    billNumber: "9",
    name: "安芸高田市ふれあいセンターこうだ条例を廃止する条例",
    pdfKey: "9",
    committeeId: COM_SANGYO,
  },
  {
    billNumber: "10",
    name: "安芸高田市土師ダム周辺環境整備施設の設置及び管理に関する条例の一部を改正する条例",
    pdfKey: "10",
    committeeId: COM_SANGYO,
  },
  {
    billNumber: "11",
    name: "財産の無償貸付について（高宮工業団地下水処理施設）",
    pdfKey: "11",
    committeeId: COM_SOUMU,
  },
  {
    billNumber: "13",
    name: "安芸高田市有住宅条例の一部を改正する条例",
    pdfKey: "13",
    committeeId: COM_SOUMU,
  },
  {
    billNumber: "14",
    name: "市道路線の認定について",
    pdfKey: "14",
    committeeId: COM_SOUMU,
  },
  {
    billNumber: "15",
    name: "安芸高田市B&G海洋センターの設置及び管理に関する条例の一部を改正する条例",
    pdfKey: "15",
    committeeId: COM_SANGYO,
  },
  {
    billNumber: "17",
    name: "令和7年度安芸高田市国民健康保険特別会計補正予算（第4号）",
    pdfKey: "17",
    committeeId: COM_YOSAN,
  },
  {
    billNumber: "18",
    name: "令和7年度安芸高田市後期高齢者医療特別会計補正予算（第2号）",
    pdfKey: "18",
    committeeId: COM_YOSAN,
  },
  {
    billNumber: "19",
    name: "令和7年度安芸高田市介護保険特別会計補正予算（第3号）",
    pdfKey: "19",
    committeeId: COM_YOSAN,
  },
  {
    billNumber: "20",
    name: "令和7年度安芸高田市コミュニティプラント特別会計補正予算（第2号）",
    pdfKey: "20",
    committeeId: COM_YOSAN,
  },
  {
    billNumber: "21",
    name: "令和7年度安芸高田市下水道事業会計補正予算（第3号）",
    pdfKey: "21",
    committeeId: COM_YOSAN,
  },
  {
    billNumber: "23",
    name: "令和8年度安芸高田市国民健康保険特別会計予算",
    pdfKey: "23",
    committeeId: COM_YOSAN,
  },
  {
    billNumber: "24",
    name: "令和8年度安芸高田市後期高齢者医療特別会計予算",
    pdfKey: "24",
    committeeId: COM_YOSAN,
  },
  {
    billNumber: "25",
    name: "令和8年度安芸高田市介護保険特別会計予算",
    pdfKey: "25",
    committeeId: COM_YOSAN,
  },
  {
    billNumber: "26",
    name: "令和8年度安芸高田市コミュニティプラント整備事業特別会計予算",
    pdfKey: "26",
    committeeId: COM_YOSAN,
  },
  {
    billNumber: "27",
    name: "令和8年度安芸高田市吉田財産区特別会計予算",
    pdfKey: "27",
    committeeId: COM_YOSAN,
  },
  {
    billNumber: "28",
    name: "令和8年度安芸高田市中宇米財産区特別会計予算",
    pdfKey: "28",
    committeeId: COM_YOSAN,
  },
  {
    billNumber: "29",
    name: "令和8年度安芸高田市横田財産区特別会計予算",
    pdfKey: "29",
    committeeId: COM_YOSAN,
  },
  {
    billNumber: "30",
    name: "令和8年度安芸高田市本郷財産区特別会計予算",
    pdfKey: "30",
    committeeId: COM_YOSAN,
  },
  {
    billNumber: "31",
    name: "令和8年度安芸高田市北財産区特別会計予算",
    pdfKey: "31",
    committeeId: COM_YOSAN,
  },
  {
    billNumber: "32",
    name: "令和8年度安芸高田市来原財産区特別会計予算",
    pdfKey: "32",
    committeeId: COM_YOSAN,
  },
  {
    billNumber: "33",
    name: "令和8年度安芸高田市船佐財産区特別会計予算",
    pdfKey: "33",
    committeeId: COM_YOSAN,
  },
  {
    billNumber: "34",
    name: "令和8年度安芸高田市川根財産区特別会計予算",
    pdfKey: "34",
    committeeId: COM_YOSAN,
  },
  {
    billNumber: "35",
    name: "令和8年度安芸高田市坂財産区特別会計予算",
    pdfKey: "35",
    committeeId: COM_YOSAN,
  },
  {
    billNumber: "36",
    name: "令和8年度安芸高田市下水道事業会計予算",
    pdfKey: "36",
    committeeId: COM_YOSAN,
  },
  {
    billNumber: "37",
    name: "安芸高田市特別職の職員で非常勤のものの報酬及び費用弁償等に関する条例及び安芸高田市証人等の実費弁償に関する条例の一部を改正する条例",
    pdfKey: "37",
    committeeId: COM_SOUMU,
  },
  {
    billNumber: "h2",
    name: "安芸高田バイオマス発電所事業計画に伴う意見書",
    pdfKey: "h2",
    committeeId: COM_SANGYO,
  },
  {
    billNumber: "h3",
    name: "安芸高田市議会の議員の報酬及び費用弁償等に関する条例の一部を改正する条例",
    pdfKey: "h3",
    committeeId: COM_SOUMU,
  },
];

// ─── PDF テキスト抽出 ─────────────────────────────────────────
function extractPdfText(pdfKey: string): string {
  const path = `/tmp/akitakata-pdfs/gian${pdfKey}.pdf`;
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

// ─── Claude CLI でbill_contents生成 ──────────────────────────
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
  const trimmed = pdfText.slice(0, 6000); // トークン節約のため先頭6000文字

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

    // JSON部分を抽出
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]) as BillContentResult;
  } catch (e) {
    console.error("Claude error:", e);
    return null;
  }
}

// ─── DB操作ヘルパー ───────────────────────────────────────────
async function ensureBill(meta: BillMeta): Promise<string | null> {
  // 既存チェック（bill_number で検索）
  const { data: existing } = await supabase
    .from("bills")
    .select("id")
    .eq("bill_number", meta.billNumber)
    .maybeSingle();

  if (existing) return existing.id;

  // 名前でも検索（seedで投入した4件はbill_numberがNULL）
  const { data: byName } = await supabase
    .from("bills")
    .select("id")
    .eq("name", meta.name)
    .maybeSingle();

  if (byName) {
    // bill_number を更新
    await supabase
      .from("bills")
      .update({ bill_number: meta.billNumber })
      .eq("id", byName.id);
    return byName.id;
  }

  // 新規INSERT
  const { data: inserted, error } = await supabase
    .from("bills")
    .insert({
      name: meta.name,
      bill_number: meta.billNumber,
      council_session_id: SESSION_R8_1,
      committee_id: meta.committeeId,
      status: "submitted",
      publish_status: "published",
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error(`INSERT error for ${meta.name}:`, error.message);
    return null;
  }
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
  if (error) console.error(`bill_contents INSERT error:`, error.message);
}

// ─── メイン処理 ───────────────────────────────────────────────
async function main() {
  console.log(`\n🚀 処理開始: ${BILLS.length}件の議案\n`);

  for (const meta of BILLS) {
    console.log(`\n────────────────────────────────`);
    console.log(`📋 [${meta.billNumber}] ${meta.name.slice(0, 30)}...`);

    // 1. bill の確保
    const billId = await ensureBill(meta);
    if (!billId) {
      console.error(`  ❌ bill ID 取得失敗、スキップ`);
      continue;
    }
    console.log(`  ✅ bill_id: ${billId}`);

    // 2. PDF テキスト抽出
    const pdfText = extractPdfText(meta.pdfKey);
    if (!pdfText) {
      console.warn(`  ⚠️  PDF テキストなし`);
    }

    // 3. normal
    const hasNormal = await hasContent(billId, "normal");
    if (hasNormal) {
      console.log(`  ⏭️  normal: 既存スキップ`);
    } else {
      console.log(`  🤖 normal 生成中...`);
      const prompt = buildPrompt(meta.name, pdfText, "normal");
      const result = callClaude(prompt);
      if (result) {
        await insertContent(billId, "normal", result);
        console.log(`  ✅ normal: "${result.title}"`);
      } else {
        console.error(`  ❌ normal 生成失敗`);
      }
    }

    // 4. hard
    const hasHard = await hasContent(billId, "hard");
    if (hasHard) {
      console.log(`  ⏭️  hard: 既存スキップ`);
    } else {
      console.log(`  🤖 hard 生成中...`);
      const prompt = buildPrompt(meta.name, pdfText, "hard");
      const result = callClaude(prompt);
      if (result) {
        await insertContent(billId, "hard", result);
        console.log(`  ✅ hard: "${result.title}"`);
      } else {
        console.error(`  ❌ hard 生成失敗`);
      }
    }
  }

  console.log(`\n\n✨ 全処理完了`);
}

main().catch(console.error);
