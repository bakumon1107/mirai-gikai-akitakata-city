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

/**
 * claude CLI に投げ、応答からJSONを取り出してパースする。
 * 応答はコードブロックで返ることも素のJSONで返ることもある。
 * 値の検証は呼び出し側で行う。
 */
export function callClaudeJson(prompt: string): unknown | null {
  try {
    const escaped = prompt.replace(/'/g, "'\\''");
    const raw = execSync(`claude -p '${escaped}' --output-format text`, {
      encoding: "utf-8",
      timeout: 180_000,
    });
    const fenced = raw.match(/```json\s*([\s\S]*?)\s*```/);
    const bare = raw.match(/[[{][\s\S]*[\]}]/);
    const jsonStr = fenced?.[1] ?? bare?.[0];
    if (!jsonStr) {
      console.error("  ❌ 応答からJSONを取り出せませんでした");
      return null;
    }
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("  Claude error:", e instanceof Error ? e.message : e);
    return null;
  }
}

/** claude CLI に投げて bill_contents を受け取る。検証に通らなければ null */
export function callClaude(prompt: string): BillContentResult | null {
  const parsed = callClaudeJson(prompt);
  if (parsed === null) return null;
  const result = toBillContentResult(parsed);
  if (!result) {
    console.error(
      "  ❌ title / summary / content が揃っていないため破棄しました"
    );
  }
  return result;
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

/**
 * 意見書かどうか。
 *
 * 意見書は市議会が国や県に対して意思表示する議員提出議案で、市民の関心が高い。
 * AIのスコアに関わらず必ず注目議案（is_featured）にする。
 *
 * 発議（bill_number が "h" で始まる）でも「議員報酬条例の改正」のように
 * 意見書でないものがあるため、番号ではなく議案名で判定する。
 */
export function isOpinionPaper(billName: string): boolean {
  return billName.includes("意見書");
}

/** 注目議案の評価結果の出力先 */
export function evaluationOutputPath(sessionSlug: string): string {
  return `/tmp/bill-evaluations-${sessionSlug}.json`;
}

export type BillForEval = {
  id: string;
  billNumber: string;
  name: string;
  title: string;
  summary: string;
  content: string;
};

/**
 * 注目議案の評価対象（公開済み＋解説あり）をセッションslugから取得する。
 * セッションが見つからなければ null。
 */
export async function findBillsForEvaluation(
  supabase: SeedClient,
  sessionSlug: string
): Promise<{ sessionName: string; bills: BillForEval[] } | null> {
  const { data: session } = await supabase
    .from("council_sessions")
    .select("id, name")
    .eq("slug", sessionSlug)
    .maybeSingle();
  if (!session) {
    console.error(`❌ セッションが見つかりません: ${sessionSlug}`);
    return null;
  }

  const { data, error } = await supabase
    .from("bills")
    .select("id, bill_number, name, bill_contents(title, summary, content)")
    .eq("council_session_id", session.id)
    .eq("publish_status", "published")
    .order("bill_number");
  if (error) {
    console.error("❌ bills取得失敗:", error.message);
    return null;
  }

  const bills: BillForEval[] = [];
  for (const b of data ?? []) {
    const contents = Array.isArray(b.bill_contents)
      ? b.bill_contents
      : [b.bill_contents];
    const first = contents[0] as
      | { title?: string; summary?: string; content?: string }
      | null
      | undefined;
    if (!first?.title && !first?.summary) continue;
    bills.push({
      id: b.id,
      billNumber: b.bill_number ?? "",
      name: b.name,
      title: first?.title ?? "",
      summary: first?.summary ?? "",
      content: first?.content ?? "",
    });
  }

  return { sessionName: session.name, bills };
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

export type BillStatus = Database["public"]["Enums"]["bill_status_enum"];

/**
 * 議事録から読み取った議案の状態変化。
 * AI生成ではなく議事録の記載をそのまま書き写す（「付託」「可決」等）。
 */
export type BillStatusUpdate = {
  billNumber: string;
  status: BillStatus;
  /**
   * 詳細ページのステータス表示の下に出る補足。
   * 更新しないと「委員会審査中」の下に登録時の「本会議で上程」が残る。
   */
  statusNote: string;
  /** 付託先が登録時の割り当てと違った場合に正す */
  committeeId?: string;
};

/**
 * 議事録の内容を議案のステータスに反映する。
 *
 * 反映前に全議案の存在を確認し、1件でも見つからなければ何も書き込まない。
 * @returns 全件成功したら true
 */
export async function applyBillStatusUpdates(
  supabase: SeedClient,
  sessionSlug: string,
  updates: BillStatusUpdate[],
  isDryRun: boolean
): Promise<boolean> {
  const { data: session } = await supabase
    .from("council_sessions")
    .select("id")
    .eq("slug", sessionSlug)
    .maybeSingle();
  if (!session) {
    console.error(`❌ セッションが見つかりません: ${sessionSlug}`);
    return false;
  }

  const { data: bills, error } = await supabase
    .from("bills")
    .select("id, bill_number, status, status_note, committee_id")
    .eq("council_session_id", session.id)
    .in(
      "bill_number",
      updates.map((u) => u.billNumber)
    );
  if (error) {
    console.error("❌ bills取得失敗:", error.message);
    return false;
  }

  const byNumber = new Map((bills ?? []).map((b) => [b.bill_number, b]));
  const missing = updates
    .map((u) => u.billNumber)
    .filter((n) => !byNumber.has(n));
  if (missing.length > 0) {
    console.error(`❌ 存在しない議案番号: ${missing.join(", ")}。何も更新しません`);
    return false;
  }

  let failures = 0;
  for (const u of updates) {
    const current = byNumber.get(u.billNumber)!;
    const committeeChange =
      u.committeeId && u.committeeId !== current.committee_id
        ? `  委員会: ${current.committee_id?.slice(0, 8)} → ${u.committeeId.slice(0, 8)}`
        : "";
    console.log(
      `  [${u.billNumber}] ${current.status} → ${u.status}「${u.statusNote}」${committeeChange}`
    );
    if (isDryRun) continue;

    const { error: updateError } = await supabase
      .from("bills")
      .update({
        status: u.status,
        status_note: u.statusNote,
        ...(u.committeeId ? { committee_id: u.committeeId } : {}),
      })
      .eq("id", current.id);
    if (updateError) {
      console.error(`    ❌ 更新失敗: ${updateError.message}`);
      failures += 1;
    }
  }
  return failures === 0;
}
