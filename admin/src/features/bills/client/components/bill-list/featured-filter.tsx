"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

const FEATURED_OPTIONS = [
  { value: "true", label: "注目" },
  { value: "false", label: "通常" },
] as const;

type FeaturedFilterProps = {
  currentIsFeatured?: string;
};

export function FeaturedFilter({ currentIsFeatured }: FeaturedFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSelect(value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("isFeatured", value);
    } else {
      params.delete("isFeatured");
    }
    router.push(`${pathname}?${params.toString()}` as Route);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-500 shrink-0">注目:</span>
      <Button
        variant={!currentIsFeatured ? "default" : "outline"}
        size="sm"
        onClick={() => handleSelect(null)}
      >
        すべて
      </Button>
      {FEATURED_OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          variant={currentIsFeatured === opt.value ? "default" : "outline"}
          size="sm"
          onClick={() => handleSelect(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
