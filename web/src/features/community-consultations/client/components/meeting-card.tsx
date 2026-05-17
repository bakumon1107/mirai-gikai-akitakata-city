import { MapPin, Users } from "lucide-react";
import type { ConsultationMeeting } from "../../shared/types";

interface MeetingCardProps {
  meeting: ConsultationMeeting;
}

export function MeetingCardComponent({ meeting }: MeetingCardProps) {
  const dateLabel = meeting.heldAt
    ? new Date(meeting.heldAt).toLocaleDateString("ja-JP", {
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="bg-white rounded-2xl border border-mirai-border p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <MapPin className="size-3.5 text-primary-accent shrink-0 mt-0.5" />
          <span className="font-bold text-sm text-mirai-text">
            {meeting.locationName}
          </span>
        </div>
        {meeting.participantCount != null && (
          <div className="flex items-center gap-1 text-xs text-mirai-text-muted shrink-0">
            <Users className="size-3" />
            {meeting.participantCount}人
          </div>
        )}
      </div>
      <div>
        {dateLabel && (
          <span className="text-xs bg-mirai-surface-grouped px-2 py-0.5 rounded-full text-mirai-text-muted">
            {dateLabel}
          </span>
        )}
        {meeting.theme && (
          <span className="ml-2 text-xs text-mirai-text-secondary">
            {meeting.theme}
          </span>
        )}
      </div>
      {meeting.aiRepresentativeQuote && (
        <blockquote className="border-l-2 border-primary pl-2.5 mt-1">
          <p className="text-xs leading-relaxed text-mirai-text-secondary italic">
            "{meeting.aiRepresentativeQuote}"
          </p>
        </blockquote>
      )}
    </div>
  );
}
