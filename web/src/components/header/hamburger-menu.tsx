"use client";

import Link from "next/link";
import { ExternalLink, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { CouncilSession } from "@/features/council-sessions/shared/types";
import { routes } from "@/lib/routes";
import { RubyToggle } from "@/lib/rubyful";

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
          <div className="border-t border-mirai-border pt-3">
            <RubyToggle />
          </div>
          <div className="border-t border-mirai-border pt-3">
            <a
              href="https://inshatancountry-jpn-tax-map.com/local-tax/?pref=34&entity=342149"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-1 py-1 text-sm text-mirai-text-secondary hover:text-primary-accent transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              税金の使い道マップ（外部サイト）
            </a>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
