import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";

export async function getExistingBillNumbers(): Promise<string[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("bills")
    .select("bill_number")
    .neq("bill_number", "");
  return (data ?? []).map((b) => b.bill_number);
}
