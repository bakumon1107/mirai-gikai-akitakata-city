"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

const REVIEW_STATUSES = [
  { value: "preparing", label: "準備中" },
  { value: "submitted", label: "上程済み" },
  { value: "in_committee", label: "委員会審査中" },
  { value: "plenary_session", label: "本会議採決中" },
  { value: "approved", label: "可決" },
  { value: "rejected", label: "否決" },
  { value: "reported", label: "専決処分報告" },
] as const;

type ReviewStatusFilterProps = {
  currentReviewStatus?: string;
};

export function ReviewStatusFilter({
  currentReviewStatus,
}: ReviewStatusFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSelect(status: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set("reviewStatus", status);
    } else {
      params.delete("reviewStatus");
    }
    router.push(`${pathname}?${params.toString()}` as Route);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-500 shrink-0">審議:</span>
      <Button
        variant={!currentReviewStatus ? "default" : "outline"}
        size="sm"
        onClick={() => handleSelect(null)}
      >
        すべて
      </Button>
      {REVIEW_STATUSES.map((s) => (
        <Button
          key={s.value}
          variant={currentReviewStatus === s.value ? "default" : "outline"}
          size="sm"
          onClick={() => handleSelect(s.value)}
        >
          {s.label}
        </Button>
      ))}
    </div>
  );
}
