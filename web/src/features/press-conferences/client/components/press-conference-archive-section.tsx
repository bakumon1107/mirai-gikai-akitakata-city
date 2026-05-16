"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import type { PressConference } from "../../shared/types";

type Props = {
  pressConferences: PressConference[];
};

export function PressConferenceArchiveSection({ pressConferences }: Props) {
  if (pressConferences.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-[22px] font-bold text-black leading-[1.48]">
          市長記者会見
        </h2>
        <p className="text-xs text-mirai-text-secondary">
          藤本市長が記者の皆さんと直接やりとりした内容をわかりやすくお届けします
        </p>
      </div>

      <ul className="flex flex-col divide-y divide-mirai-border">
        {pressConferences.map((pc) => {
          const formattedDate = new Date(pc.heldAt).toLocaleDateString(
            "ja-JP",
            { year: "numeric", month: "long", day: "numeric" }
          );
          return (
            <li key={pc.id}>
              <Link
                href={routes.pressConferenceDetail(pc.slug)}
                className="flex items-center justify-between py-4 px-2 hover:bg-mirai-surface-grouped rounded-lg transition-colors group"
              >
                <span className="font-bold text-mirai-text text-base">
                  {formattedDate} 定例記者会見
                </span>
                <ChevronRight className="h-5 w-5 text-mirai-text-muted group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="flex justify-center">
        <Button variant="outline" size="lg" asChild className="rounded-full">
          <Link href={routes.pressConferences()}>市長記者会見を一覧で表示</Link>
        </Button>
      </div>
    </div>
  );
}
