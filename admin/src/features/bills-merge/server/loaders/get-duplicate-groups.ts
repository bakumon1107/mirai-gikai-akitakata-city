import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";

export type BillInGroup = {
  id: string;
  name: string;
  status: string;
  publish_status: string;
  status_note: string | null;
  created_at: string;
  contentsCount: number;
  stancesCount: number;
};

export type DuplicateGroup = {
  billNumber: number;
  bills: BillInGroup[];
};

export async function getDuplicateGroups(): Promise<DuplicateGroup[]> {
  await requireAdmin();

  const supabase = createAdminClient();

  // bill_number が 0 以外のものだけ対象（0 は「未設定」扱い）
  const { data: bills, error } = await supabase
    .from("bills")
    .select(
      "id, bill_number, name, status, publish_status, status_note, created_at"
    )
    .gt("bill_number", 0)
    .order("bill_number")
    .order("created_at");

  if (error || !bills) return [];

  // Group by bill_number and keep only groups with 2+ bills
  const grouped = new Map<number, typeof bills>();
  for (const bill of bills) {
    const list = grouped.get(bill.bill_number) ?? [];
    list.push(bill);
    grouped.set(bill.bill_number, list);
  }

  const duplicateGroups = [...grouped.entries()].filter(
    ([, list]) => list.length >= 2
  );

  if (duplicateGroups.length === 0) return [];

  // Fetch content and stance counts per bill
  const allIds = duplicateGroups.flatMap(([, list]) => list.map((b) => b.id));

  const [{ data: contents }, { data: stances }] = await Promise.all([
    supabase.from("bill_contents").select("bill_id").in("bill_id", allIds),
    supabase.from("faction_stances").select("bill_id").in("bill_id", allIds),
  ]);

  const contentCounts = new Map<string, number>();
  for (const c of contents ?? []) {
    contentCounts.set(c.bill_id, (contentCounts.get(c.bill_id) ?? 0) + 1);
  }

  const stanceCounts = new Map<string, number>();
  for (const s of stances ?? []) {
    stanceCounts.set(s.bill_id, (stanceCounts.get(s.bill_id) ?? 0) + 1);
  }

  return duplicateGroups.map(([billNumber, list]) => ({
    billNumber,
    bills: list.map((b) => ({
      ...b,
      contentsCount: contentCounts.get(b.id) ?? 0,
      stancesCount: stanceCounts.get(b.id) ?? 0,
    })),
  }));
}
