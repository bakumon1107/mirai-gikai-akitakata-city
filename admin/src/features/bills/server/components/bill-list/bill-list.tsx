import { GitMerge, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ResizableBillTable } from "../../../client/components/bill-list/resizable-bill-table";
import type { BillSortConfig } from "../../../shared/types";
import { getBills } from "../../loaders/get-bills";
import { getCouncilSessions } from "../../loaders/get-council-sessions";

export async function BillList({
  sortConfig,
  sessionId,
}: {
  sortConfig: BillSortConfig;
  sessionId?: string;
}) {
  const [bills, sessions] = await Promise.all([
    getBills(sortConfig, sessionId),
    getCouncilSessions(),
  ]);

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

      <ResizableBillTable
        bills={bills}
        sessions={sessions}
        sortConfig={sortConfig}
        sessionId={sessionId}
      />
    </div>
  );
}
