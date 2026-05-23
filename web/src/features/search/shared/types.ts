export type BillSearchResult = {
  billId: string;
  contentId: string;
  title: string;
  summary: string;
  sessionName: string;
  tags: string[];
  publishedAt: string | null;
};

export type QuestionSearchResult = {
  id: string;
  firstTopicTitle: string;
  summary: string | null;
  questionerName: string;
  questionerParty: string | null;
  sessionName: string;
  sessionSlug: string;
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
