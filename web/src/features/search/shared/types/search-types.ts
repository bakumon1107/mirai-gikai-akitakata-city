export type BillSearchResult = {
  id: string;
  title: string;
  summary: string;
  session: string;
  publishedAt: string | null;
  tags: string[];
};

export type QuestionSearchResult = {
  id: string;
  questioner: string;
  topics: string[];
  summary: string | null;
  session: string;
};

export type PressConferenceSearchResult = {
  id: string;
  slug: string;
  title: string;
  heldAt: string;
};

export type SearchResults = {
  bills: BillSearchResult[];
  questions: QuestionSearchResult[];
  pressConferences: PressConferenceSearchResult[];
};

export type SearchTab = "all" | "bills" | "questions" | "press";
