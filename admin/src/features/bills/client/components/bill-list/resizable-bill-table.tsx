"use client";

import type { Route } from "next";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { routes } from "@/lib/routes";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { BillActionsMenu } from "../bill-actions-menu/bill-actions-menu";
import { PreviewButton } from "./preview-button";
import { PublishStatusBadge } from "./publish-status-badge";
import { FeaturedFilter } from "./featured-filter";
import { PublishStatusFilter } from "./publish-status-filter";
import { ReviewStatusFilter } from "./review-status-filter";
import { SessionFilter } from "./session-filter";
import { TagFilter } from "./tag-filter";
import { ViewButton } from "./view-button";
import { BILL_STATUS_CONFIG } from "../../../shared/constants/bill-config";
import type {
  BillSortConfig,
  BillSortField,
  BillStatus,
  BillWithCouncilSession,
} from "../../../shared/types";
import { getBillStatusLabel } from "../../../shared/types";

type Session = { id: string; name: string };
type Tag = { id: string; label: string };

type ColumnConfig = {
  key: string;
  defaultWidth: number;
  minWidth: number;
  resizable: boolean;
};

const COLUMNS: ColumnConfig[] = [
  { key: "bill_number", defaultWidth: 120, minWidth: 80, resizable: true },
  { key: "name", defaultWidth: 280, minWidth: 150, resizable: true },
  { key: "council_session", defaultWidth: 150, minWidth: 100, resizable: true },
  {
    key: "publish_status",
    defaultWidth: 200,
    minWidth: 130,
    resizable: true,
  },
  { key: "status", defaultWidth: 160, minWidth: 100, resizable: true },
  { key: "published_at", defaultWidth: 100, minWidth: 80, resizable: true },
  { key: "actions", defaultWidth: 50, minWidth: 50, resizable: false },
];

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

type SortableHeadButtonProps = {
  field: BillSortField;
  sortConfig: BillSortConfig;
  children: React.ReactNode;
};

function SortableHeadButton({
  field,
  sortConfig,
  children,
}: SortableHeadButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isActive = field === sortConfig.field;
  const SortIcon = isActive
    ? sortConfig.order === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  function handleClick() {
    const params = new URLSearchParams(searchParams.toString());
    if (isActive) {
      params.set("order", sortConfig.order === "asc" ? "desc" : "asc");
    } else {
      params.set("sort", field);
      params.set("order", "desc");
    }
    router.push(`${pathname}?${params.toString()}` as Route);
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className="h-auto p-0 font-medium hover:bg-transparent"
    >
      {children}
      <SortIcon className="ml-1 h-4 w-4" />
    </Button>
  );
}

