"use client";

import { ArrowRight, CalendarDays, Megaphone } from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/routes";
import type { PressConference } from "../../shared/types";

type Props = {
  pressConference: PressConference;
};

export function PressConferenceNoticeBanner({ pressConference }: Props) {
  const announcements = pressConference.items.filter(
    (item) => item.itemType === "announcement"
  );
  const formattedDate = new Date(pressConference.heldAt).toLocaleDateString(
    "ja-JP",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <Link
      href={routes.pressConferenceDetail(pressConference.slug)}
      className="group block rounded-2xl overflow-hidden border border-mirai-border hover:border-primary/50 hover:shadow-md transition-all duration-200"
    >
      <div className="bg-gradient-to-r from-mirai-gradient-start to-mirai-gradient-end px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary-accent font-bold text-sm">
          <Megaphone className="w-4 h-4" />
          市長記者会見 最新情報
        </div>
        <div className="flex items-center gap-1.5 text-xs text-primary-accent">
          <CalendarDays className="w-3.5 h-3.5" />
          {formattedDate}
        </div>
      </div>

      <div className="bg-white px-5 py-4 flex flex-col gap-3">
        {announcements.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {announcements.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-2 text-sm text-mirai-text"
              >
                <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
                {item.title}
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end pt-1 border-t border-mirai-border">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-accent group-hover:gap-2 transition-all">
            会見の詳細を読む
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
