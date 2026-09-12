/**
 * generate-no-pdf-contents.ts が出力したAI解説をDBに投入する。
 *
 * 対象は既にDBに登録済みの議案のみ。bills の作成は行わない。
 * 生成物を**レビューし終えてから**実行すること。
 *
 * 実行:
 *   source .env.production && \
 *   NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL \
 *   SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
 *   pnpm --filter @mirai-gikai/seed exec tsx akitakata/ingest-no-pdf-contents.ts <session-slug> [bill-number...] [--dry-run]
 *
 * 例:
 *   ... ingest-no-pdf-contents.ts r8-2 doi3 --dry-run
 *   ... ingest-no-pdf-contents.ts r8-2 doi3
 */

import * as path from "node:path";
import {
  createSeedClient,
  findBillsMissingContents,
  hasContent,
  insertContent,
  noPdfOutputDir,
  readBillContentFile,
} from "./lib/bill-pipeline";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const [sessionSlug, ...billNumbers] = args.filter((a) => a !== "--dry-run");

  if (!sessionSlug) {
    console.error(
      "使い方: tsx akitakata/ingest-no-pdf-contents.ts <session-slug> [bill-number...] [--dry-run]"
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
    console.log("✨ 投入対象の議案はありません");
    return;
  }

  const outputDir = noPdfOutputDir(sessionSlug);
  console.log(
    isDryRun
      ? `\n🔍 DRY RUN: ${targets.sessionName} 投入内容の確認のみ（DBは変更しません）`
      : `\n🚀 ${targets.sessionName} AI解説をDB投入: ${targets.bills.length}件`
  );
  console.log(`   読み込み元: ${outputDir}`);

  let missing = 0;
  for (const bill of targets.bills) {
    console.log("\n────────────────────────────────");
    console.log(`📋 [${bill.billNumber}] ${bill.name.slice(0, 50)}`);

    for (const difficulty of ["normal", "hard"] as const) {
      const generated = readBillContentFile(
        path.join(outputDir, `${bill.billNumber}-${difficulty}.json`)
      );
      if (!generated) {
        console.warn(`  ⚠️  ${difficulty}: 生成JSONなし → スキップ`);
        missing += 1;
        continue;
      }
      if (await hasContent(supabase, bill.id, difficulty)) {
        console.log(`  ⏭️  ${difficulty}: 既存スキップ`);
        continue;
      }
      if (isDryRun) {
        console.log(`  [dry-run] ${difficulty}: "${generated.title}"`);
        continue;
      }
      await insertContent(supabase, bill.id, difficulty, generated);
      console.log(`  ✅ ${difficulty}: "${generated.title}"`);
    }
  }

  if (missing > 0) {
    console.warn(`\n⚠️  生成JSONが無い枠が ${missing} 件あります`);
  }
  console.log(isDryRun ? "\n\n✨ DRY RUN 完了" : "\n\n✨ 全処理完了");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
