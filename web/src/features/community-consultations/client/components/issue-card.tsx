"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IssueCard } from "../../shared/types";

interface IssueCardProps {
  card: IssueCard;
  onClickTag?: (tag: string) => void;
}

export function IssueCardComponent({ card, onClickTag }: IssueCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-mirai-border p-5 flex flex-col gap-3">
      <h3 className="text-base font-bold leading-snug text-mirai-text">
        {card.title}
      </h3>
      <p className="text-sm leading-relaxed text-mirai-text-secondary flex-1">
        {card.body}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {card.tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onClickTag?.(tag)}
            className="text-xs bg-mirai-surface px-2 py-0.5 rounded-full text-mirai-text-muted hover:bg-mirai-surface-muted transition-colors"
          >
            {tag}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onClickTag?.(card.tags[0])}
        className="flex items-center gap-1 text-xs font-medium text-primary-accent hover:opacity-80 transition-opacity w-fit"
      >
        関連する意見 {card.opinionCount}件を読む
        <ArrowRight className="size-3" />
      </button>
    </div>
  );
}