export function ResizableBillTable({
  bills,
  sessions,
  tags,
  sortConfig,
  sessionId,
  tagId,
  publishStatus,
  reviewStatus,
  isFeatured,
}: {
  bills: BillWithCouncilSession[];
  sessions: Session[];
  tags: Tag[];
  sortConfig: BillSortConfig;
  sessionId?: string;
  tagId?: string;
  publishStatus?: string;
  reviewStatus?: string;
  isFeatured?: string;
}) {
  const [widths, setWidths] = useState(() =>
    COLUMNS.map((c) => c.defaultWidth)
  );
  const totalWidth = widths.reduce((a, b) => a + b, 0);

  const startResize = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, colIndex: number) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = widths[colIndex];
      const minWidth = COLUMNS[colIndex].minWidth;

      const onMove = (ev: PointerEvent) => {
        const newWidth = Math.max(minWidth, startWidth + ev.clientX - startX);
        setWidths((prev) => {
          const next = [...prev];
          next[colIndex] = newWidth;
          return next;
        });
      };

      const onUp = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [widths]
  );

  return (
    <div>
      <div className="mb-3 space-y-2">
        <SessionFilter sessions={sessions} currentSessionId={sessionId} />
        <TagFilter tags={tags} currentTagId={tagId} />
        <PublishStatusFilter currentPublishStatus={publishStatus} />
        <ReviewStatusFilter currentReviewStatus={reviewStatus} />
        <FeaturedFilter currentIsFeatured={isFeatured} />
      </div>

      <div className="rounded-md border bg-white overflow-x-auto">
        <table style={{ tableLayout: "fixed", width: totalWidth }}>
          <colgroup>
            {widths.map((w, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: column order is stable
              <col key={i} style={{ width: w }} />
            ))}
          </colgroup>
          <thead className="[&_tr]:border-b">
            <tr className="border-b hover:bg-transparent">
              {COLUMNS.map((col, i) => (
                <ResizableHead
                  key={col.key}
                  colIndex={i}
                  resizable={col.resizable}
                  onResizeStart={startResize}
                >
                  {col.key === "bill_number" && (
                    <SortableHeadButton
                      field="bill_number"
                      sortConfig={sortConfig}
                    >
                      議案番号
                    </SortableHeadButton>
                  )}
                  {col.key === "name" && (
                    <SortableHeadButton field="name" sortConfig={sortConfig}>
                      議案名
                    </SortableHeadButton>
                  )}
                  {col.key === "council_session" && (
                    <SortableHeadButton
                      field="council_session"
                      sortConfig={sortConfig}
                    >
                      定例会
                    </SortableHeadButton>
                  )}
                  {col.key === "publish_status" && (
                    <SortableHeadButton
                      field="publish_status_order"
                      sortConfig={sortConfig}
                    >
                      公開ステータス
                    </SortableHeadButton>
                  )}
                  {col.key === "status" && (
                    <SortableHeadButton
                      field="status_order"
                      sortConfig={sortConfig}
                    >
                      審議ステータス
                    </SortableHeadButton>
                  )}
                  {col.key === "published_at" && (
                    <SortableHeadButton
                      field="published_at"
                      sortConfig={sortConfig}
                    >
                      公開日
                    </SortableHeadButton>
                  )}
                  {col.key === "actions" && null}
                </ResizableHead>
              ))}
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {bills.map((bill) => (
              <BillRow key={bill.id} bill={bill} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResizableHead({
  colIndex,
  resizable,
  onResizeStart,
  children,
}: {
  colIndex: number;
  resizable: boolean;
  onResizeStart: (
    e: React.PointerEvent<HTMLDivElement>,
    colIndex: number
  ) => void;
  children: React.ReactNode;
}) {
  return (
    <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap relative overflow-hidden">
      {children}
      {resizable && (
        <div
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400 active:bg-blue-600 select-none"
          onPointerDown={(e) => onResizeStart(e, colIndex)}
        />
      )}
    </th>
  );
}

function BillRow({ bill }: { bill: BillWithCouncilSession }) {
  return (
    <tr className="border-b transition-colors hover:bg-muted/50">
      <td className="p-2 align-middle overflow-hidden">
        <span className="block truncate text-sm text-gray-600">
          {bill.bill_number || "-"}
        </span>
      </td>
      <td className="p-2 align-middle overflow-hidden">
        <Link
          href={routes.billEdit(bill.id)}
          className="block truncate font-medium hover:underline"
          title={bill.name}
        >
          {bill.name}
        </Link>
      </td>
      <td className="p-2 align-middle overflow-hidden">
        <span className="block truncate text-gray-600">
          {bill.council_sessions?.name ?? "-"}
        </span>
      </td>
      <td className="p-2 align-middle overflow-hidden">
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
      </td>
      <td className="p-2 align-middle overflow-hidden">
        <StatusBadge status={bill.status} />
      </td>
      <td className="p-2 align-middle overflow-hidden">
        <span className="block truncate text-gray-600">
          {bill.published_at
            ? new Date(bill.published_at).toLocaleDateString("ja-JP", {
                timeZone: "Asia/Tokyo",
              })
            : "-"}
        </span>
      </td>
      <td className="p-2 align-middle">
        <BillActionsMenu billId={bill.id} billName={bill.name} />
      </td>
    </tr>
  );
}
