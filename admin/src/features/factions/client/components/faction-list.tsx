"use client";

import type { FactionWithStanceCount } from "../../shared/types";
import { FactionItem } from "./faction-item";

type FactionListProps = {
  factions: FactionWithStanceCount[];
};

export function FactionList({ factions }: FactionListProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">会派一覧 ({factions.length}件)</h2>

      {factions.length === 0 ? (
        <p className="text-gray-500">会派がありません</p>
      ) : (
        <div className="space-y-2">
          {factions.map((faction) => (
            <FactionItem key={faction.id} faction={faction} />
          ))}
        </div>
      )}
    </div>
  );
}
