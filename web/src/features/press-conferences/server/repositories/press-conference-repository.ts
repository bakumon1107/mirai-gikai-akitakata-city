import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";
import type { PressConference } from "../../shared/types";

type TurnRow = {
  id: string;
  speaker: string;
  speaker_name: string | null;
  content: string;
  order_index: number;
};

type ItemRow = {
  id: string;
  item_type: string;
  order_index: number;
  title: string;
  summary: string | null;
  press_conference_turns: TurnRow[];
};

type PressConferenceRow = {
  id: string;
  slug: string;
  title: string;
  held_at: string;
  youtube_url: string | null;
  status: string;
  press_conference_items: ItemRow[];
};

function mapToPressConference(row: PressConferenceRow): PressConference {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    heldAt: row.held_at,
    youtubeUrl: row.youtube_url,
    status: row.status as PressConference["status"],
    items: [...(row.press_conference_items ?? [])]
      .sort((a, b) => a.order_index - b.order_index)
      .map((item) => ({
        id: item.id,
        itemType: item.item_type as "announcement" | "qa",
        orderIndex: item.order_index,
        title: item.title,
        summary: item.summary,
        turns: [...(item.press_conference_turns ?? [])]
          .sort((a, b) => a.order_index - b.order_index)
          .map((turn) => ({
            id: turn.id,
            speaker: turn.speaker as "mayor" | "reporter",
            speakerName: turn.speaker_name,
            content: turn.content,
            orderIndex: turn.order_index,
          })),
      })),
  };
}

const NESTED_SELECT = `
  *,
  press_conference_items (
    *,
    press_conference_turns (*)
  )
` as const;

export async function findPublishedPressConferences(): Promise<
  PressConference[]
> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("press_conferences")
    .select(NESTED_SELECT)
    .eq("status", "published")
    .order("held_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch press conferences: ${error.message}`);
  }

  return (data ?? []).map((row) =>
    mapToPressConference(row as unknown as PressConferenceRow)
  );
}

export async function findPublishedPressConferenceBySlug(
  slug: string
): Promise<PressConference | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("press_conferences")
    .select(NESTED_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to fetch press conference by slug: ${error.message}`
    );
  }

  return data
    ? mapToPressConference(data as unknown as PressConferenceRow)
    : null;
}

export async function findLatestPublishedPressConference(): Promise<PressConference | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("press_conferences")
    .select(NESTED_SELECT)
    .eq("status", "published")
    .order("held_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to fetch latest press conference: ${error.message}`
    );
  }

  return data
    ? mapToPressConference(data as unknown as PressConferenceRow)
    : null;
}
