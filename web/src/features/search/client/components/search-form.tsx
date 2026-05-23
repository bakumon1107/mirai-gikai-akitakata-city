"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const SUGGESTED_KEYWORDS = ["農業", "防災", "道路", "子育て", "予算", "移住"];

export function SearchForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") ?? "";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q") as string;
    const trimmed = q.trim();
    router.push(
      trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search"
    );
  }

  return (
    <div>
      <form key={query} onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-mirai-text-muted" />
        <Input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="キーワードを入力..."
          className="pl-9 h-11 text-base bg-white border-mirai-border"
          autoFocus
        />
      </form>
      {!query && (
        <div className="flex flex-wrap gap-2 mt-3">
          {SUGGESTED_KEYWORDS.map((kw) => (
            <button
              key={kw}
              type="button"
              onClick={() => router.push(`/search?q=${encodeURIComponent(kw)}`)}
              className="px-3 py-1 text-xs border border-mirai-border rounded-full text-mirai-text-secondary hover:bg-mirai-surface transition-colors"
            >
              {kw}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
