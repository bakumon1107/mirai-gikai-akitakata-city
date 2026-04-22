create table bill_discussions (
  id                uuid primary key default gen_random_uuid(),
  bill_id           uuid not null references bills(id) on delete cascade,
  session_day       int not null,
  questioner_name   text not null,
  questioner_number text,
  questioner_party  text,
  question_summary  text,
  question_raw      text,
  answerer_role     text,
  answerer_name     text,
  answer_summary    text,
  answer_raw        text,
  exchange_count    int not null default 1,
  created_at        timestamptz not null default now()
);

alter table bill_discussions enable row level security;

create index bill_discussions_bill_id_idx on bill_discussions(bill_id);

alter table bill_discussions
  add constraint bill_discussions_bill_id_questioner_name_key
  unique (bill_id, questioner_name);
