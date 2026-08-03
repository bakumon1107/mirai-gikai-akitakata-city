/**
 * normalize-gq-raw-text.ts
 *
 * 登録済みの general_questions.raw_text から、議事録PDF由来の折り返し改行を
 * 除去して1段落1行に正規化する。取り込み時の正規化（ingest-gq-outputs.ts）を
 * 入れる前に登録されたレコードを揃えるための一回限りのスクリプト。
 *
 * 使い方:
 *   # 差分の確認のみ（DBは変更しない。結果は out_dir に保存される）
 *   tsx --env-file=../../.env akitakata/normalize-gq-raw-text.ts /tmp/gq-normalized
 *
 *   # 実際にDBを更新する
 *   tsx --env-file=../../.env akitakata/normalize-gq-raw-text.ts /tmp/gq-normalized --apply
 *
 * 空白を除いた本文が変化するレコードは安全のため必ずスキップする。
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { normalizeTranscriptText } from "@mirai-gikai/shared/transcript/unwrap";
import { createAdminClient } from "../shared/helper";

const stripSpaces = (text: string) => text.replace(/\s/g, "");

async function main() {
  const args = process.argv.slice(2);
  const isApply = args.includes("--apply");
  const [outDir] = args.filter((a) => !a.startsWith("--"));

  if (!outDir) {
    console.error(
      "使い方: tsx akitakata/normalize-gq-raw-text.ts <out_dir> [--apply]"
    );
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });
  console.log(isApply ? "🚀 DB更新モード" : "🔍 確認モード（DBは変更しない）");
  console.log(`  出力先: ${outDir}\n`);

  const supabase = createAdminClient();
  const { data: questions, error } = await supabase
    .from("general_questions")
    .select("id, questioner_name, session_day, question_order, raw_text")
    .not("raw_text", "is", null)
    .order("session_day")
    .order("question_order");

  if (error || !questions) {
    console.error("❌ 取得エラー:", error?.message);
    process.exit(1);
  }

  let changed = 0;
  let skipped = 0;
  let unchanged = 0;

  for (const q of questions) {
    const before = q.raw_text ?? "";
    const after = normalizeTranscriptText(before);
    const label = `第${q.session_day}日-${q.question_order} ${q.questioner_name}`;

    if (before === after) {
      unchanged++;
      console.log(`  ⏭️  ${label}: 正規化済み（変更なし）`);
      continue;
    }

    if (stripSpaces(before) !== stripSpaces(after)) {
      skipped++;
      console.error(`  ❌ ${label}: 本文が変化するためスキップ`);
      continue;
    }

    const baseName = `${q.session_day}-${String(q.question_order).padStart(2, "0")}_${q.questioner_name}`;
    fs.writeFileSync(path.join(outDir, `${baseName}.before.txt`), before);
    fs.writeFileSync(path.join(outDir, `${baseName}.after.txt`), after);

    const beforeLines = before.split("\n").filter((l) => l.trim()).length;
    const afterLines = after.split("\n").length;
    console.log(`  ✏️  ${label}: ${beforeLines}行 → ${afterLines}段落`);

    if (isApply) {
      const { error: updateError } = await supabase
        .from("general_questions")
        .update({ raw_text: after })
        .eq("id", q.id);

      if (updateError) {
        console.error(`     ❌ 更新エラー: ${updateError.message}`);
        skipped++;
        continue;
      }
      console.log("     ✅ 更新完了");
    }
    changed++;
  }

  console.log(
    `\n${isApply ? "🎉 完了" : "✅ 確認完了（DBは変更していない）"}  対象: ${changed}件 / 変更なし: ${unchanged}件 / スキップ: ${skipped}件`
  );
  if (!isApply && changed > 0) {
    console.log(`  差分を確認するには: diff ${outDir}/<名前>.before.txt ${outDir}/<名前>.after.txt`);
    console.log("  問題なければ --apply を付けて再実行してください。");
  }
}

main().catch(console.error);
