import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import type { CommitteeWithBillCount } from "../../shared/types";

export async function loadCommittees(): Promise<CommitteeWithBillCount[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("committees")
    .select(
      `
      id,
      name,
      description,
      sort_order,
      is_active,
      created_at,
      updated_at,
      bills(count)
    `
    )
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`委員会の取得に失敗しました: ${error.message}`);
  }

  return (
    data?.map((committee) => ({
      id: committee.id,
      name: committee.name,
      description: committee.description,
      sort_order: committee.sort_order,
      is_active: committee.is_active,
      created_at: committee.created_at,
      updated_at: committee.updated_at,
      bill_count: committee.bills?.[0]?.count ?? 0,
    })) || []
  );
}
