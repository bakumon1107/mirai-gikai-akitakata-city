import type { CouncilSession } from "../../shared/types";
import { CouncilSessionItem } from "./council-session-item";

type CouncilSessionListProps = {
  sessions: CouncilSession[];
};

export function CouncilSessionList({ sessions }: CouncilSessionListProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        定例会一覧 ({sessions.length}件)
      </h2>

      {sessions.length === 0 ? (
        <p className="text-gray-500">定例会がありません</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <CouncilSessionItem key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}
