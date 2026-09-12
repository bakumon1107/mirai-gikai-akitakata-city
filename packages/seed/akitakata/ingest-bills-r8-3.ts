/**
 * 令和8年第3回定例会のセッション・議案・AI解説をDBに投入する。
 *
 * generate-bill-contents-r8-3.ts が OUTPUT_DIR に書き出したJSONを
 * **レビューし終えてから** 実行すること。JSONが無い議案はbillsのみ登録し、
 * bill_contents はスキップする（後から再実行すれば追加される）。
 *
 * 実行:
 *   source .env.production && \
 *   NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL \
 *   SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
 *   pnpm --filter @mirai-gikai/seed exec tsx akitakata/ingest-bills-r8-3.ts [--dry-run]
 */

import * as path from "node:path";
import {
  BILLS,
  DEFAULT_PUBLISHED_AT,
  OUTPUT_DIR,
  SESSION_END,
  SESSION_NAME,
  SESSION_SLUG,
  SESSION_START,
  SESSION_URL,
} from "./bills-r8-3-data";
import {
  createSeedClient,
  type Difficulty,
  ensureBill,
  ensureSession,
  hasContent,
  insertContent,
  readBillContentFile,
} from "./lib/bill-pipeline";

const isDryRun = process.argv.includes("--dry-run");

function generatedPath(billNumber: string, difficulty: Difficulty): string {
  return path.join(OUTPUT_DIR, `${billNumber}-${difficulty}.json`);
}

async function main(): Promise<void> {
  const supabase = createSeedClient();

  console.log(
    isDryRun
      ? `\n🔍 DRY RUN: ${SESSION_NAME} 投入内容の確認のみ（DBは変更しません）`
      : `\n🚀 ${SESSION_NAME} DB投入開始: ${BILLS.length}件`
  );
  console.log(`   AI解説の読み込み元: ${OUTPUT_DIR}`);

  const sessionId = await ensureSession(
    supabase,
    {
      slug: SESSION_SLUG,
      name: SESSION_NAME,
      startDate: SESSION_START,
      endDate: SESSION_END,
      councilUrl: SESSION_URL,
    },
    isDryRun
  );
  if (!sessionId) {
    console.error("セッションを準備できなかったため中断します");
    process.exitCode = 1;
    return;
  }

  let missingContent = 0;

  for (const meta of BILLS) {
    console.log("\n────────────────────────────────");
    console.log(`📋 [${meta.billNumber}] ${meta.name.slice(0, 50)}`);

    const billId = await ensureBill(
      supabase,
      {
        billNumber: meta.billNumber,
        name: meta.name,
        committeeId: meta.committeeId,
        pdfUrl: meta.pdfUrl,
        publishedAt: meta.publishedAt ?? DEFAULT_PUBLISHED_AT,
      },
      sessionId,
      isDryRun
    );
    if (!billId) continue;

    for (const difficulty of ["normal", "hard"] as const) {
      const generated = readBillContentFile(
        generatedPath(meta.billNumber, difficulty)
      );
      if (!generated) {
        console.warn(`  ⚠️  ${difficulty}: 生成JSONなし → スキップ`);
        missingContent += 1;
        continue;
      }
      // 既存議案に対しては ensureBill が dry-run でも本物のIDを返すため、
      // billId の形ではなく isDryRun で判定しないと実際に書き込んでしまう
      if (isDryRun) {
        console.log(`  [dry-run] ${difficulty}: "${generated.title}"`);
        continue;
      }
      if (await hasContent(supabase, billId, difficulty)) {
        console.log(`  ⏭️  ${difficulty}: 既存スキップ`);
        continue;
      }
      await insertContent(supabase, billId, difficulty, generated);
      console.log(`  ✅ ${difficulty}: "${generated.title}"`);
    }
  }

  if (missingContent > 0) {
    console.warn(
      `\n⚠️  AI解説が未生成の枠が ${missingContent} 件あります（bill_contents が無い議案は一覧に表示されません）`
    );
  }
  console.log(isDryRun ? "\n\n✨ DRY RUN 完了" : "\n\n✨ 全処理完了");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
