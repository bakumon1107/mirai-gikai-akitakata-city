import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";

export type BillContent = {
  id: string;
  difficulty_level: string;
  title: string;
  summary: string;
  content: string;
};

export type BillStance = {
  id: string;
  faction_id: string;
  faction_name: string;
  type: string;
  comment: string | null;
};

export type BillInGroup = {
  id: string;
  bill_number: string;
  name: string;
  status: string;
  status_note: string | null;
  publish_status: string;
  published_at: string | null;
  thumbnail_url: string | null;
  share_thumbnail_url: string | null;
  is_featured: boolean;
  committee_id: string | null;
  council_session_id: string | null;
  created_at: string;
  contents: BillContent[];
  stances: BillStance[];
};

export type DuplicateGroup = {
  billNumber: string;
  bills: BillInGroup[];
};

export async function getDuplicateGroups(): Promise<DuplicateGroup[]> {
  await requireAdmin();

  const supabase = createAdminClient();

  // bill_number が空文字以外のものだけ対象（空文字は「未設定」扱い）
  const { data: bills, error } = await supabase
    .from("bills")
    .select(
      "id, bill_number, name, status, status_note, publish_status, published_at, thumbnail_url, share_thumbnail_url, is_featured, committee_id, council_session_id, created_at"
    )
    .neq("bill_number", "")
    .order("bill_number")
    .order("created_at");

  if (error || !bills) return [];

  // Group by bill_number and keep only groups with 2+ bills
  const grouped = new Map<string, typeof bills>();
  for (const bill of bills) {
    const list = grouped.get(bill.bill_number) ?? [];
    list.push(bill);
    grouped.set(bill.bill_number, list);
  }

  const duplicateGroups = [...grouped.entries()].filter(
    ([, list]) => list.length >= 2
  );

  if (duplicateGroups.length === 0) return [];

  const allIds = duplicateGroups.flatMap(([, list]) => list.map((b) => b.id));

  const [{ data: allContents }, { data: allStances }] = await Promise.all([
    supabase
      .from("bill_contents")
      .select("id, bill_id, difficulty_level, title, summary, content")
      .in("bill_id", allIds),
    supabase
      .from("faction_stances")
      .select(
        "id, bill_id, faction_id, type, comment, factions(name, display_name)"
      )
      .in("bill_id", allIds),
  ]);

  return duplicateGroups.map(([billNumber, list]) => ({
    billNumber,
    bills: list.map((b) => ({
      ...b,
      contents: (allContents ?? [])
        .filter((c) => c.bill_id === b.id)
        .map(({ id, difficulty_level, title, summary, content }) => ({
          id,
          difficulty_level,
          title,
          summary,
          content,
        })),
      stances: (allStances ?? [])
        .filter((s) => s.bill_id === b.id)
        .map((s) => {
          const faction = s.factions as {
            name: string;
            display_name: string;
          } | null;
          return {
            id: s.id,
            faction_id: s.faction_id,
            faction_name:
              faction?.display_name ?? faction?.name ?? s.faction_id,
            type: s.type,
            comment: s.comment,
          };
        }),
    })),
  }));
}
