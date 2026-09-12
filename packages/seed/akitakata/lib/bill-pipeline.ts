/**
 * 定例会の議案登録パイプライン共通処理。
 *
 * セッションごとに作る3本のスクリプト
 * （`bills-<session>-data.ts` / `generate-bill-contents-<session>.ts` /
 *   `ingest-bills-<session>.ts`）から参照する。
 * セッション追加時にコピーするのはデータ定義だけで済むようにするのが目的。
 */

import { execFileSync, execSync } from "node:child_process";
import * as fs from "node:fs";
import type { Database } from "@mirai-gikai/supabase";
import { createClient } from "@supabase/supabase-js";

export type SeedClient = ReturnType<typeof createSeedClient>;

/**
 * seedスクリプト用のSupabaseクライアント。
 * `.env.production` の `SUPABASE_URL` を `NEXT_PUBLIC_SUPABASE_URL` に
 * 再マップして渡す運用のため、両方の名前を受け付ける。
 */
export function createSeedClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL（または SUPABASE_URL）と SUPABASE_SERVICE_ROLE_KEY を設定してください"
    );
  }
  return createClient<Database>(url, serviceRoleKey);
}

export type Difficulty = "normal" | "hard";

export type BillContentResult = {
  title: string;
  summary: string;
  content: string;
};

/** 決算書など大部のPDFがあるため、既定で先頭30ページに絞る */
const DEFAULT_PAGE_LIMIT = 30;

/**
 * PDFからテキストを抽出する。
 *
 * 議案書の本体は新旧対照表・予算表などの表組みなので `-layout` は必須。
 * 付けないと列が混ざり、AIが金額を取り違える（議案第48号で実害あり）。
 */
export function extractPdfText(
  pdfPath: string,
  pageLimit: number = DEFAULT_PAGE_LIMIT
): string {
  if (!fs.existsSync(pdfPath)) {
    console.warn(`  ⚠️  PDFが見つかりません: ${pdfPath}`);
    return "";
  }
  try {
    return execFileSync(
      "pdftotext",
      ["-layout", "-l", String(pageLimit), pdfPath, "-"],
      { encoding: "utf-8", maxBuffer: 64 * 1024 * 1024 }
    );
  } catch (e) {
    // 「PDF未ダウンロード」と「pdftotext未インストール」を取り違えないよう
    // 必ず原因を出す（握りつぶすと全件が静かにスキップされる）
    console.error(
      `  ❌ pdftotext 失敗 (${pdfPath}):`,
      e instanceof Error ? e.message : e
    );
    return "";
  }
}

/** AI出力が bill_contents として使える形かを検証する */
function toBillContentResult(parsed: unknown): BillContentResult | null {
  if (typeof parsed !== "object" || parsed === null) return null;
  const { title, summary, content } = parsed as Record<string, unknown>;
  if (
    typeof title !== "string" ||
    typeof summary !== "string" ||
    typeof content !== "string"
  ) {
    return null;
  }
  if (title.trim() === "" || summary.trim() === "" || content.trim() === "") {
    return null;
  }
  return { title, summary, content };
}

/** 生成JSONを読み込む。壊れていれば null を返す */
export function readBillContentFile(
  filePath: string
): BillContentResult | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    return toBillContentResult(JSON.parse(fs.readFileSync(filePath, "utf-8")));
  } catch (e) {
    console.error(
      `  ❌ JSON読み込み失敗 (${filePath}):`,
      e instanceof Error ? e.message : e
    );
    return null;
  }
}

