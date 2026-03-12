import type { Database } from "@mirai-gikai/supabase";

export type Faction = Database["public"]["Tables"]["factions"]["Row"];

export type FactionWithStanceCount = Faction & { stance_count: number };

export type CreateFactionInput = {
  name: string;
  display_name: string;
  alternative_names: string[];
  logo_url: string | null;
  sort_order: number;
};

export type UpdateFactionInput = {
  id: string;
  name: string;
  display_name: string;
  alternative_names: string[];
  logo_url: string | null;
  sort_order: number;
  is_active: boolean;
};

export type DeleteFactionInput = {
  id: string;
};
