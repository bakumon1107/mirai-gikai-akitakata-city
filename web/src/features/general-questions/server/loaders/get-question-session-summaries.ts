import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";
import type { CouncilSession } from "@/features/council-sessions/shared/types";
import {
  countQuestionersBySession,
  type QuestionerRow,
} from "../../shared/utils/count-questioners-by-session";

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
    .select("council_session_id, questioner_name")
    .eq("publish_status", "published");

  if (qErr) {
    throw new Error(`Failed to fetch general questions: ${qErr.message}`);
  }
  if (!rows?.length) return [];

  const countBySession = countQuestionersBySession(rows as QuestionerRow[]);

  const { data: sessions, error: sErr } = await supabase
    .from("council_sessions")
    .select("*")
    .in("id", [...countBySession.keys()])
    .order("start_date", { ascending: false });

  if (sErr) {
    throw new Error(`Failed to fetch council sessions: ${sErr.message}`);
  }

  return ((sessions ?? []) as CouncilSession[]).map((session) => ({
    session,
    questionerCount: countBySession.get(session.id) ?? 0,
  }));
}
