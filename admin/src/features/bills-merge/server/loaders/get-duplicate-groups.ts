import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import { requireAdmin } from "@/features/auth/lib/auth-server";

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
  name: string;
  bills: BillInGroup[];
};

export async function getDuplicateGroups(): Promise<DuplicateGroup[]> {
  await requireAdmin();

  const supabase = createAdminClient();

  // Fetch all bills
  const { data: bills, error } = await supabase
    .from("bills")
    .select("id, name, status, publish_status, status_note, created_at")
    .order("name")
    .order("created_at");

  if (error || !bills) return [];

  // Group by name and keep only groups with 2+ bills
  const grouped = new Map<string, typeof bills>();
  for (const bill of bills) {
    const list = grouped.get(bill.name) ?? [];
    list.push(bill);
    grouped.set(bill.name, list);
  }

  const duplicateNames = [...grouped.entries()].filter(
    ([, list]) => list.length >= 2
  );

  if (duplicateNames.length === 0) return [];

  // Fetch content and stance counts per bill
  const allIds = duplicateNames.flatMap(([, list]) => list.map((b) => b.id));

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

  return duplicateNames.map(([name, list]) => ({
    name,
    bills: list.map((b) => ({
      ...b,
      contentsCount: contentCounts.get(b.id) ?? 0,
      stancesCount: stanceCounts.get(b.id) ?? 0,
    })),
  }));
}
