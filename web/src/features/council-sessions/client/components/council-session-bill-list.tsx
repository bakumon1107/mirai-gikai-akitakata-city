import type { BillWithContent } from "@/features/bills/shared/types";
import { formatDateWithDots } from "@/lib/utils/date";
import type { CouncilSession } from "../../shared/types";
import { BillListWithStatusFilter } from "./bill-list-with-status-filter";

type Props = {
  session: CouncilSession;
  bills: BillWithContent[];
};

export function CouncilSessionBillList({ session, bills }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {/* ヘッダー */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{session.name}に上程された議案</h1>
        <p className="text-muted-foreground text-sm">
          {formatDateWithDots(session.start_date)} 〜{" "}
          {session.end_date ? formatDateWithDots(session.end_date) : "未定"}
        </p>
      </div>

      {/* フィルター付き議案リスト */}
      {bills.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">
          この定例会の議案はまだありません
        </p>
      ) : (
        <BillListWithStatusFilter bills={bills} />
      )}

      {/* 市議会リンク */}
      {session.council_url && (
        <div className="text-right text-sm pt-4">
          {session.name}に上程された全ての議案は{" "}
          <a
            href={session.council_url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline inline-flex items-center gap-1"
          >
            川崎市議会情報へ
            <span className="text-xs">↗</span>
          </a>
        </div>
      )}
    </div>
  );
}
