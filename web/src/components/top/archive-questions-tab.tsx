import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { CouncilSession } from "@/features/council-sessions/shared/types";
import { routes } from "@/lib/routes";

interface ArchiveQuestionsTabProps {
  sessions: CouncilSession[];
}

const MAX_VISIBLE = 5;

export function ArchiveQuestionsTab({ sessions }: ArchiveQuestionsTabProps) {
  const visible = sessions.slice(0, MAX_VISIBLE);

  if (visible.length === 0) {
    return (
      <p className="text-mirai-text-muted text-sm py-4">
        一般質問の記録はまだ掲載されていません。
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-mirai-border">
      {visible.map((session) => {
        if (!session.slug) return null;
        return (
          <li key={session.id}>
            <Link
              href={routes.sessionQuestions(session.slug)}
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
  );
}
