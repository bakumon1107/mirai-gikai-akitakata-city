import { ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { routes } from "@/lib/routes";
import type { BillsByTag } from "../../shared/types";
import { selectBillsForDisplay } from "../../shared/utils/select-bills-for-display";
import { BillCard } from "../../client/components/bill-list/bill-card";

interface BillsByTagSectionProps {
  billsByTag: BillsByTag[];
  featuredBillIds: Set<string>;
  sessionSlug?: string | null;
}

export function BillsByTagSection({
  billsByTag,
  featuredBillIds,
  sessionSlug,
}: BillsByTagSectionProps) {
  if (billsByTag.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-12">
      {billsByTag.map(({ tag, bills }) => {
        const { displayBills, showMoreLink } = selectBillsForDisplay(
          bills,
          featuredBillIds
        );

        if (displayBills.length === 0) {
          return null;
        }

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
            {showMoreLink && sessionSlug && (
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
