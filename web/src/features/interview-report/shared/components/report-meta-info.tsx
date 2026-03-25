import { formatDateTime } from "../utils/report-utils";
import { RoleDisplay } from "./role-display";
import { StanceDisplay } from "./stance-display";

interface ReportMetaInfoProps {
  stance?: string | null;
  role?: string | null;
  roleTitle?: string | null;
  sessionStartedAt: string | null;
  characterCount: number;
}

export function ReportMetaInfo({
  stance,
  role,
  roleTitle,
  sessionStartedAt,
  characterCount,
}: ReportMetaInfoProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-3">
        {/* スタンス */}
        {stance && <StanceDisplay stance={stance} />}
        {/* 役割 */}
        {(role || roleTitle) && (
          <RoleDisplay role={role} roleTitle={roleTitle} />
        )}
      </div>

      {/* 日時・時間・文字数 */}
      <div className="text-black text-center">
        <p className="text-base font-medium mb-2">
          {formatDateTime(sessionStartedAt)}
        </p>
        <p className="text-xs font-normal">
          インタビューの分量
          <span className="underline ml-2">{characterCount}文字</span>
        </p>
      </div>
    </div>
  );
}
