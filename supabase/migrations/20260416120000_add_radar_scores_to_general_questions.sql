alter table general_questions
  add column if not exists radar_scores jsonb;
-- radar_scores 構造:
-- {
--   "行財政改革": 4,
--   "福祉・医療": 2,
--   "産業・経済": 3,
--   "教育・文化": 1,
--   "環境・インフラ": 5
-- }
