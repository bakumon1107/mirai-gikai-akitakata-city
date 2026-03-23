import { ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { routes } from "@/lib/routes";
import type { BillWithContent, BillsByTag } from "../../shared/types";
import { BillCard } from "../../client/components/bill-list/bill-card";

const MAX_DISPLAY_COUNT = 3;

interface BillsByTagSectionProps {
  billsByTag: BillsByTag[];
  sessionSlug?: string | null;
}

function pickRandom(
  bills: BillWithContent[],
  count: number
): BillWithContent[] {
  const shuffled = [...bills].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
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
          ? pickRandom(bills, MAX_DISPLAY_COUNT)
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
                <Link key={bill.id} href={routes.billDetail(bill.id) as Route}>
                  <BillCard bill={bill} />
                </Link>
              ))}
            </div>

            {/* もっと見るカード */}
            {hasMore && sessionSlug && (
              <Link
                href={`/sessions/${sessionSlug}/bills?tag=${tag.id}` as Route}
                className="block"
              >
                <Card className="border border-black hover:bg-gray-50 transition-colors cursor-pointer">
                  <CardContent className="flex items-center justify-between py-4 px-5">
                    <span className="font-bold text-base text-black">
                      その他の{tag.label}議案はこちら
                    </span>
                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            )}
          </section>
        );
      })}
    </div>
  );
}
