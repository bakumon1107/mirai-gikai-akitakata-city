create table general_questions (
  id uuid primary key default gen_random_uuid(),
  council_session_id uuid not null references council_sessions(id) on delete cascade,
  session_day int not null,
  questioner_name text not null,
  questioner_number int,
  topics jsonb not null default '[]',
  pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (council_session_id, session_day, questioner_name)
);

alter table general_questions enable row level security;

create index general_questions_council_session_id_idx
  on general_questions(council_session_id);
