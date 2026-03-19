import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";

export async function getTags() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("tags")
    .select("id, label")
    .order("label");
  return data ?? [];
}
