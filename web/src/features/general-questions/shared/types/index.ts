export type QuestionTopic = {
  index: number;
  title: string;
  question_summary: string;
  answer_summary: string;
  exchanges: QuestionExchange[];
};

export type QuestionExchange = {
  speaker: "questioner" | "answerer";
  name: string;
  role?: string;
  text: string;
};

export type GeneralQuestion = {
  id: string;
  council_session_id: string;
  session_day: number;
  questioner_name: string;
  questioner_number: number | null;
  topics: QuestionTopic[];
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
};
