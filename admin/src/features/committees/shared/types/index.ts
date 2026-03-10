import type { Database } from "@mirai-gikai/supabase";

export type Committee = Database["public"]["Tables"]["committees"]["Row"];

export type CommitteeWithBillCount = Committee & { bill_count: number };

export type CreateCommitteeInput = {
  name: string;
  description: string | null;
  sort_order: number;
};

export type UpdateCommitteeInput = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

export type DeleteCommitteeInput = {
  id: string;
};
