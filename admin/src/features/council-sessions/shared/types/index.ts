export type CouncilSession = {
  id: string;
  name: string;
  slug: string | null;
  council_url: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateCouncilSessionInput = {
  name: string;
  slug: string | null;
  council_url: string | null;
  start_date: string;
  end_date: string | null;
};

export type UpdateCouncilSessionInput = {
  id: string;
  name: string;
  slug: string | null;
  council_url: string | null;
  start_date: string;
  end_date: string | null;
};

export type DeleteCouncilSessionInput = {
  id: string;
};
