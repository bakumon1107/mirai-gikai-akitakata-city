"use client";

import { Calendar, Edit, FileText, MessageCircle, Users } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BILL_STATUS_CONFIG } from "../../../shared/constants/bill-config";
import type { BillPublishStatus, BillStatus } from "../../../shared/types";
import { getBillStatusLabel } from "../../../shared/types";
import { BillActionsMenu } from "../bill-actions-menu/bill-actions-menu";
import { PreviewButton } from "./preview-button";
import { PublishStatusBadge } from "./publish-status-badge";
import { ViewButton } from "./view-button";

function StatusBadge({ status }: { status: BillStatus }) {
  const config = BILL_STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 py-1 rounded-full text-sm font-bold`}
    >
      <Icon className="h-4 w-4" />
      <span>{getBillStatusLabel(status)}</span>
    </div>
  );
}

interface BillCardProps {
  bill: {
    id: string;
    name: string;
    status: BillStatus;
    publish_status: BillPublishStatus;
    status_note: string | null;
    published_at: string | null;
    stancesCount: number;
  };
}

export function BillCard({ bill }: BillCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row justify-between items-center gap-3">
          <CardTitle className="text-lg font-semibold text-gray-900 leading-6">
            {bill.name}
          </CardTitle>
          <BillActionsMenu billId={bill.id} billName={bill.name} />
        </div>
        <div className="flex flex-none flex-wrap gap-2">
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
      </CardHeader>
      <CardContent>
        <div className="text-sm">
          <div className="mb-2 flex items-center gap-2">
            <StatusBadge status={bill.status} />
            <div className="font-medium text-gray-900">
              {bill.status_note || "-"}
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <span className="text-gray-500 flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              公開日:
              <span className="font-medium text-gray-900">
                {bill.published_at
                  ? new Date(bill.published_at).toLocaleDateString("ja-JP", {
                      timeZone: "Asia/Tokyo",
                    })
                  : "-"}
              </span>
            </span>
            <span className="text-gray-500 flex items-center gap-1">
              <Users className="h-4 w-4" />
              会派見解:
              <span className="font-medium text-gray-900">
                {bill.stancesCount > 0 ? `${bill.stancesCount}件` : "-"}
              </span>
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <Link href={routes.billEdit(bill.id)}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-1" />
                基本情報
              </Button>
            </Link>
            <Link href={routes.billContentsEdit(bill.id)}>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-1" />
                コンテンツ
              </Button>
            </Link>
            <Link href={routes.billInterview(bill.id)}>
              <Button variant="outline" size="sm">
                <MessageCircle className="h-4 w-4 mr-1" />
                インタビュー設定
              </Button>
            </Link>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
