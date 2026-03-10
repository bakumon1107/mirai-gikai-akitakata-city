import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";

export async function getExistingBillNames(): Promise<string[]> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("bills").select("name");
  return (data ?? []).map((b) => b.name);
}
