import "server-only";

export type FactionRecord = {
  id: string;
  display_name: string;
  alternative_names: string[];
};

/**
 * 会派名でDBの会派を検索する。
 *
 * マッチング優先順位:
 * 1. display_name と完全一致
 * 2. alternative_names のいずれかと完全一致
 * 3. alternative_names のいずれかと部分一致（双方向）
 *
 * ※ display_name の部分一致は意図しないマッチを防ぐため使用しない。
 *   例: "川崎市議会議員団" が "自由民主党川崎市議会議員団" に誤マッチするのを防ぐ。
 *   略称はすべて alternative_names に登録することで対応する。
 */
export function findFactionByName(
  factions: FactionRecord[],
  searchName: string
): FactionRecord | undefined {
  const normalized = searchName.trim().toLowerCase();

  // 1. display_name と完全一致
  const exactDisplayMatch = factions.find(
    (f) => f.display_name.toLowerCase() === normalized
  );
  if (exactDisplayMatch) return exactDisplayMatch;

  // 2. alternative_names のいずれかと完全一致
  const exactAltMatch = factions.find((f) =>
    f.alternative_names.some((alt) => alt.toLowerCase() === normalized)
  );
  if (exactAltMatch) return exactAltMatch;

  // 3. alternative_names のいずれかと部分一致（双方向）
  return factions.find((f) =>
    f.alternative_names.some((alt) => {
      const altNorm = alt.toLowerCase();
      return normalized.includes(altNorm) || altNorm.includes(normalized);
    })
  );
}
