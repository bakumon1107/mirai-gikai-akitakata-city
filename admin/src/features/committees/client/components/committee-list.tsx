"use client";

import type { CommitteeWithBillCount } from "../../shared/types";
import { CommitteeItem } from "./committee-item";

type CommitteeListProps = {
  committees: CommitteeWithBillCount[];
};

export function CommitteeList({ committees }: CommitteeListProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        委員会一覧 ({committees.length}件)
      </h2>

      {committees.length === 0 ? (
        <p className="text-gray-500">委員会がありません</p>
      ) : (
        <div className="space-y-2">
          {committees.map((committee) => (
            <CommitteeItem key={committee.id} committee={committee} />
          ))}
        </div>
      )}
    </div>
  );
}
