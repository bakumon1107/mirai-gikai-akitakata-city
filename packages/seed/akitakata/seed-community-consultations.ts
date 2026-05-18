/**
 * seed-community-consultations.ts
 *
 * 地域懇談会データをDBに投入する。
 * 既存データ（同一fiscal_year）がある場合はスキップする。
 *
 * 使い方:
 *   1. pdftotext /path/to/chiiki-kondankai-r7.pdf /tmp/kondankai-nolayout.txt
 *   2. python3 akitakata/parse-consultation-pdf.py /tmp/kondankai-nolayout.txt > /tmp/opinions.json
 *   3. tsx --env-file=../../.env akitakata/seed-community-consultations.ts /tmp/opinions.json
 */

import fs from "node:fs";
import path from "node:path";
import { createAdminClient } from "../shared/helper";

const CONSULTATION = {
  fiscal_year: "r7",
  fiscal_year_label: "令和7年度",
  title: "令和7年度 地域懇談会",
  pdf_url: null,
  status: "published",
  held_from: "2025-07-23",
  held_to: "2025-08-07",
  total_participants: 99,
  total_opinions: null as number | null,
};

const MEETINGS = [
  { location_name: "八千代町", held_at: "2025-07-23", participant_count: 20, theme: "フリーテーマ" },
  { location_name: "甲田町", held_at: "2025-07-25", participant_count: 15, theme: "地域コミュニティについて" },
  { location_name: "向原町", held_at: "2025-07-30", participant_count: 27, theme: "振興会活動について" },
  { location_name: "美土里町", held_at: "2025-08-01", participant_count: 6, theme: "空き家と駅周辺の活性化について" },
  { location_name: "高宮町", held_at: "2025-08-04", participant_count: 17, theme: "フリーテーマ" },
  { location_name: "吉田町", held_at: "2025-08-07", participant_count: 14, theme: "フリーテーマ" },
];

type OpinionRow = {
  department: string;
  opinion_number: number | null;
  text: string;
  is_cross_department: boolean;
};

async function main() {
  const opinionsFile = process.argv[2];
  if (!opinionsFile) {
    console.error("Usage: tsx seed-community-consultations.ts <opinions.json>");
    process.exit(1);
  }

  const opinions: OpinionRow[] = JSON.parse(
    fs.readFileSync(path.resolve(opinionsFile), "utf-8")
  );

  const supabase = createAdminClient();

  // 既存チェック
  const { data: existing } = await supabase
    .from("community_consultations")
    .select("id")
    .eq("fiscal_year", CONSULTATION.fiscal_year)
    .single();

  if (existing) {
    console.log(`✅ fiscal_year=${CONSULTATION.fiscal_year} は既に存在します。スキップします。`);
    console.log(`   ID: ${existing.id}`);
    return;
  }

  CONSULTATION.total_opinions = opinions.length;

  // 懇談会マスタ挿入
  console.log("📝 community_consultations に挿入中...");
  const { data: consultation, error: consultationError } = await supabase
    .from("community_consultations")
    .insert(CONSULTATION)
    .select()
    .single();

  if (consultationError || !consultation) {
    console.error("❌ 懇談会マスタ挿入失敗:", consultationError);
    process.exit(1);
  }
  console.log(`✅ consultation ID: ${consultation.id}`);

  // 開催記録挿入
  console.log("📍 community_consultation_meetings に挿入中...");
  const { error: meetingsError } = await supabase
    .from("community_consultation_meetings")
    .insert(
      MEETINGS.map((m) => ({ ...m, consultation_id: consultation.id }))
    );

  if (meetingsError) {
    console.error("❌ 開催記録挿入失敗:", meetingsError);
    process.exit(1);
  }
  console.log(`✅ ${MEETINGS.length}件の開催記録を挿入`);

  // 意見挿入（100件ずつバッチ）
  console.log(`💬 community_consultation_opinions に ${opinions.length}件挿入中...`);
  const BATCH = 100;
  let inserted = 0;

  for (let i = 0; i < opinions.length; i += BATCH) {
    const batch = opinions.slice(i, i + BATCH).map((op) => ({
      consultation_id: consultation.id,
      department: op.department,
      opinion_number: op.opinion_number,
      text: op.text,
      is_cross_department: op.is_cross_department,
    }));

    const { error } = await supabase
      .from("community_consultation_opinions")
      .insert(batch);

    if (error) {
      console.error(`❌ 意見挿入失敗 (batch ${i}~${i + BATCH}):`, error);
      process.exit(1);
    }

    inserted += batch.length;
    process.stdout.write(`\r  ${inserted}/${opinions.length}件`);
  }

  console.log("\n✅ 全意見挿入完了");
  console.log("\n📊 サマリー:");
  console.log(`  懇談会: ${CONSULTATION.fiscal_year_label}`);
  console.log(`  開催: ${CONSULTATION.held_from} 〜 ${CONSULTATION.held_to}`);
  console.log(`  参加者総数: ${CONSULTATION.total_participants}人`);
  console.log(`  意見件数: ${opinions.length}件`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
