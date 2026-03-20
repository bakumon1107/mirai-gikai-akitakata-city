import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Settings,
  XCircle,
} from "lucide-react";
import type { ElementType } from "react";

import type { BillStatus } from "../types";

// ステータスの表示設定（一覧画面で使用）
export const BILL_STATUS_CONFIG: Record<
  BillStatus,
  { icon: ElementType; color: string }
> = {
  preparing: {
    icon: Settings,
    color: "text-gray-600 bg-gray-50",
  },
  submitted: {
    icon: FileText,
    color: "text-blue-600 bg-blue-50",
  },
  in_committee: {
    icon: Clock,
    color: "text-yellow-600 bg-yellow-50",
  },
  plenary_session: {
    icon: AlertCircle,
    color: "text-orange-600 bg-orange-50",
  },
  approved: {
    icon: CheckCircle,
    color: "text-green-600 bg-green-50",
  },
  rejected: {
    icon: XCircle,
    color: "text-red-600 bg-red-50",
  },
  adopted: {
    icon: CheckCircle,
    color: "text-teal-600 bg-teal-50",
  },
  partially_adopted: {
    icon: CheckCircle,
    color: "text-cyan-600 bg-cyan-50",
  },
  reported: {
    icon: FileText,
    color: "text-blue-600 bg-blue-50",
  },
};
