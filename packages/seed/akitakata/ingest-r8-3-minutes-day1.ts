/**
 * 令和8年第3回定例会 第1日目（9月7日）議事録の反映
 *
 * 出典（速報版）:
 *   https://www.akitakata.jp/akitakata-media/filer_public/12/6e/126ec189-e59f-4874-aa20-fbd68d69e74d/sokuhou-han-aki-takadashi-rei-wa-8nen-daisankai-teireikai-1r080907.pdf
 *
 * 第1日目は提案理由の説明・監査報告・付託のみで、**全議案とも「質疑なし」**だった。
 * そのため bill_discussions への登録はなく、ステータスの反映だけを行う。
 *
 * 議案第57号は9月11日提出の追加議案のため、この日の議事日程に含まれない。
 *
 * 実行:
 *   source .env.production && \
 *   NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL \
 *   SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
 *   pnpm --filter @mirai-gikai/seed exec tsx akitakata/ingest-r8-3-minutes-day1.ts [--dry-run]
 */

import { COM_SANGYO, SESSION_NAME, SESSION_SLUG } from "./bills-r8-3-data";
import {
  applyBillStatusUpdates,
  type BillStatusUpdate,
  createSeedClient,
} from "./lib/bill-pipeline";

const NINTEI_NUMBERS = Array.from({ length: 15 }, (_, i) => `nin${i + 1}`);

const UPDATES: BillStatusUpdate[] = [
  // 日程第3〜17: 認定第1〜15号 … 提案理由説明・監査報告のあと質疑なし、一括付託
  ...NINTEI_NUMBERS.map(
    (billNumber): BillStatusUpdate => ({
      billNumber,
      status: "in_committee",
      statusNote: "9/7 予算決算常任委員会に付託",
    })
  ),

  // 日程第18: 諮問第4号 … 質疑・討論・委員会付託を省略し、異議なく同意
  {
    billNumber: "shi4",
    status: "approved",
    statusNote: "9/7 本会議で異議なく同意",
  },

  // 日程第19: 議案第48号 … 質疑なし
  {
    billNumber: "48",
    status: "in_committee",
    statusNote: "9/7 総務文教常任委員会に付託",
  },

  // 日程第20: 議案第49号 … 質疑なし、委員会付託省略、討論なし、起立多数で可決
  {
    billNumber: "49",
    status: "approved",
    statusNote: "9/7 本会議で起立多数により可決（委員会付託省略）",
  },

  // 日程第21・22: 議案第50・51号 … 一括質疑なし
  // 付託先は産業厚生常任委員会。登録時に総務文教と見立てていたので正す
  {
    billNumber: "50",
    status: "in_committee",
    statusNote: "9/7 産業厚生常任委員会に付託",
    committeeId: COM_SANGYO,
  },
  {
    billNumber: "51",
    status: "in_committee",
    statusNote: "9/7 産業厚生常任委員会に付託",
    committeeId: COM_SANGYO,
  },

  // 日程第23〜27: 議案第52〜56号（補正予算）… 一括質疑なし
  ...["52", "53", "54", "55", "56"].map(
    (billNumber): BillStatusUpdate => ({
      billNumber,
      status: "in_committee",
      statusNote: "9/7 予算決算常任委員会に付託",
    })
  ),
];

async function main(): Promise<void> {
  const isDryRun = process.argv.includes("--dry-run");
  console.log(
    isDryRun
      ? `\n🔍 DRY RUN: ${SESSION_NAME} 第1日目（9/7）議事録の反映内容（DBは変更しません）`
      : `\n🚀 ${SESSION_NAME} 第1日目（9/7）議事録を反映: ${UPDATES.length}件`
  );

  const ok = await applyBillStatusUpdates(
    createSeedClient(),
    SESSION_SLUG,
    UPDATES,
    isDryRun
  );
  if (!ok) {
    process.exitCode = 1;
    return;
  }
  console.log(isDryRun ? "\n✨ DRY RUN 完了" : "\n✨ 反映完了");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
