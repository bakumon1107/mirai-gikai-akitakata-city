import "server-only";

export type FactionRecord = {
  id: string;
  display_name: string;
  alternative_names: string[];
};

/**
 * 会派名でDBの会派を検索する。
 *
 * マッチング方式（完全一致のみ）:
 * 1. display_name と完全一致
 * 2. alternative_names のいずれかと完全一致
 *
 * 部分一致は使用しない。
 * 略称・旧称など全ての別表記は alternative_names に明示登録することで対応する。
 * 部分一致を許可すると「県議会議員団」が「自由民主党県議会議員団」など
 * 別の会派に誤マッチする問題が生じるため、完全一致のみとする。
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
  return factions.find((f) =>
    f.alternative_names.some((alt) => alt.toLowerCase() === normalized)
  );
}
