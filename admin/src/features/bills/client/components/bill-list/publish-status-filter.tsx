"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

const PUBLISH_STATUSES = [
  { value: "draft", label: "下書き" },
  { value: "coming_soon", label: "Coming Soon" },
  { value: "published", label: "公開中" },
] as const;

type PublishStatusFilterProps = {
  currentPublishStatus?: string;
};

export function PublishStatusFilter({
  currentPublishStatus,
}: PublishStatusFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSelect(status: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set("publishStatus", status);
    } else {
      params.delete("publishStatus");
    }
    router.push(`${pathname}?${params.toString()}` as Route);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-500 shrink-0">公開:</span>
      <Button
        variant={!currentPublishStatus ? "default" : "outline"}
        size="sm"
        onClick={() => handleSelect(null)}
      >
        すべて
      </Button>
      {PUBLISH_STATUSES.map((s) => (
        <Button
          key={s.value}
          variant={currentPublishStatus === s.value ? "default" : "outline"}
          size="sm"
          onClick={() => handleSelect(s.value)}
        >
          {s.label}
        </Button>
      ))}
    </div>
  );
}
