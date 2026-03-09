import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import type { Database } from "@mirai-gikai/supabase";

export type Faction = Database["public"]["Tables"]["factions"]["Row"];

export async function getFactions(): Promise<Faction[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("factions")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to fetch factions:", error);
    return [];
  }

  return data ?? [];
}
