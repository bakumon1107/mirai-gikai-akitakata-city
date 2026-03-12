"use server";

import { createAdminClient } from "@mirai-gikai/supabase";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";

type FactionMatchStatus = {
  factionName: string;
  matchedFactionId: string | null;
  matchedDisplayName: string | null;
  /** display_nameで一致したか、alternative_namesで一致したか */
  matchedBy: "display_name" | "alternative_name" | null;
};

/**
 * 会派名リストに対して、DBの会派とのマッチング状況を返す。
 * display_name・alternative_names の部分一致で検索。
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

    for (const f of factions) {
      const displayMatch =
        f.display_name.toLowerCase().includes(normalized) ||
        normalized.includes(f.display_name.toLowerCase());
      if (displayMatch) {
        return {
          factionName: searchName,
          matchedFactionId: f.id,
          matchedDisplayName: f.display_name,
          matchedBy: "display_name",
        };
      }
      const altMatch = f.alternative_names.find(
        (alt) =>
          alt.toLowerCase().includes(normalized) ||
          normalized.includes(alt.toLowerCase())
      );
      if (altMatch) {
        return {
          factionName: searchName,
          matchedFactionId: f.id,
          matchedDisplayName: f.display_name,
          matchedBy: "alternative_name",
        };
      }
    }

    return {
      factionName: searchName,
      matchedFactionId: null,
      matchedDisplayName: null,
      matchedBy: null,
    };
  });
}
