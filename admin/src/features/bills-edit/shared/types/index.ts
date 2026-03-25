import type { Database } from "@mirai-gikai/supabase";
import { z } from "zod";

// 既存の型を再利用
export type Bill = Database["public"]["Tables"]["bills"]["Row"];
export type BillUpdate = Database["public"]["Tables"]["bills"]["Update"];
export type BillInsert = Database["public"]["Tables"]["bills"]["Insert"];

// 公開ステータス型
export type BillPublishStatus = "draft" | "published" | "coming_soon";

// 共通のバリデーションスキーマ
const billBaseSchema = z.object({
  bill_number: z.string().max(50, "議案番号は50文字以内で入力してください"),
  name: z
    .string()
    .min(1, "議案名は必須です")
    .max(200, "議案名は200文字以内で入力してください"),
  status: z.enum([
    "preparing",
    "submitted",
    "in_committee",
    "plenary_session",
    "approved",
    "rejected",
    "adopted",
    "partially_adopted",
    "reported",
  ]),
  status_note: z
    .string()
    .max(500, "ステータス備考は500文字以内で入力してください")
    .nullable(),
  published_at: z.string().optional(),
  thumbnail_url: z.string().nullable().optional(),
  share_thumbnail_url: z.string().nullable().optional(),
  is_featured: z.boolean(),
  committee_id: z.string().uuid().nullable().optional(),
  council_session_id: z.string().uuid().nullable().optional(),
  pdf_url: z
    .string()
    .url("有効なURLを入力してください")
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
});

// 更新用スキーマ（既存）
export const billUpdateSchema = billBaseSchema;
export type BillUpdateInput = z.infer<typeof billUpdateSchema>;

// 新規作成用スキーマ
export const billCreateSchema = billBaseSchema;
export type BillCreateInput = z.infer<typeof billCreateSchema>;
