/**
 * ingest-gq-outputs.ts
 *
 * /tmp/gq-outputs/<session_slug>-day<N>/ 配下のJSONを読み込み、
 * DBの対応レコードの topics / summary / questioner_party を更新する。
 * raw_text / questioner_name / publish_status 等はそのまま保持される。
 *
 * 使い方:
 *   tsx --env-file=../../.env akitakata/ingest-gq-outputs.ts \
 *     /tmp/gq-outputs r8-1 [/tmp/gq-sections] [--dry-run]
 *
 * sectionsDir を指定するとセクションファイル（.txt）を raw_text として一緒に登録する。
 */

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createAdminClient } from "../shared/helper";

type GeneratedTopic = {
  title: string;
  question_summary: string;
  answer_summary: string;
  answerer_role: string;
  answerer_name: string;
  raw_question?: string | null;
  raw_answer?: string | null;
};

type OutputJson = {
  questioner_party: string | null;
  summary: string;
  topics: GeneratedTopic[];
};

function upsertViaCurl(record: Record<string, unknown>): void {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const tmpFile = path.join(os.tmpdir(), `ingest-gq-${Date.now()}.json`);
  fs.writeFileSync(tmpFile, JSON.stringify(record), "utf-8");
  try {
    execSync(
      `curl -sf -X POST "${supabaseUrl}/rest/v1/general_questions?on_conflict=council_session_id,session_day,question_order" \
        -H "apikey: ${serviceKey}" \
        -H "Authorization: Bearer ${serviceKey}" \
        -H "Content-Type: application/json" \
        -H "Prefer: resolution=merge-duplicates,return=minimal" \
        --data-binary @${tmpFile}`,
      { encoding: "utf-8", shell: "/bin/bash" }
    );
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const nonFlagArgs = args.filter((a) => !a.startsWith("--"));

  if (nonFlagArgs.length < 2) {
    console.error(
      "使い方: tsx akitakata/ingest-gq-outputs.ts <outputs_dir> <session_slug> [sections_dir] [--dry-run]"
    );
    console.error("  例: tsx --env-file=../../.env akitakata/ingest-gq-outputs.ts /tmp/gq-outputs r8-1 /tmp/gq-sections");
    process.exit(1);
  }

  const [outputsDir, sessionSlug, sectionsDir] = nonFlagArgs;

  console.log(isDryRun ? "🔍 DRY RUN モード" : "🚀 ingest-gq-outputs 開始");
  console.log(`  セッション: ${sessionSlug}  出力ディレクトリ: ${outputsDir}`);

  const supabase = createAdminClient();

  const { data: session, error: sessionError } = await supabase
    .from("council_sessions")
    .select("id")
    .eq("slug", sessionSlug)
    .single();

  if (sessionError || !session) {
    console.error(`❌ セッション未発見 (slug=${sessionSlug}):`, sessionError?.message);
    process.exit(1);
  }

  const councilSessionId = session.id;
  console.log(`📅 council_session_id: ${councilSessionId}\n`);

  let successCount = 0;
  let errorCount = 0;

  const dayDirs = fs.readdirSync(outputsDir).sort();
  for (const dayDir of dayDirs) {
    const match = dayDir.match(new RegExp(`^${sessionSlug}-day(\\d+)$`));
    if (!match) continue;

    const sessionDay = parseInt(match[1], 10);
    const dayPath = path.join(outputsDir, dayDir);

    console.log(`📁 ${dayDir}  (第${sessionDay}日)`);

    const files = fs.readdirSync(dayPath).sort();
    for (const file of files) {
      if (!file.endsWith(".json")) continue;

      const orderMatch = file.match(/^(\d+)_(.+)\.json$/);
      if (!orderMatch) {
        console.warn(`  ⚠️ スキップ（order不明）: ${file}`);
        continue;
      }
      const questionOrder = parseInt(orderMatch[1], 10);
      const questionerName = orderMatch[2];
      const filePath = path.join(dayPath, file);

      let parsed: OutputJson;
      try {
        parsed = JSON.parse(fs.readFileSync(filePath, "utf-8")) as OutputJson;
      } catch (e) {
        console.error(`  ❌ JSON読み込みエラー: ${file}`, e);
        errorCount++;
        continue;
      }

      const topics = (parsed.topics ?? []).map((t) => ({
        title: t.title ?? "",
        question_summary: t.question_summary ?? "",
        answer_summary: t.answer_summary ?? "",
        answerer_role: t.answerer_role ?? "",
        answerer_name: t.answerer_name ?? "",
        raw_question: t.raw_question ?? null,
        raw_answer: t.raw_answer ?? null,
      }));

      const topicTitles = topics.map((t) => t.title).join(" / ");
      console.log(`  [order=${questionOrder}] ${file}`);
      console.log(`    topics (${topics.length}): ${topicTitles}`);

      let rawText: string | null = null;
      if (sectionsDir) {
        const txtPath = path.join(
          sectionsDir,
          dayDir,
          file.replace(/\.json$/, ".txt")
        );
        if (fs.existsSync(txtPath)) {
          // ○ (U+25CB) を ◯ (U+25EF) に正規化して RawTranscriptView の split と合わせる
          rawText = fs.readFileSync(txtPath, "utf-8").replace(/○/g, "◯");
          console.log(`    raw_text: ${txtPath.split("/").slice(-1)[0]} (${rawText.length}文字)`);
        } else {
          console.warn(`    ⚠️ セクションファイル未発見: ${txtPath}`);
        }
      }

      if (isDryRun) continue;

      const record: Record<string, unknown> = {
        council_session_id: councilSessionId,
        session_day: sessionDay,
        question_order: questionOrder,
        questioner_name: questionerName,
        questioner_party: parsed.questioner_party ?? null,
        summary: parsed.summary ?? "",
        topics,
        publish_status: "published",
        ...(rawText !== null ? { raw_text: rawText } : {}),
      };

      try {
        upsertViaCurl(record);
        console.log(`    ✅ upsert完了`);
        successCount++;
      } catch (e) {
        console.error(`    ❌ upsertエラー:`, e);
        errorCount++;
      }
    }
    console.log();
  }

  if (isDryRun) {
    console.log("✅ DRY RUN 完了（DBへの書き込みなし）");
  } else {
    console.log(`🎉 完了  成功: ${successCount} 件 / エラー: ${errorCount} 件`);
  }
}

main().catch(console.error);
