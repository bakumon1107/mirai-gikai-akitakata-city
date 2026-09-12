/**
 * 令和8年第3回定例会 議案のAI解説（bill_contents）をローカルに生成する。
 *
 * **このスクリプトはDBに一切書き込まない。**
 * 生成物を OUTPUT_DIR に JSON で書き出すので、内容をレビューしてから
 * ingest-bills-r8-3.ts でDBに投入すること。
 *
 * 事前準備:
 *   pnpm --filter @mirai-gikai/seed exec tsx akitakata/download-pdfs-r8-3.ts
 *
 * 実行:
 *   pnpm --filter @mirai-gikai/seed exec tsx akitakata/generate-bill-contents-r8-3.ts [議案番号...]
 *
 * 引数に議案番号を渡すとその議案だけ再生成する（例: 52 nin1）。
 * 既に出力済みのJSONはスキップするため、途中で止めても再実行で続きから進む。
 */

import * as fs from "node:fs";
import * as path from "node:path";
import {
  BILLS,
  type BillMeta,
  OUTPUT_DIR,
  PDF_DIR,
  SESSION_NAME,
  setsuKey,
} from "./bills-r8-3-data";
import {
  buildNoPdfPrompt,
  callClaude,
  type Difficulty,
  extractPdfText,
} from "./lib/bill-pipeline";

function pdfPath(key: string): string {
  return path.join(PDF_DIR, `${key}.pdf`);
}

function buildPrompt(
  billName: string,
  pdfText: string,
  setsuText: string,
  difficulty: Difficulty
): string {
  const trimmedMain = pdfText.slice(0, 4000);
  const trimmedSetsu = setsuText.slice(0, 3000);
  const hasSetsu = setsuText.length > 0;
  const setsuSection = hasSetsu
    ? `\n\n## 説明資料テキスト\n${trimmedSetsu}`
    : "";
  const setsuHint = hasSetsu ? "説明資料も合わせて参照し、" : "";

  if (difficulty === "normal") {
    return `以下は安芸高田市議会の議案PDFテキストです。${setsuHint}市民にわかりやすく解説するbill_contentsをJSON形式で作成してください。

## 制約
- 金額・条番号・日付は与えられたテキストに書かれている値だけを使うこと。書かれていない数値を補わない。

## 出力形式（JSONのみ出力、説明文不要）
{
  "title": "市民向けの短いタイトル（30文字以内）",
  "summary": "1〜2文の概要（何をする議案かを平易に）",
  "content": "# タイトル\\n\\n## どんな議案？\\n...\\n\\n## 具体的に何が変わる？\\n...\\n\\n## 市民への影響は？\\n...\\n\\n## 施行日\\n..."
}

## 議案名
${billName}

## 議案テキスト
${trimmedMain}${setsuSection}`;
  }
  return `以下は安芸高田市議会の議案PDFテキストです。${setsuHint}法令・行政の専門知識を持つ読者向けに詳細なbill_contentsをJSON形式で作成してください。

## 制約
- 金額・条番号・日付は与えられたテキストに書かれている値だけを使うこと。
- 法令名・規則番号は資料に明記されているものだけを挙げ、推測で番号を補わないこと（例: 「人事院規則」とだけある場合に規則番号を書き足さない）。

## 出力形式（JSONのみ出力、説明文不要）
{
  "title": "専門的タイトル（40文字以内）",
  "summary": "法的・行政的観点からの概要（条文番号・根拠法令等を含む）",
  "content": "# タイトル\\n\\n## 改正の背景・根拠法令\\n...\\n\\n## 改正内容（新旧対照）\\n...\\n\\n## 施行日・経過措置\\n...\\n\\n## 関連条例・法令\\n..."
}

## 議案名
${billName}

## 議案テキスト
${trimmedMain}${setsuSection}`;
}

function outputPath(billNumber: string, difficulty: Difficulty): string {
  return path.join(OUTPUT_DIR, `${billNumber}-${difficulty}.json`);
}

/** @returns 生成に失敗した件数 */
function generateForBill(meta: BillMeta): number {
  console.log("\n────────────────────────────────");
  console.log(`📋 [${meta.billNumber}] ${meta.name.slice(0, 50)}`);

  const pdfText = meta.pdfKey ? extractPdfText(pdfPath(meta.pdfKey)) : "";
  if (meta.pdfKey && !pdfText) {
    console.warn("  ⚠️  PDFテキスト抽出に失敗 → スキップ");
    return 2;
  }

  const setsuText =
    meta.pdfKey && meta.setsuUrl
      ? extractPdfText(pdfPath(setsuKey(meta.pdfKey)))
      : "";
  if (meta.setsuUrl) {
    console.log(
      setsuText
        ? `  📎 説明資料あり (${setsuText.length}文字)`
        : "  ⚠️  説明資料PDFを読めませんでした"
    );
  }

  let failures = 0;
  for (const difficulty of ["normal", "hard"] as const) {
    const dest = outputPath(meta.billNumber, difficulty);
    if (fs.existsSync(dest)) {
      console.log(`  ⏭️  ${difficulty}: 生成済みスキップ`);
      continue;
    }
    console.log(`  🤖 ${difficulty} 生成中...`);
    const prompt = meta.pdfKey
      ? buildPrompt(meta.name, pdfText, setsuText, difficulty)
      : buildNoPdfPrompt(meta.name, SESSION_NAME, difficulty);
    const result = callClaude(prompt);
    if (!result) {
      console.error(`  ❌ ${difficulty} 生成失敗`);
      failures += 1;
      continue;
    }
    fs.writeFileSync(dest, `${JSON.stringify(result, null, 2)}\n`, "utf-8");
    console.log(`  ✅ ${difficulty}: "${result.title}" → ${dest}`);
  }
  return failures;
}

function main(): void {
  const targets = process.argv.slice(2);
  const bills =
    targets.length > 0
      ? BILLS.filter((b) => targets.includes(b.billNumber))
      : BILLS;

  if (bills.length === 0) {
    console.error(`対象議案が見つかりません: ${targets.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`\n🤖 ${SESSION_NAME} AI解説をローカル生成: ${bills.length}件`);
  console.log(`   出力先: ${OUTPUT_DIR}（DBには書き込みません）`);

  let failures = 0;
  for (const meta of bills) {
    failures += generateForBill(meta);
  }

  if (failures > 0) {
    console.error(
      `\n\n⚠️  ${failures}件の生成に失敗しました。再実行すると未生成分だけやり直せます`
    );
    process.exitCode = 1;
    return;
  }
  console.log(
    "\n\n✨ 生成完了。内容をレビューしてから ingest-bills-r8-3.ts を実行してください"
  );
}

main();
