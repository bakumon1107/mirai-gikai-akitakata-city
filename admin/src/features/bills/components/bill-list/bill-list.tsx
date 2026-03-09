import { GitMerge, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getBills } from "../../loaders/get-bills";
import { BillCard } from "./bill-card";

export async function BillList() {
  const bills = await getBills();

  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="text-sm text-gray-600">{bills.length}件の議案</div>
        <div className="flex items-center gap-2">
          <Link href="/bills/merge">
            <Button variant="outline">
              <GitMerge className="h-4 w-4 mr-1" />
              重複統合
            </Button>
          </Link>
          <Link href="/bills/new">
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              新規作成
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {bills.map((bill) => (
          <BillCard key={bill.id} bill={bill} />
        ))}
      </div>
    </div>
  );
}
