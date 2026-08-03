import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";
import type { CouncilSession } from "@/features/council-sessions/shared/types";

export type QuestionSessionSummary = {
  session: CouncilSession;
  questionerCount: number;
};

/**
 * 公開済みの一般質問がある定例会を、質問者数とあわせて新しい順に返す。
 */
export async function getQuestionSessionSummaries(): Promise<
  QuestionSessionSummary[]
> {
  const supabase = createAdminClient();

  const { data: rows, error: qErr } = await supabase
    .from("general_questions")
    .select("council_session_id")
    .eq("publish_status", "published");

  if (qErr || !rows?.length) return [];

  const countBySession = new Map<string, number>();
  for (const row of rows as { council_session_id: string }[]) {
    countBySession.set(
      row.council_session_id,
      (countBySession.get(row.council_session_id) ?? 0) + 1
    );
  }

  const { data: sessions, error: sErr } = await supabase
    .from("council_sessions")
    .select("*")
    .in("id", [...countBySession.keys()])
    .order("start_date", { ascending: false });

  if (sErr) return [];

  return ((sessions ?? []) as CouncilSession[]).map((session) => ({
    session,
    questionerCount: countBySession.get(session.id) ?? 0,
  }));
}
