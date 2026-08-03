/**
 * update-gq-raw-text.ts
 *
 * セクションファイル（.txt）から general_questions.raw_text を貼り替える。
 * 議長ターンを含む議事録から取り込み直したいときに使う。
 *
 * 使い方:
 *   # 差分の確認のみ（DBは変更しない）
 *   tsx --env-file=../../.env akitakata/update-gq-raw-text.ts <sections_dir> <out_dir>
 *
 *   # 実際にDBを更新する
 *   tsx --env-file=../../.env akitakata/update-gq-raw-text.ts <sections_dir> <out_dir> --apply
 *
 * sections_dir は `<sections_dir>/<任意のディレクトリ>/<order>_<questioner_name>.txt`
 * の構成を想定する。ファイル名の議員名でDBのレコードと突き合わせる。
 *
 * 安全確認として、既存 raw_text の発言が新しいテキストにすべて含まれることを
 * チェックし、含まれないレコードはスキップする。
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { normalizeTranscriptText } from "@mirai-gikai/shared/transcript/unwrap";
import { createAdminClient } from "../shared/helper";

const SPEAKER_MARK_RE = /^[◯○〇]/;
const strip = (s: string) => s.replace(/\s/g, "");

type Turn = { speaker: string; text: string };

function toTurns(text: string): Turn[] {
  const turns: Turn[] = [];
  for (const para of normalizeTranscriptText(text).split("\n")) {
    if (SPEAKER_MARK_RE.test(para)) {
      const m = para.replace(SPEAKER_MARK_RE, "").match(/^(.+?)\s{2,}([\s\S]*)$/);
      turns.push(
        m
          ? { speaker: strip(m[1]), text: strip(m[2]) }
          : { speaker: "?", text: strip(para) }
      );
    } else if (turns.length > 0) {
      turns[turns.length - 1].text += strip(para);
    }
  }
  return turns;
}

const isChair = (speaker: string) => /議長/.test(speaker);

/** 既存の発言が新テキストに引き継がれているか確認する */
function isSafeReplacement(
  before: string,
  after: string
): { safe: boolean; reason?: string } {
  const beforeTurns = toTurns(before).filter((t) => !isChair(t.speaker));
  const afterTurns = toTurns(after).filter((t) => !isChair(t.speaker));

  if (beforeTurns.length !== afterTurns.length) {
    return {
      safe: false,
      reason: `議長以外のターン数が変わる（${beforeTurns.length} → ${afterTurns.length}）`,
    };
  }
  for (const [i, b] of beforeTurns.entries()) {
    const a = afterTurns[i];
    if (b.speaker !== a.speaker) {
      return { safe: false, reason: `ターン${i}の話者が変わる（${b.speaker} → ${a.speaker}）` };
    }
    // 旧テキストには議長の指名文言などが混ざっているため前方一致で確認する
    if (!b.text.startsWith(a.text) && !a.text.startsWith(b.text)) {
      return { safe: false, reason: `ターン${i}の本文が一致しない` };
    }
  }
  return { safe: true };
}

function collectSections(sectionsDir: string): Map<string, string> {
  const byName = new Map<string, string>();
  for (const entry of fs.readdirSync(sectionsDir)) {
    const entryPath = path.join(sectionsDir, entry);
    if (!fs.statSync(entryPath).isDirectory()) continue;
    for (const file of fs.readdirSync(entryPath)) {
      if (!file.endsWith(".txt")) continue;
      const name = file.replace(/^\d+_/, "").replace(/\.txt$/, "");
      byName.set(name, path.join(entryPath, file));
    }
  }
  return byName;
}

async function main() {
  const args = process.argv.slice(2);
  const isApply = args.includes("--apply");
  const [sectionsDir, outDir] = args.filter((a) => !a.startsWith("--"));

  if (!sectionsDir || !outDir) {
    console.error(
      "使い方: tsx akitakata/update-gq-raw-text.ts <sections_dir> <out_dir> [--apply]"
    );
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });
  console.log(isApply ? "🚀 DB更新モード" : "🔍 確認モード（DBは変更しない）");

  const sections = collectSections(sectionsDir);
  console.log(`  セクションファイル: ${sections.size}件  出力先: ${outDir}\n`);

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

  let updated = 0;
  let skipped = 0;

  for (const q of questions) {
    const label = `第${q.session_day}日-${q.question_order} ${q.questioner_name}`;
    const filePath = sections.get(q.questioner_name);
    if (!filePath) {
      console.warn(`  ⚠️  ${label}: セクションファイル未発見`);
      skipped++;
      continue;
    }

    const before = q.raw_text ?? "";
    // ○ (U+25CB) を ◯ (U+25EF) に正規化し、折り返し改行を除去する
    const after = normalizeTranscriptText(
      fs.readFileSync(filePath, "utf-8").replace(/○/g, "◯")
    );

    if (before === after) {
      console.log(`  ⏭️  ${label}: 変更なし`);
      continue;
    }

    const { safe, reason } = isSafeReplacement(before, after);
    if (!safe) {
      console.error(`  ❌ ${label}: ${reason} → スキップ`);
      skipped++;
      continue;
    }

    const baseName = `${q.session_day}-${String(q.question_order).padStart(2, "0")}_${q.questioner_name}`;
    fs.writeFileSync(path.join(outDir, `${baseName}.before.txt`), before);
    fs.writeFileSync(path.join(outDir, `${baseName}.after.txt`), after);

    const chairTurns = toTurns(after).filter((t) => isChair(t.speaker)).length;
    console.log(
      `  ✏️  ${label}: ${before.split("\n").length} → ${after.split("\n").length}段落（議長${chairTurns}ターンを追加）`
    );

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
    updated++;
  }

  console.log(
    `\n${isApply ? "🎉 完了" : "✅ 確認完了（DBは変更していない）"}  対象: ${updated}件 / スキップ: ${skipped}件`
  );
  if (!isApply && updated > 0) {
    console.log("  問題なければ --apply を付けて再実行してください。");
  }
}

main().catch(console.error);
