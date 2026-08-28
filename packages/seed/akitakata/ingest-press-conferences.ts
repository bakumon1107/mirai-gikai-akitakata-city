/**
 * ingest-press-conferences.ts
 *
 * JSONファイルから市長定例記者会見データをDBに投入する汎用スクリプト。
 * slug が既存の場合はスキップ（再実行安全）。
 *
 * 使い方:
 *   tsx --env-file=../../.env.production akitakata/ingest-press-conferences.ts <JSON_PATH>
 *
 * 例:
 *   tsx --env-file=../../.env.production akitakata/ingest-press-conferences.ts /tmp/press-conference-input.json
 */

import { readFileSync } from "fs";
import { createAdminClient } from "../shared/helper";

type TurnInput = {
  speaker: "mayor" | "reporter";
  speakerName: string | null;
  content: string;
  orderIndex: number;
};

type ResourceLinkInput = {
  label: string;
  url: string;
};

type ItemInput = {
  itemType: "announcement" | "qa";
  orderIndex: number;
  title: string;
  summary: string | null;
  resourceUrls?: ResourceLinkInput[];
  turns: TurnInput[];
};

type PressConferenceInput = {
  slug: string;
  title: string;
  heldAt: string;
  youtubeUrl: string | null;
  status: string;
  items: ItemInput[];
};

async function ingestPressConference(jsonPath: string) {
  const raw = readFileSync(jsonPath, "utf-8");
  const pc: PressConferenceInput = JSON.parse(raw);

  const supabase = createAdminClient();
  console.log(`🎤 会見データの投入を開始します: ${pc.slug}`);

  const { data: existing } = await supabase
    .from("press_conferences")
    .select("id")
    .eq("slug", pc.slug)
    .maybeSingle();

  if (existing) {
    console.log(`⏭️  スキップ（既存）: ${pc.slug}`);
    return;
  }

  const { data: pcData, error: pcError } = await supabase
    .from("press_conferences")
    .insert({
      slug: pc.slug,
      title: pc.title,
      held_at: pc.heldAt,
      youtube_url: pc.youtubeUrl,
      status: pc.status,
    })
    .select("id")
    .single();

  if (pcError || !pcData) {
    console.error("❌ 会見の挿入失敗:", pcError);
    process.exit(1);
  }

  for (const item of pc.items) {
    const { data: itemData, error: itemError } = await supabase
      .from("press_conference_items")
      .insert({
        press_conference_id: pcData.id,
        item_type: item.itemType,
        order_index: item.orderIndex,
        title: item.title,
        summary: item.summary,
        resource_urls: item.resourceUrls ?? [],
      })
      .select("id")
      .single();

    if (itemError || !itemData) {
      console.error(`❌ アイテムの挿入失敗: ${item.title}`, itemError);
      continue;
    }

    if (item.turns.length > 0) {
      const { error: turnsError } = await supabase
        .from("press_conference_turns")
        .insert(
          item.turns.map((turn) => ({
            press_conference_item_id: itemData.id,
            speaker: turn.speaker,
            speaker_name: turn.speakerName,
            content: turn.content,
            order_index: turn.orderIndex,
          }))
        );

      if (turnsError) {
        console.error(`❌ ターンの挿入失敗: ${item.title}`, turnsError);
      }
    }

    console.log(`  ✓ ${item.itemType}: ${item.title}`);
  }

  console.log(`✅ 投入完了: ${pc.slug} (${pc.title})`);
}

const jsonPath = process.argv[2];
if (!jsonPath) {
  console.error("使い方: tsx ingest-press-conferences.ts <JSON_PATH>");
  process.exit(1);
}

ingestPressConference(jsonPath).catch((err) => {
  console.error(err);
  process.exit(1);
});
