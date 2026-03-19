import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";

export type BillInPeriod = {
  id: string;
  billNumber: string;
  name: string;
  status: string;
  summary: string;
};

export async function getBillsInPeriod(
  startDate: string,
  endDate: string
): Promise<BillInPeriod[]> {
  const supabase = createAdminClient();

  const { data: bills } = await supabase
    .from("bills")
    .select(
      "id, bill_number, name, status, bill_contents(summary, difficulty_level)"
    )
    .neq("bill_number", "")
    .gte("published_at", startDate)
    .lte("published_at", endDate)
    .order("bill_number");

  if (!bills) return [];

  return bills.map((b) => {
    const normalContent = (
      b.bill_contents as Array<{
        summary: string;
        difficulty_level: string;
      }> | null
    )?.find((c) => c.difficulty_level === "normal");
    return {
      id: b.id,
      billNumber: b.bill_number ?? "",
      name: b.name,
      status: b.status ?? "",
      summary: normalContent?.summary ?? "",
    };
  });
}
