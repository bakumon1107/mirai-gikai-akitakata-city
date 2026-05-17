import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { CouncilSession } from "@/features/council-sessions/shared/types";
import { routes } from "@/lib/routes";

interface ArchiveBillsTabProps {
  sessions: CouncilSession[];
}

const MAX_VISIBLE = 5;

export function ArchiveBillsTab({ sessions }: ArchiveBillsTabProps) {
  const visible = sessions.slice(0, MAX_VISIBLE);

  return (
    <div className="flex flex-col gap-4">
      {visible.length === 0 ? (
        <p className="text-mirai-text-muted text-sm py-4">
          過去の定例会はまだ掲載されていません。
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-mirai-border">
          {visible.map((session) => {
            if (!session.slug) return null;
            return (
              <li key={session.id}>
                <Link
                  href={routes.sessionBills(session.slug)}
                  className="flex items-center justify-between py-4 px-2 hover:bg-mirai-surface-muted rounded-lg transition-colors group"
                >
                  <span className="font-bold text-mirai-text text-base">
                    {session.name}
                  </span>
                  <ChevronRight className="h-5 w-5 text-mirai-text-muted group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex justify-center">
        <Button variant="outline" size="lg" asChild className="rounded-full">
          <Link href={routes.sessions()}>過去の議会を一覧で表示</Link>
        </Button>
      </div>
    </div>
  );
}
