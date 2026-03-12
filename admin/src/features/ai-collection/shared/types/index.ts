export type CollectionStatus = "running" | "completed" | "failed" | "paused";

export type FactionMatchStatus = {
  factionName: string;
  matchedFactionId: string | null;
  matchedDisplayName: string | null;
  matchedBy: "display_name" | "alternative_name" | null;
};

export type ExistingBillDetail = {
  id: string;
  name: string;
  status: string;
  contents: {
    summary: string;
    content: string;
  } | null;
  factionStances: Array<{
    factionId: string;
    factionName: string;
    type: string;
    comment: string | null;
  }>;
};

export type BillFieldOverride = {
  draftBillId: string;
  updateStatus: boolean;
  updateContents: boolean;
  stanceUpdates: Array<{ factionName: string; update: boolean }>;
};

export type DraftBill = {
  id: string;
  billNumber: string | null;
  title: string;
  summary: string;
  status:
    | "submitted"
    | "in_committee"
    | "plenary_session"
    | "approved"
    | "rejected";
  submitter: string | null;
  sourceUrls: string[];
};

export type DraftFactionStance = {
  id: string;
  billTitle: string;
  factionName: string;
  stanceType: "for" | "against" | "neutral" | "absent";
  comment: string | null;
  sourceUrls: string[];
};

export type CollectionRun = {
  id: string;
  startDate: string;
  endDate: string;
  status: CollectionStatus;
  createdAt: string;
  completedAt: string | null;
  error: string | null;
  bills: DraftBill[];
  factionStances: DraftFactionStance[];
  sources: string[];
};
