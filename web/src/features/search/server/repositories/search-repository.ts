import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";
import type {
  BillSearchResult,
  PressConferenceSearchResult,
  QuestionSearchResult,
  SearchResults,
} from "../../shared/types";
import type { GeneralQuestionTopic } from "@/features/general-questions/shared/types";

export async function searchAll(keyword: string): Promise<SearchResults> {
  // Strip PostgREST filter expression special chars to prevent .or() parsing issues
  const safeKeyword = keyword.replace(/[,()]/g, "");
  const [bills, questions, pressConferences] = await Promise.all([
    searchBills(safeKeyword),
    searchQuestions(safeKeyword),
    searchPressConferences(safeKeyword),
  ]);
  return { bills, questions, pressConferences };
}

async function searchBills(keyword: string): Promise<BillSearchResult[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bill_contents")
    .select(
      `
      id, title, summary, bill_id,
      bills!inner(
        id, publish_status, published_at,
        council_sessions(name),
        tags:bills_tags(tag:tags(label))
      )
    `
    )
    .or(`title.ilike.%${keyword}%,summary.ilike.%${keyword}%`)
    .eq("bills.publish_status", "published")
    .limit(20);

  if (error) {
    throw new Error(`Failed to search bills: ${error.message}`);
  }

  return (data ?? [])
    .map((row) => {
      const bill = row.bills as {
        id: string;
        publish_status: string;
        published_at: string | null;
        council_sessions: { name: string } | null;
        tags: Array<{ tag: { label: string } | null }>;
      };
      return {
        billId: bill.id,
        contentId: row.id,
        title: row.title,
        summary: row.summary,
        sessionName: bill.council_sessions?.name ?? "",
        tags: bill.tags
          .map((t) => t.tag?.label)
          .filter((l): l is string => l != null),
        publishedAt: bill.published_at,
      };
    })
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
}

async function searchQuestions(
  keyword: string
): Promise<QuestionSearchResult[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("general_questions")
    .select(
      `
      id, questioner_name, questioner_party, summary, topics,
      council_sessions(name, slug)
    `
    )
    .eq("publish_status", "published")
    .or(`questioner_name.ilike.%${keyword}%,summary.ilike.%${keyword}%`)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(`Failed to search questions: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const topics = Array.isArray(row.topics)
      ? (row.topics as GeneralQuestionTopic[])
      : [];
    const session = row.council_sessions as {
      name: string;
      slug: string;
    } | null;
    return {
      id: row.id,
      firstTopicTitle: topics[0]?.title ?? row.summary ?? "",
      summary: row.summary,
      questionerName: row.questioner_name,
      questionerParty: row.questioner_party,
      sessionName: session?.name ?? "",
      sessionSlug: session?.slug ?? "",
    };
  });
}

async function searchPressConferences(
  keyword: string
): Promise<PressConferenceSearchResult[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("press_conferences")
    .select("id, slug, title, held_at")
    .eq("status", "published")
    .ilike("title", `%${keyword}%`)
    .order("held_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(`Failed to search press conferences: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    heldAt: row.held_at,
  }));
}
