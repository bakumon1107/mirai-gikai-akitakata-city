"use client";

import { Menu } from "lucide-react";
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
      <PopoverContent className="w-50" align="end">
        <RubyToggle />
      </PopoverContent>
    </Popover>
  );
}
