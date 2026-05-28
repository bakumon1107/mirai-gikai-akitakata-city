"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { CouncilSession } from "@/features/council-sessions/shared/types";
import { routes } from "@/lib/routes";
import { RubyToggle } from "@/lib/rubyful";
import { TextSizeToggle } from "@/lib/text-size";

const NAV_LINKS = [
  { label: "定例会一覧", href: routes.sessions() },
  { label: "一般質問一覧", href: routes.questions() },
  { label: "地域懇談会一覧", href: routes.communityConsultationLatest() },
  { label: "記者会見一覧", href: routes.pressConferences() },
] as const;

interface HamburgerMenuProps {
  sessions: CouncilSession[];
}

export function HamburgerMenu({ sessions: _ }: HamburgerMenuProps) {
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
      <PopoverContent className="w-52" align="end">
        <div className="flex flex-col gap-3">
          <nav>
            <ul className="flex flex-col">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="block text-sm py-2 px-1 text-mirai-text hover:text-primary-accent transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="border-t border-mirai-border pt-3 flex flex-col gap-3">
            <RubyToggle />
            <TextSizeToggle />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
