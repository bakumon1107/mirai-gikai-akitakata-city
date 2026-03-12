import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import type { FactionWithStanceCount } from "../../shared/types";

export async function loadFactions(): Promise<FactionWithStanceCount[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("factions")
    .select(
      `
      id,
      name,
      display_name,
      alternative_names,
      logo_url,
      sort_order,
      is_active,
      created_at,
      updated_at,
      faction_stances(count)
    `
    )
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`会派の取得に失敗しました: ${error.message}`);
  }

  return (
    data?.map((faction) => ({
      id: faction.id,
      name: faction.name,
      display_name: faction.display_name,
      alternative_names: faction.alternative_names,
      logo_url: faction.logo_url,
      sort_order: faction.sort_order,
      is_active: faction.is_active,
      created_at: faction.created_at,
      updated_at: faction.updated_at,
      stance_count: faction.faction_stances?.[0]?.count ?? 0,
    })) || []
  );
}
