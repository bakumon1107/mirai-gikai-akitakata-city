import type {
  BillStatusEnum,
  BillWithContent,
} from "@/features/bills/shared/types";

export const allBillStatuses: BillStatusEnum[] = [
  "preparing",
  "submitted",
  "in_committee",
  "plenary_session",
  "approved",
  "rejected",
];

const baseBill: BillWithContent = {
  id: "mock-bill-001",
  bill_number: "",
  name: "サンプル議案",
  status: "submitted",
  is_featured: false,
  pdf_url: null,
  thumbnail_url: null,
  share_thumbnail_url: null,
  published_at: "2026-02-15",
  publish_status: "published",
  status_note: null,
  status_order: 4,
  publish_status_order: 2,
  council_session_id: null,
  committee_id: null,
  created_at: "2026-02-15T00:00:00Z",
  updated_at: "2026-02-15T00:00:00Z",
  bill_content: {
    id: "mock-content-001",
    bill_id: "mock-bill-001",
    title: "サンプル法案のタイトル",
    summary:
      "この法案は開発プレビュー用のサンプルデータです。法案の要約文がここに表示されます。実際のデータではありません。",
    content: "# サンプルコンテンツ\n\n本文がここに入ります。",
    difficulty_level: "normal",
    created_at: "2026-02-15T00:00:00Z",
    updated_at: "2026-02-15T00:00:00Z",
  },
  tags: [
    { id: "tag-1", label: "経済" },
    { id: "tag-2", label: "環境" },
  ],
};

export function createMockBill(
  overrides: Partial<BillWithContent> = {}
): BillWithContent {
  return {
    ...baseBill,
    ...overrides,
  };
}
