"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { BillTag, BillWithContent } from "@/features/bills/shared/types";
import { CompactBillCard } from "@/features/bills/client/components/bill-list/compact-bill-card";

type StatusFilterType = "all" | "approved" | "rejected" | "other";

type Props = {
  bills: BillWithContent[];
};

function getStatusFilterCounts(bills: BillWithContent[]) {
  const approved = bills.filter((b) => b.status === "approved").length;
  const rejected = bills.filter((b) => b.status === "rejected").length;
  const other = bills.length - approved - rejected;

  return { all: bills.length, approved, rejected, other };
}

function filterBillsByStatus(
  bills: BillWithContent[],
  filter: StatusFilterType
): BillWithContent[] {
  switch (filter) {
    case "approved":
      return bills.filter((b) => b.status === "approved");
    case "rejected":
      return bills.filter((b) => b.status === "rejected");
    case "other":
      return bills.filter(
        (b) => b.status !== "approved" && b.status !== "rejected"
      );
    default:
      return bills;
  }
}

function filterBillsByTag(
  bills: BillWithContent[],
  tagId: string | null
): BillWithContent[] {
  if (!tagId) return bills;
  return bills.filter((b) => b.tags.some((t) => t.id === tagId));
}

function getUniqueTags(bills: BillWithContent[]): BillTag[] {
  const tagMap = new Map<string, BillTag>();
  for (const bill of bills) {
    for (const tag of bill.tags) {
      if (!tagMap.has(tag.id)) {
        tagMap.set(tag.id, tag);
      }
    }
  }
  return Array.from(tagMap.values());
}

export function BillListWithStatusFilter({ bills }: Props) {
  const [activeStatusFilter, setActiveStatusFilter] =
    useState<StatusFilterType>("all");
  const [activeTagId, setActiveTagId] = useState<string | null>(null);

  const statusCounts = getStatusFilterCounts(bills);
  const uniqueTags = useMemo(() => getUniqueTags(bills), [bills]);

  const filteredBills = useMemo(() => {
    const byStatus = filterBillsByStatus(bills, activeStatusFilter);
    return filterBillsByTag(byStatus, activeTagId);
  }, [bills, activeStatusFilter, activeTagId]);

  const statusFilters: {
    key: StatusFilterType;
    label: string;
    count: number;
  }[] = [
    { key: "all", label: "ALL", count: statusCounts.all },
    { key: "approved", label: "可決", count: statusCounts.approved },
    { key: "rejected", label: "否決", count: statusCounts.rejected },
    { key: "other", label: "その他", count: statusCounts.other },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* ステータスフィルターボタン */}
      <div className="flex flex-wrap gap-3">
        {statusFilters.map((filter) => (
          <Button
            key={filter.key}
            variant="ghost"
            onClick={() => setActiveStatusFilter(filter.key)}
            className={`h-[29px] px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
              activeStatusFilter === filter.key
                ? "bg-mirai-gradient text-black hover:bg-mirai-gradient"
                : "bg-mirai-surface-grouped text-mirai-text-muted hover:bg-mirai-surface-muted"
            }`}
          >
            {filter.label} {filter.count}
          </Button>
        ))}
      </div>

      {/* タグフィルターボタン */}
      {uniqueTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={() => setActiveTagId(null)}
            className={`h-[29px] px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
              activeTagId === null
                ? "bg-mirai-gradient text-black hover:bg-mirai-gradient"
                : "bg-mirai-surface-grouped text-mirai-text-muted hover:bg-mirai-surface-muted"
            }`}
          >
            すべてのタグ
          </Button>
          {uniqueTags.map((tag) => (
            <Button
              key={tag.id}
              variant="ghost"
              onClick={() => setActiveTagId(tag.id)}
              className={`h-[29px] px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                activeTagId === tag.id
                  ? "bg-mirai-gradient text-black hover:bg-mirai-gradient"
                  : "bg-mirai-surface-grouped text-mirai-text-muted hover:bg-mirai-surface-muted"
              }`}
            >
              {tag.label}
            </Button>
          ))}
        </div>
      )}

      {/* 議案リスト */}
      {filteredBills.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">
          該当する議案がありません
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredBills.map((bill) => (
            <Link key={bill.id} href={`/bills/${bill.id}`}>
              <CompactBillCard bill={bill} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
