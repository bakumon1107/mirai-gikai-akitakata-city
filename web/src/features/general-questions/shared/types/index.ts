export type GeneralQuestionTopic = {
  title: string;
  question_summary: string;
  answer_summary: string;
  answerer_role: string;
  answerer_name: string;
  block_summary?: string | null;
};

export type GeneralQuestion = {
  id: string;
  council_session_id: string;
  questioner_name: string;
  questioner_party: string | null;
  questioner_number: number | null;
  session_day: number;
  question_order: number;
  summary: string | null;
  topics: GeneralQuestionTopic[];
  raw_text: string | null;
  source_url: string | null;
  publish_status: string;
  created_at: string;
  updated_at: string;
};
