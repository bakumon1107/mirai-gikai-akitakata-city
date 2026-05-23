import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";
import type {
  BillSearchResult,
  QuestionSearchResult,
  PressConferenceSearchResult,
} from "../../shared/types/search-types";

export async function searchBills(query: string): Promise<BillSearchResult[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bill_contents")
    .select(
      `
      bill_id,
      title,
      summary,
      bills!inner (
        id,
        publish_status,
        published_at,
        council_sessions (name),
        bills_tags (
          tags (label)
        )
      )
    `
    )
    .eq("difficulty_level", "normal")
    .or(`title.ilike.%${query}%,summary.ilike.%${query}%`)
    .limit(50);

  if (error) throw new Error(`Failed to search bills: ${error.message}`);

  return (data ?? [])
    .filter((row) => {
      const bill = row.bills as { publish_status: string };
      return bill.publish_status === "published";
    })
    .map((row) => {
      const bill = row.bills as {
        id: string;
        published_at: string | null;
        council_sessions: { name: string } | null;
        bills_tags: Array<{ tags: { label: string } | null }>;
      };
      return {
        id: bill.id,
        title: row.title,
        summary: row.summary,
        session: bill.council_sessions?.name ?? "",
        publishedAt: bill.published_at,
        tags: bill.bills_tags
          .map((bt) => bt.tags?.label)
          .filter((l): l is string => l != null),
      };
    });
}

export async function searchGeneralQuestions(
  query: string
): Promise<QuestionSearchResult[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("general_questions")
    .select(
      `
      id,
      questioner_name,
      summary,
      topics,
      council_sessions (name)
    `
    )
    .eq("publish_status", "published")
    .or(`summary.ilike.%${query}%,questioner_name.ilike.%${query}%`)
    .limit(50);

  if (error) throw new Error(`Failed to search questions: ${error.message}`);

  return (data ?? []).map((row) => {
    const topics = Array.isArray(row.topics)
      ? (row.topics as Array<{ title: string }>)
      : [];
    const session =
      (row.council_sessions as { name: string } | null)?.name ?? "";
    return {
      id: row.id,
      questioner: row.questioner_name,
      topics: topics.map((t) => t.title),
      summary: row.summary,
      session,
    };
  });
}

export async function searchPressConferences(
  query: string
): Promise<PressConferenceSearchResult[]> {
  const supabase = createAdminClient();

  // タイトル検索と議題内容検索を並列実行して結果をマージ
  const [titleResult, itemResult] = await Promise.all([
    supabase
      .from("press_conferences")
      .select("id, slug, title, held_at")
      .eq("status", "published")
      .ilike("title", `%${query}%`)
      .limit(20),
    supabase
      .from("press_conference_items")
      .select(
        `
        press_conferences!inner (
          id,
          slug,
          title,
          held_at,
          status
        )
      `
      )
      .or(`title.ilike.%${query}%,summary.ilike.%${query}%`)
      .limit(50),
  ]);

  if (titleResult.error)
    throw new Error(
      `Failed to search press conferences: ${titleResult.error.message}`
    );
  if (itemResult.error)
    throw new Error(
      `Failed to search press conference items: ${itemResult.error.message}`
    );

  type PcRow = {
    id: string;
    slug: string;
    title: string;
    held_at: string;
    status: string;
  };

  const seen = new Set<string>();
  const results: PressConferenceSearchResult[] = [];

  const add = (pc: PcRow) => {
    if (seen.has(pc.id) || pc.status !== "published") return;
    seen.add(pc.id);
    results.push({
      id: pc.id,
      slug: pc.slug,
      title: pc.title,
      heldAt: pc.held_at,
    });
  };

  for (const row of titleResult.data ?? []) add(row as PcRow);
  for (const row of itemResult.data ?? []) {
    const pc = row.press_conferences as unknown as PcRow;
    if (pc) add(pc);
  }

  return results;
}
