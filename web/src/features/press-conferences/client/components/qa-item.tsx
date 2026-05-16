"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { PressConferenceItem } from "../../shared/types";
import { TurnBubble } from "./turn-bubble";

type Props = {
  item: PressConferenceItem;
  defaultOpen?: boolean;
};

export function QaItem({ item, defaultOpen = false }: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={`rounded-2xl overflow-hidden transition-shadow ${
        isOpen
          ? "shadow-md border border-primary/30"
          : "border border-mirai-border bg-white hover:border-primary/40 hover:shadow-sm"
      }`}
    >
      <Button
        variant="ghost"
        onClick={() => setIsOpen((v) => !v)}
        className={`w-full h-auto flex items-center gap-3 px-4 py-3.5 text-left justify-start rounded-none transition-colors ${
          isOpen ? "bg-mirai-gradient-end" : "bg-white hover:bg-mirai-surface"
        }`}
      >
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary-accent text-xs font-bold flex items-center justify-center">
          Q
        </span>
        <span className="flex-1 text-sm font-medium text-mirai-text">
          {item.title}
        </span>
        <ChevronDown
          className={`flex-shrink-0 w-4 h-4 text-primary-accent transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </Button>
      {isOpen && (
        <div className="px-4 pb-5 bg-white border-t border-primary/20">
          <div className="pt-4 flex flex-col gap-4">
            {item.turns.map((turn) => (
              <TurnBubble key={turn.id} turn={turn} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
