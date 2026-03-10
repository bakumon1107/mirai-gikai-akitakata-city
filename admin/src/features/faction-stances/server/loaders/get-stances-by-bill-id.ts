import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import type { StanceTypeEnum } from "../../shared/types";

export type FactionStanceWithFaction = {
  id: string;
  bill_id: string;
  faction_id: string;
  type: StanceTypeEnum;
  comment: string | null;
  faction: {
    id: string;
    name: string;
    display_name: string;
    sort_order: number;
  };
};

export async function getStancesByBillId(
  billId: string
): Promise<FactionStanceWithFaction[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("faction_stances")
    .select(
      "id, bill_id, faction_id, type, comment, factions(id, name, display_name, sort_order)"
    )
    .eq("bill_id", billId);

  if (error) {
    console.error("Failed to fetch stances:", error);
    return [];
  }

  return (data ?? []).map((s) => ({
    id: s.id,
    bill_id: s.bill_id,
    faction_id: s.faction_id,
    type: s.type,
    comment: s.comment,
    faction: s.factions as unknown as {
      id: string;
      name: string;
      display_name: string;
      sort_order: number;
    },
  }));
}
