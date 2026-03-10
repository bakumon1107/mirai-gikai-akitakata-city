import type { Database } from "@mirai-gikai/supabase";

export type Bill = Database["public"]["Tables"]["bills"]["Row"];
export type BillInsert = Database["public"]["Tables"]["bills"]["Insert"];
export type BillUpdate = Database["public"]["Tables"]["bills"]["Update"];

export type BillStatus = Database["public"]["Enums"]["bill_status_enum"];
export type BillPublishStatus =
  Database["public"]["Enums"]["bill_publish_status"];

export type BillWithContent = Bill & {
  bill_content?: Database["public"]["Tables"]["bill_contents"]["Row"];
};

export type BillWithDietSession = Bill & {
  diet_sessions: { name: string } | null;
};

// ソート関連の型定義
export type BillSortField =
  | "created_at"
  | "published_at"
  | "status_order"
  | "publish_status_order";

export type SortOrder = "asc" | "desc";

export type BillSortConfig = {
  field: BillSortField;
  order: SortOrder;
};

// ステータスのソート順（DBのstatus_order generated columnと一致させる）
export const BILL_STATUS_ORDER: Record<BillStatus, number> = {
  enacted: 0,
  rejected: 1,
  in_receiving_house: 2,
  in_originating_house: 3,
  introduced: 4,
  preparing: 5,
};

// ステータスを日本語ラベルに変換する関数
export function getBillStatusLabel(status: BillStatus): string {
  switch (status) {
    case "preparing":
      return "準備中";
    case "submitted":
      return "上程済み";
    case "in_committee":
      return "委員会審査中";
    case "plenary_session":
      return "本会議採決中";
    case "approved":
      return "可決";
    case "rejected":
      return "否決";
    default:
      return status;
  }
}