/** claude CLI に投げてJSONを受け取る。検証に通らなければ null */
export function callClaude(prompt: string): BillContentResult | null {
  try {
    const escaped = prompt.replace(/'/g, "'\\''");
    const raw = execSync(`claude -p '${escaped}' --output-format text`, {
      encoding: "utf-8",
      timeout: 180_000,
    });
    const jsonMatch =
      raw.match(/```json\s*(\{[\s\S]*?\})\s*```/) ?? raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("  ❌ 応答からJSONを取り出せませんでした");
      return null;
    }
    const result = toBillContentResult(JSON.parse(jsonMatch[1] ?? jsonMatch[0]));
    if (!result) {
      console.error(
        "  ❌ title / summary / content が揃っていないため破棄しました"
      );
    }
    return result;
  } catch (e) {
    console.error("  Claude error:", e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * 議案原文PDFが公開されていない案件用のプロンプト。
 *
 * 同意（人事案件）・諮問は個人情報を含むため市議会HPに原文が載らない。
 * 手続き・制度の一般論のみを書かせ、固有情報を捏造させないこと。
 */
export function buildNoPdfPrompt(
  billName: string,
  sessionName: string,
  difficulty: Difficulty
): string {
  const audience =
    difficulty === "normal"
      ? "市民にわかりやすく"
      : "法令・行政の専門知識を持つ読者向けに";
  return `安芸高田市議会 ${sessionName}に上程された次の案件について、${audience}解説するbill_contentsをJSON形式で作成してください。

## 重要な制約
- この案件は議案原文PDFが公開されていません。**案件名と、その手続き・制度の一般的な説明のみ**を記述してください。
- 候補者名・人数・金額・期日・任期などの具体的な固有情報は**一切記載しないでください**（推測での記載は禁止）。
- 法令名・条番号は確実なものだけを挙げ、推測で補わないこと。
- 詳細は市議会の公表を待つ必要がある旨を content の末尾に明記してください。

## 出力形式（JSONのみ出力、説明文不要）
{
  "title": "短いタイトル（30文字以内）",
  "summary": "1〜2文の概要",
  "content": "# タイトル\\n\\n## どんな案件？\\n...\\n\\n## 手続きの仕組み\\n...\\n\\n## 市民への関わり\\n...\\n\\n## 補足\\n..."
}

## 案件名
${billName}`;
}

export type SessionSpec = {
  slug: string;
  name: string;
  startDate: string;
  endDate: string;
  councilUrl: string;
};

/**
 * セッションを取得（なければ作成）。
 *
 * `findActiveCouncilSession` は `.maybeSingle()` を使うため、
 * `is_active: true` が複数あると null を返す（全セッションの議案が出てしまう）。
 * 新セッションを立てる前に必ず既存のアクティブを落とす。
 */
export async function ensureSession(
  supabase: SeedClient,
  spec: SessionSpec,
  isDryRun: boolean
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("council_sessions")
    .select("id")
    .eq("slug", spec.slug)
    .maybeSingle();

  if (existing) {
    console.log(`📅 既存セッション: id=${existing.id}`);
    return existing.id;
  }

  if (isDryRun) {
    console.log(`📅 [dry-run] セッション作成: ${spec.name} (${spec.slug})`);
    console.log("📅 [dry-run] 既存のアクティブセッションを非アクティブ化");
    return "dry-run-session-id";
  }

  const { error: deactivateError } = await supabase
    .from("council_sessions")
    .update({ is_active: false })
    .eq("is_active", true);
  if (deactivateError) {
    console.error(
      "❌ 旧セッション非アクティブ化 失敗:",
      deactivateError.message
    );
    return null;
  }
  console.log("📅 既存のアクティブセッションを非アクティブ化しました");

  const { data: inserted, error } = await supabase
    .from("council_sessions")
    .insert({
      slug: spec.slug,
      name: spec.name,
      start_date: spec.startDate,
      end_date: spec.endDate,
      council_url: spec.councilUrl,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) {
    console.error("❌ セッションINSERT失敗:", error.message);
    return null;
  }
  console.log(`📅 セッション作成: id=${inserted.id}`);
  return inserted.id;
}

export type BillInsert = {
  billNumber: string;
  name: string;
  committeeId: string;
  pdfUrl: string | null;
  publishedAt: string;
};

/** 議案を取得（なければ作成）。dry-run でも既存チェックは実際に行う */
export async function ensureBill(
  supabase: SeedClient,
  bill: BillInsert,
  sessionId: string,
  isDryRun: boolean
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("bills")
    .select("id")
    .eq("bill_number", bill.billNumber)
    .eq("council_session_id", sessionId)
    .maybeSingle();

  if (existing) {
    console.log(`  ⏭️  既存: id=${existing.id}`);
    return existing.id;
  }

  if (isDryRun) {
    console.log(`  [dry-run] bills INSERT: ${bill.billNumber} / ${bill.name}`);
    return `dry-run-${bill.billNumber}`;
  }

  const { data: inserted, error } = await supabase
    .from("bills")
    .insert({
      name: bill.name,
      bill_number: bill.billNumber,
      council_session_id: sessionId,
      committee_id: bill.committeeId,
      status: "submitted",
      status_note: "本会議で上程",
      publish_status: "published",
      published_at: new Date(bill.publishedAt).toISOString(),
      pdf_url: bill.pdfUrl,
    })
    .select("id")
    .single();

  if (error) {
    console.error(`  ❌ INSERT error for ${bill.name}:`, error.message);
    return null;
  }
  console.log(`  ✅ INSERT: id=${inserted.id}`);
  return inserted.id;
}

/** PDF未公開案件の解説の出力先 */
export function noPdfOutputDir(sessionSlug: string): string {
  return `/tmp/bill-contents-${sessionSlug}`;
}

export type MissingContentBill = {
  id: string;
  billNumber: string;
  name: string;
  pdfUrl: string | null;
};

export type MissingContentTargets = {
  sessionId: string;
  sessionName: string;
  bills: MissingContentBill[];
};

/**
 * 指定セッションで bill_contents（normal / hard）が揃っていない議案を返す。
 *
 * `billNumbers` を渡すとその議案だけに絞る（既に解説があってもスキップ扱いにせず、
 * 欠けている難易度だけを対象にする）。空なら欠けているものを自動検出する。
 * セッションが見つからない、または指定した議案が存在しない場合は null。
 */
export async function findBillsMissingContents(
  supabase: SeedClient,
  sessionSlug: string,
  billNumbers: string[] = []
): Promise<MissingContentTargets | null> {
  const { data: session } = await supabase
    .from("council_sessions")
    .select("id, name")
    .eq("slug", sessionSlug)
    .maybeSingle();
  if (!session) {
    console.error(`❌ セッションが見つかりません: ${sessionSlug}`);
    return null;
  }

  let query = supabase
    .from("bills")
    .select("id, bill_number, name, pdf_url")
    .eq("council_session_id", session.id);
  if (billNumbers.length > 0) {
    query = query.in("bill_number", billNumbers);
  }
  const { data: bills, error } = await query;
  if (error) {
    console.error("❌ bills取得失敗:", error.message);
    return null;
  }

  if (billNumbers.length > 0) {
    const found = new Set((bills ?? []).map((b) => b.bill_number));
    const missing = billNumbers.filter((n) => !found.has(n));
    if (missing.length > 0) {
      console.error(
        `❌ ${sessionSlug} に存在しない議案番号: ${missing.join(", ")}`
      );
      return null;
    }
  }

  const targets: MissingContentBill[] = [];
  for (const bill of bills ?? []) {
    const { count } = await supabase
      .from("bill_contents")
      .select("id", { count: "exact", head: true })
      .eq("bill_id", bill.id);
    // 明示指定された議案は欠けている難易度だけを後段で埋めるので対象に含める
    if (billNumbers.length > 0 || (count ?? 0) < 2) {
      targets.push({
        id: bill.id,
        billNumber: bill.bill_number,
        name: bill.name,
        pdfUrl: bill.pdf_url,
      });
    }
  }

  return { sessionId: session.id, sessionName: session.name, bills: targets };
}

export async function hasContent(
  supabase: SeedClient,
  billId: string,
  difficulty: Difficulty
): Promise<boolean> {
  const { count } = await supabase
    .from("bill_contents")
    .select("id", { count: "exact", head: true })
    .eq("bill_id", billId)
    .eq("difficulty_level", difficulty);
  return (count ?? 0) > 0;
}

export async function insertContent(
  supabase: SeedClient,
  billId: string,
  difficulty: Difficulty,
  content: BillContentResult
): Promise<void> {
  const { error } = await supabase.from("bill_contents").insert({
    bill_id: billId,
    difficulty_level: difficulty,
    title: content.title,
    summary: content.summary,
    content: content.content,
  });
  if (error) console.error("  ❌ bill_contents INSERT error:", error.message);
}
