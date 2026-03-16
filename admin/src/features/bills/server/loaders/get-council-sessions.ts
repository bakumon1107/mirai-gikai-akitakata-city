import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";

export async function getCouncilSessions() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("council_sessions")
    .select("id, name")
    .order("created_at", { ascending: false });
  return data ?? [];
}
