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

export type RadarScores = {
  行財政改革: number;
  "福祉・医療": number;
  "産業・経済": number;
  "教育・文化": number;
  "環境・インフラ": number;
};

export type GeneralQuestion = {
  id: string;
  council_session_id: string;
  session_day: number;
  questioner_name: string;
  questioner_number: number | null;
  topics: QuestionTopic[];
  overall_summary: string | null;
  questioner_stance: string | null;
  stance_analysis: string | null;
  radar_scores: RadarScores | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
};
