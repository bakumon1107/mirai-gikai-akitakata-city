import { GitMerge, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BillActionsMenu } from "../../../client/components/bill-actions-menu/bill-actions-menu";
import { PreviewButton } from "../../../client/components/bill-list/preview-button";
import { PublishStatusBadge } from "../../../client/components/bill-list/publish-status-badge";
import { SessionFilter } from "../../../client/components/bill-list/session-filter";
import { SortableTableHead } from "../../../client/components/bill-list/sortable-table-head";
import { ViewButton } from "../../../client/components/bill-list/view-button";
import { BILL_STATUS_CONFIG } from "../../../shared/constants/bill-config";
import type {
  BillSortConfig,
  BillStatus,
  BillWithCouncilSession,
} from "../../../shared/types";
import { getBillStatusLabel } from "../../../shared/types";
import { getBills } from "../../loaders/get-bills";
import { getCouncilSessions } from "../../loaders/get-council-sessions";

function StatusBadge({ status }: { status: BillStatus }) {
  const config = BILL_STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div className="inline-flex items-center gap-1.5 py-1 rounded-full text-sm font-bold">
      <Icon className="h-4 w-4" />
      <span>{getBillStatusLabel(status)}</span>
    </div>
  );
}

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

      <div className="mb-3">
        <SessionFilter sessions={sessions} currentSessionId={sessionId} />
      </div>

      <div className="rounded-md border bg-white overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <SortableTableHead
                field="bill_number"
                currentField={sortConfig.field}
                currentOrder={sortConfig.order}
              >
                議案番号
              </SortableTableHead>
              <SortableTableHead
                field="name"
                currentField={sortConfig.field}
                currentOrder={sortConfig.order}
              >
                議案名
              </SortableTableHead>
              <TableHead>定例会</TableHead>
              <SortableTableHead
                field="publish_status_order"
                currentField={sortConfig.field}
                currentOrder={sortConfig.order}
              >
                公開ステータス
              </SortableTableHead>
              <SortableTableHead
                field="status_order"
                currentField={sortConfig.field}
                currentOrder={sortConfig.order}
              >
                審議ステータス
              </SortableTableHead>
              <SortableTableHead
                field="published_at"
                currentField={sortConfig.field}
                currentOrder={sortConfig.order}
              >
                公開日
              </SortableTableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.map((bill) => (
              <BillRow key={bill.id} bill={bill} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function BillRow({ bill }: { bill: BillWithCouncilSession }) {
  return (
    <TableRow>
      <TableCell className="text-sm text-gray-600 whitespace-nowrap">
        {bill.bill_number || "-"}
      </TableCell>
      <TableCell className="min-w-[200px]">
        <Link
          href={`/bills/${bill.id}/edit`}
          className="block font-medium hover:underline"
        >
          {bill.name}
        </Link>
      </TableCell>
      <TableCell className="text-gray-600">
        {bill.council_sessions?.name ?? "-"}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <PublishStatusBadge
            billId={bill.id}
            publishStatus={bill.publish_status}
          />
          {(bill.publish_status === "draft" ||
            bill.publish_status === "coming_soon") && (
            <PreviewButton billId={bill.id} />
          )}
          {bill.publish_status === "published" && (
            <ViewButton billId={bill.id} />
          )}
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge status={bill.status} />
      </TableCell>
      <TableCell className="text-gray-600">
        {bill.published_at
          ? new Date(bill.published_at).toLocaleDateString("ja-JP")
          : "-"}
      </TableCell>
      <TableCell>
        <BillActionsMenu billId={bill.id} billName={bill.name} />
      </TableCell>
    </TableRow>
  );
}
