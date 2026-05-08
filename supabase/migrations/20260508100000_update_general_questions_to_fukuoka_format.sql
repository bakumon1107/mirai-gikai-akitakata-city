-- general_questions を fukuoka 形式に変更
-- 旧: topics JSONB に exchanges[] 構造、stance/radar_scores カラムあり
-- 新: topics JSONB に question_summary/answer_summary/answerer_role 構造、publish_status/raw_text/source_url カラムあり

alter table general_questions
  add column if not exists questioner_party text,
  add column if not exists question_order int not null default 1,
  add column if not exists summary text,
  add column if not exists raw_text text,
  add column if not exists source_url text,
  add column if not exists publish_status text not null default 'draft';

alter table general_questions
  drop column if exists pdf_url,
  drop column if exists overall_summary,
  drop column if exists questioner_stance,
  drop column if exists stance_analysis,
  drop column if exists radar_scores;

-- publish_status に check 制約を追加
do $$ begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_name = 'general_questions'
      and constraint_name = 'general_questions_publish_status_check'
  ) then
    alter table general_questions
      add constraint general_questions_publish_status_check
      check (publish_status in ('draft', 'published'));
  end if;
end $$;

-- 旧 unique 制約を削除して新しいものを追加
alter table general_questions
  drop constraint if exists general_questions_council_session_id_session_day_questioner_nam;

-- publish_status インデックス追加
create index if not exists general_questions_publish_status_idx
  on general_questions(publish_status);
