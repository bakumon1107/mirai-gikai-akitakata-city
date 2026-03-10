"use server";

import { createAdminClient } from "@mirai-gikai/supabase";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import type { ExistingBillDetail } from "../../shared/types";

export async function getExistingBillsDetail(
  billNames: string[]
): Promise<ExistingBillDetail[]> {
  await requireAdmin();

  if (billNames.length === 0) return [];

  const supabase = createAdminClient();

  const { data: bills } = await supabase
    .from("bills")
    .select("id, name, status")
    .in("name", billNames);

  if (!bills || bills.length === 0) return [];

  const billIds = bills.map((b) => b.id);

  const [contentsResult, stancesResult] = await Promise.all([
    supabase
      .from("bill_contents")
      .select("bill_id, summary, content")
      .in("bill_id", billIds)
      .eq("difficulty_level", "normal"),
    supabase
      .from("faction_stances")
      .select("bill_id, faction_id, type, comment, factions(display_name)")
      .in("bill_id", billIds),
  ]);

  const contentsMap = new Map(
    (contentsResult.data ?? []).map((c) => [c.bill_id, c])
  );

  const stancesMap = new Map<
    string,
    Array<{
      factionId: string;
      factionName: string;
      type: string;
      comment: string | null;
    }>
  >();

  for (const stance of stancesResult.data ?? []) {
    if (!stancesMap.has(stance.bill_id)) {
      stancesMap.set(stance.bill_id, []);
    }
    const factionName =
      (stance.factions as { display_name: string } | null)?.display_name ??
      stance.faction_id;
    stancesMap.get(stance.bill_id)?.push({
      factionId: stance.faction_id,
      factionName,
      type: stance.type,
      comment: stance.comment,
    });
  }

  return bills.map((bill) => {
    const contents = contentsMap.get(bill.id);
    return {
      id: bill.id,
      name: bill.name,
      status: bill.status,
      contents: contents
        ? { summary: contents.summary, content: contents.content }
        : null,
      factionStances: stancesMap.get(bill.id) ?? [],
    };
  });
}
