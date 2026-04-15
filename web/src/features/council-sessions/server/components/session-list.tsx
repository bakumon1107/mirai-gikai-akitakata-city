import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { CouncilSession } from "../../shared/types";
import {
  formatSessionPeriod,
  groupSessionsByYear,
} from "../../shared/utils/group-sessions-by-year";
import { routes } from "@/lib/routes";

interface SessionListProps {
  sessions: CouncilSession[];
}

export function SessionList({ sessions }: SessionListProps) {
  const grouped = groupSessionsByYear(sessions);

  if (grouped.length === 0) {
    return (
      <p className="text-mirai-text-secondary text-sm">
        表示できる議会はありません。
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {grouped.map(({ year, sessions: yearSessions }) => (
        <section key={year}>
          <h2 className="text-lg font-bold text-mirai-text mb-3 pb-2 border-b border-mirai-border">
            {year}年
          </h2>
          <ul className="flex flex-col divide-y divide-mirai-border">
            {yearSessions.map((session) => {
              if (!session.slug) return null;
              const period = formatSessionPeriod(session);
              return (
                <li key={session.id}>
                  <Link
                    href={routes.sessionBills(session.slug)}
                    className="flex items-center justify-between py-4 px-2 hover:bg-mirai-surface-grouped rounded-lg transition-colors group"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-mirai-text text-base">
                        {session.name}
                      </span>
                      <span className="text-xs text-mirai-text-secondary">
                        {period}
                      </span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-mirai-text-muted group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
