alter table general_questions
  add column if not exists overall_summary text,
  add column if not exists questioner_stance text,
  add column if not exists stance_analysis text;
