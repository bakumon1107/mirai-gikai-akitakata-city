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
