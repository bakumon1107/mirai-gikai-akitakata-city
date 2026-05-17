import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { CommunityConsultationListItem } from "@/features/community-consultations/shared/types";
import { routes } from "@/lib/routes";

interface ArchiveConsultationsTabProps {
  consultations: CommunityConsultationListItem[];
}

export function ArchiveConsultationsTab({
  consultations,
}: ArchiveConsultationsTabProps) {
  if (consultations.length === 0) {
    return (
      <p className="text-mirai-text-muted text-sm py-4">
        地域懇談会の記録はまだ掲載されていません。
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-mirai-border">
      {consultations.map((c) => (
        <li key={c.id}>
          <Link
            href={routes.communityConsultationDetail(c.fiscalYear)}
            className="flex items-start justify-between py-4 px-2 hover:bg-mirai-surface-muted rounded-lg transition-colors group gap-4"
          >
            <div className="flex flex-col gap-1 min-w-0">
              <span className="font-bold text-mirai-text text-base">
                {c.fiscalYearLabel}
              </span>
              {c.aiYearSummary && (
                <span className="text-sm text-mirai-text-secondary line-clamp-2">
                  {c.aiYearSummary}
                </span>
              )}
              <div className="flex flex-wrap gap-3 text-xs text-mirai-text-muted mt-0.5">
                {c.meetingCount > 0 && <span>{c.meetingCount}会場</span>}
                {c.totalParticipants != null && (
                  <span>{c.totalParticipants}人</span>
                )}
                {c.totalOpinions != null && (
                  <span>{c.totalOpinions}件以上</span>
                )}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-mirai-text-muted group-hover:translate-x-0.5 transition-transform flex-shrink-0 mt-1" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
