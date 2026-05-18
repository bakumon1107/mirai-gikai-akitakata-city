import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";
import type { CouncilSession } from "@/features/council-sessions/shared/types";

export async function getSessionsWithQuestions(): Promise<CouncilSession[]> {
  const supabase = createAdminClient();

  const { data: rows, error: qErr } = await supabase
    .from("general_questions")
    .select("council_session_id")
    .eq("publish_status", "published");

  if (qErr || !rows?.length) return [];

  const ids = [
    ...new Set(
      rows.map((r: { council_session_id: string }) => r.council_session_id)
    ),
  ];

  const { data: sessions, error: sErr } = await supabase
    .from("council_sessions")
    .select("*")
    .in("id", ids)
    .order("start_date", { ascending: false });

  if (sErr) return [];
  return (sessions ?? []) as CouncilSession[];
}
