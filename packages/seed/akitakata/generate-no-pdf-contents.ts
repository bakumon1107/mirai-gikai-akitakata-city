/**
 * 議案原文PDFが公開されていない案件のAI解説をローカルに生成する。
 *
 * 同意（人事案件）・諮問は個人情報を含むため市議会HPに原文が載らない。
 * 通常の生成スクリプトはPDFが無い議案をスキップするので、取りこぼしを
 * このスクリプトで埋める。`bill_contents` が1件も無い議案は取得クエリの
 * `bill_contents!inner` により議案一覧から消えてしまうため放置できない。
 *
 * **このスクリプトはDBに一切書き込まない。**
 * 出力をレビューしてから ingest-no-pdf-contents.ts で投入すること。
 *
 * 実行:
 *   source .env.production && \
 *   NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL \
 *   SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
 *   pnpm --filter @mirai-gikai/seed exec tsx akitakata/generate-no-pdf-contents.ts <session-slug> [bill-number...]
 *
 * 例:
 *   ... generate-no-pdf-contents.ts r8-2 doi3
 *   ... generate-no-pdf-contents.ts r8-2            # 解説が欠けている議案を自動検出
 *
 * 議案名と定例会名はDBから引くので、引数に書き写す必要はない。
 * 出力先は /tmp/bill-contents-<session-slug>/<bill-number>-<difficulty>.json。
 */

import * as fs from "node:fs";
import * as path from "node:path";
import {
  buildNoPdfPrompt,
  callClaude,
  createSeedClient,
  type Difficulty,
  findBillsMissingContents,
  noPdfOutputDir,
} from "./lib/bill-pipeline";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const [sessionSlug, ...billNumbers] = args;

  if (!sessionSlug) {
    console.error(
      "使い方: tsx akitakata/generate-no-pdf-contents.ts <session-slug> [bill-number...]"
    );
    process.exitCode = 1;
    return;
  }

  const supabase = createSeedClient();
  const targets = await findBillsMissingContents(
    supabase,
    sessionSlug,
    billNumbers
  );
  if (targets === null) {
    process.exitCode = 1;
    return;
  }
  if (targets.bills.length === 0) {
    console.log("✨ 解説が欠けている議案はありません");
    return;
  }

  const outputDir = noPdfOutputDir(sessionSlug);
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(
    `\n🤖 ${targets.sessionName} PDF未公開案件のAI解説を生成: ${targets.bills.length}件`
  );
  console.log(`   出力先: ${outputDir}（DBには書き込みません）`);

  let failures = 0;
  for (const bill of targets.bills) {
    console.log("\n────────────────────────────────");
    console.log(`📋 [${bill.billNumber}] ${bill.name.slice(0, 50)}`);
    if (bill.pdfUrl) {
      console.warn(
        "  ⚠️  この議案には pdf_url があります。PDFを読ませる通常の生成スクリプトの方が精度が高いので、意図した対象か確認してください"
      );
    }

    for (const difficulty of ["normal", "hard"] as const) {
      const dest = path.join(
        outputDir,
        `${bill.billNumber}-${difficulty}.json`
      );
      if (fs.existsSync(dest)) {
        console.log(`  ⏭️  ${difficulty}: 生成済みスキップ`);
        continue;
      }
      console.log(`  🤖 ${difficulty} 生成中...`);
      const result = callClaude(
        buildNoPdfPrompt(bill.name, targets.sessionName, difficulty)
      );
      if (!result) {
        console.error(`  ❌ ${difficulty} 生成失敗`);
        failures += 1;
        continue;
      }
      fs.writeFileSync(dest, `${JSON.stringify(result, null, 2)}\n`, "utf-8");
      console.log(`  ✅ ${difficulty}: "${result.title}" → ${dest}`);
    }
  }

  if (failures > 0) {
    console.error(`\n\n⚠️  ${failures}件の生成に失敗しました`);
    process.exitCode = 1;
    return;
  }
  console.log(
    "\n\n✨ 生成完了。内容をレビューしてから ingest-no-pdf-contents.ts を実行してください"
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
