import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { BillsByTag } from "../../shared/types";
import { BillCard } from "../../client/components/bill-list/bill-card";

const MAX_DISPLAY_COUNT = 3;

interface BillsByTagSectionProps {
  billsByTag: BillsByTag[];
  sessionSlug?: string | null;
}

export function BillsByTagSection({
  billsByTag,
  sessionSlug,
}: BillsByTagSectionProps) {
  if (billsByTag.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-12">
      {billsByTag.map(({ tag, bills }) => {
        const hasMore = bills.length > MAX_DISPLAY_COUNT;
        const displayBills = hasMore
          ? bills.slice(0, MAX_DISPLAY_COUNT)
          : bills;

        return (
          <section key={tag.id} className="flex flex-col gap-6">
            {/* タグヘッダー */}
            <div className="flex flex-col gap-1.5">
              <h2 className="text-[22px] font-bold text-black leading-[1.48]">
                {tag.label}
              </h2>
              {tag.description && (
                <p className="text-xs text-mirai-text-secondary">
                  {tag.description}
                </p>
              )}
            </div>

            {/* 議案カード一覧 */}
            <div className="flex flex-col gap-4">
              {displayBills.map((bill) => (
                <Link key={bill.id} href={`/bills/${bill.id}`}>
                  <BillCard bill={bill} />
                </Link>
              ))}
            </div>

            {/* もっと見るリンク */}
            {hasMore && sessionSlug && (
              <Link
                href={`/sessions/${sessionSlug}/bills?tag=${tag.id}`}
                className="flex items-center justify-center gap-1 text-sm font-bold text-primary-accent hover:opacity-70 transition-opacity"
              >
                その他の{tag.label}議案はこちら
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </section>
        );
      })}
    </div>
  );
}
