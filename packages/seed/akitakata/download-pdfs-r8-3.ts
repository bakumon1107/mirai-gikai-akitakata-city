/**
 * 令和8年第3回定例会の議案PDFを一括ダウンロードする。
 *
 * URLは `bills-r8-3-data.ts` を唯一の情報源とする。
 * シェルスクリプトに書き写すとDBの `pdf_url` が指すPDFと
 * AIが読むPDFがずれる事故が起きるため、必ずここから生成すること。
 *
 * 実行:
 *   pnpm --filter @mirai-gikai/seed exec tsx akitakata/download-pdfs-r8-3.ts
 */

import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { BILLS, PDF_DIR, REFERENCE_PDFS, setsuKey } from "./bills-r8-3-data";

type Download = { key: string; url: string; label: string };

function collectDownloads(): Download[] {
  const downloads: Download[] = [];
  for (const bill of BILLS) {
    if (!bill.pdfKey || !bill.pdfUrl) continue;
    downloads.push({
      key: bill.pdfKey,
      url: bill.pdfUrl,
      label: `議案原文 ${bill.billNumber}`,
    });
    if (bill.setsuUrl) {
      downloads.push({
        key: setsuKey(bill.pdfKey),
        url: bill.setsuUrl,
        label: `説明資料 ${bill.billNumber}`,
      });
    }
  }
  for (const ref of REFERENCE_PDFS) {
    downloads.push({ key: ref.key, url: ref.url, label: ref.label });
  }
  return downloads;
}

function download({ key, url, label }: Download): boolean {
  const dest = path.join(PDF_DIR, `${key}.pdf`);
  if (fs.existsSync(dest)) {
    console.log(`  ⏭️  ${key}.pdf (既存スキップ)`);
    return true;
  }
  console.log(`  ⬇️  ${key}.pdf  ${label}`);
  try {
    // -f: HTTPエラー時に失敗させる（付けないと404のHTMLが .pdf として残る）
    execFileSync("curl", ["-fsSL", url, "-o", dest], { stdio: "pipe" });
  } catch (e) {
    fs.rmSync(dest, { force: true });
    console.error(
      `  ❌ ${key}.pdf ダウンロード失敗:`,
      e instanceof Error ? e.message : e
    );
    return false;
  }
  return true;
}

function main(): void {
  fs.mkdirSync(PDF_DIR, { recursive: true });
  const downloads = collectDownloads();
  console.log(`📥 PDFダウンロード開始: ${downloads.length}件 → ${PDF_DIR}`);

  const failed = downloads.filter((d) => !download(d));

  if (failed.length > 0) {
    console.error(
      `\n❌ ${failed.length}件failed: ${failed.map((f) => f.key).join(", ")}`
    );
    process.exitCode = 1;
    return;
  }
  console.log(`\n✅ 完了 → ${PDF_DIR}`);
}

main();
