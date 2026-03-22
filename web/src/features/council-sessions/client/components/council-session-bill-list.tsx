import { ExternalLink } from "lucide-react";
import Image from "next/image";
import type {
  BillWithContent,
  ComingSoonBill,
} from "@/features/bills/shared/types";
import { Card, CardContent } from "@/components/ui/card";
import type { CouncilSession } from "../../shared/types";
import { BillListWithStatusFilter } from "./bill-list-with-status-filter";

type Props = {
  session: CouncilSession;
  bills: BillWithContent[];
  comingSoonBills?: ComingSoonBill[];
};

export function CouncilSessionBillList({
  session,
  bills,
  comingSoonBills = [],
}: Props) {
  const startDate = new Date(session.start_date);
  const endDate = new Date(session.end_date ?? session.start_date);
  const sessionDescription = `${startDate.getFullYear()}.${startDate.getMonth() + 1}月〜${endDate.getMonth() + 1}月に実施された${session.name}`;

  return (
    <div className="flex flex-col gap-8">
      {/* Archiveヘッダー */}
      <div className="flex flex-col gap-1">
        <h1>
          <Image
            src="/icons/archive-typography.svg"
            alt="Archive"
            width={156}
            height={36}
            priority
          />
        </h1>
        <p className="text-sm font-bold text-primary-accent">
          {session.name}に上程された議案
        </p>
      </div>

      {/* セクションヘッダー */}
      <div className="flex flex-col gap-0.5">
        <h2 className="text-[22px] font-bold text-black leading-[1.48] flex items-center gap-4">
          {startDate.getFullYear()}年 {session.name}の提出議案
          <span>{bills.length}件</span>
        </h2>
        <p className="text-xs font-medium text-mirai-text">
          {sessionDescription}
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

      {/* これから掲載される議案 */}
      {comingSoonBills.length > 0 && (
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-[22px] font-bold text-black leading-[1.48]">
              これから掲載される議案
            </h2>
            <p className="text-xs text-mirai-text-secondary">
              順次掲載されていきます
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {comingSoonBills.map((bill) => (
              <Card key={bill.id} className="border border-black">
                <CardContent className="flex items-center justify-between py-4 px-5">
                  <div className="flex flex-col gap-1 min-w-0">
                    <h3 className="font-bold text-base text-black leading-tight">
                      {bill.title || bill.name}
                    </h3>
                    {bill.title && bill.title !== bill.name && (
                      <p className="text-xs text-mirai-text-subtle">
                        {bill.name}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* 市議会リンク */}
      {session.council_url && (
        <div className="flex items-center gap-1 text-[13px] font-medium text-mirai-text">
          {startDate.getFullYear()}年{session.name}に上程された全ての議案は
          <a
            href={session.council_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1"
          >
            川崎市議会情報へ
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}
