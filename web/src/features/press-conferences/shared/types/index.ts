export type PressConferenceStatus =
  | "draft"
  | "structuring"
  | "review"
  | "published"
  | "error";

export type Speaker = "mayor" | "reporter";

export type PressConferenceTurn = {
  id: string;
  speaker: Speaker;
  speakerName: string | null;
  content: string;
  orderIndex: number;
};

export type PressConferenceItem = {
  id: string;
  itemType: "announcement" | "qa";
  orderIndex: number;
  title: string;
  summary: string | null;
  turns: PressConferenceTurn[];
};

export type PressConference = {
  id: string;
  slug: string;
  title: string;
  heldAt: string;
  youtubeUrl: string | null;
  status: PressConferenceStatus;
  items: PressConferenceItem[];
};
