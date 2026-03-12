"use server";

import { createAdminClient } from "@mirai-gikai/supabase";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import type { FactionMatchStatus } from "../../shared/types";
import { findFactionByName } from "../utils/faction-matching";

/**
 * 会派名リストに対して、DBの会派とのマッチング状況を返す。
 * display_name の完全一致 → alternative_names の完全一致 → 部分一致の順で検索。
 */
export async function getFactionMatchStatus(
  factionNames: string[]
): Promise<FactionMatchStatus[]> {
  await requireAdmin();

  if (factionNames.length === 0) return [];

  const supabase = createAdminClient();
  const { data: allFactions } = await supabase
    .from("factions")
    .select("id, display_name, alternative_names");

  const factions = allFactions ?? [];

  return factionNames.map((searchName) => {
    const normalized = searchName.trim().toLowerCase();

    const matched = findFactionByName(factions, searchName);
    if (!matched) {
      return {
        factionName: searchName,
        matchedFactionId: null,
        matchedDisplayName: null,
        matchedBy: null,
      };
    }

    const matchedBy =
      matched.display_name.toLowerCase() === normalized
        ? "display_name"
        : "alternative_name";

    return {
      factionName: searchName,
      matchedFactionId: matched.id,
      matchedDisplayName: matched.display_name,
      matchedBy,
    };
  });
}
