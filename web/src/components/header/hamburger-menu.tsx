"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { CouncilSession } from "@/features/council-sessions/shared/types";
import { RubyToggle } from "@/lib/rubyful";

interface HamburgerMenuProps {
  sessions: CouncilSession[];
}

export function HamburgerMenu({ sessions }: HamburgerMenuProps) {
  const sessionsWithSlug = sessions.filter((s) => s.slug);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          aria-label="メニューを開く"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <div className="flex flex-col gap-3">
          <RubyToggle />
          {sessionsWithSlug.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">
                議案一覧
              </p>
              <ul className="flex flex-col gap-1">
                {sessionsWithSlug.map((session) => (
                  <li key={session.id}>
                    <Link
                      href={`/sessions/${session.slug}/bills`}
                      className="block text-sm py-1 hover:underline"
                    >
                      {session.name}の議案一覧
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
