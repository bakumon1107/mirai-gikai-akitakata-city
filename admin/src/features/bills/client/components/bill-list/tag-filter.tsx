"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

type Tag = {
  id: string;
  label: string;
};

type TagFilterProps = {
  tags: Tag[];
  currentTagId?: string;
};

export function TagFilter({ tags, currentTagId }: TagFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSelect(tagId: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (tagId) {
      params.set("tag", tagId);
    } else {
      params.delete("tag");
    }
    router.push(`${pathname}?${params.toString()}` as Route);
  }

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-500 shrink-0">タグ:</span>
      <Button
        variant={!currentTagId ? "default" : "outline"}
        size="sm"
        onClick={() => handleSelect(null)}
      >
        すべて
      </Button>
      {tags.map((tag) => (
        <Button
          key={tag.id}
          variant={currentTagId === tag.id ? "default" : "outline"}
          size="sm"
          onClick={() => handleSelect(tag.id)}
        >
          {tag.label}
        </Button>
      ))}
    </div>
  );
}
