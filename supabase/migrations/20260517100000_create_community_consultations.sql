-- 懇談会（年度）マスタ
create table community_consultations (
  id                   uuid primary key default gen_random_uuid(),
  fiscal_year          text not null unique,
  fiscal_year_label    text not null,
  title                text not null,
  pdf_url              text,
  status               text default 'published',
  held_from            date,
  held_to              date,
  total_participants   integer,
  total_opinions       integer,
  ai_year_summary      text,
  ai_issue_cards       jsonb,
  created_at           timestamptz default now()
);
alter table community_consultations enable row level security;

-- 開催記録（会場ごと）
create table community_consultation_meetings (
  id                        uuid primary key default gen_random_uuid(),
  consultation_id           uuid references community_consultations(id) on delete cascade,
  location_name             text not null,
  held_at                   date,
  participant_count         integer,
  theme                     text,
  ai_representative_quote   text
);
alter table community_consultation_meetings enable row level security;

-- 意見
create table community_consultation_opinions (
  id                    uuid primary key default gen_random_uuid(),
  consultation_id       uuid references community_consultations(id) on delete cascade,
  department            text not null,
  opinion_number        integer,
  text                  text not null,
  is_cross_department   boolean default false,
  opinion_type          text,
  ai_summary            text,
  created_at            timestamptz default now()
);
alter table community_consultation_opinions enable row level security;

-- AIタグ
create table community_consultation_opinion_tags (
  opinion_id   uuid references community_consultation_opinions(id) on delete cascade,
  tag          text not null,
  primary key (opinion_id, tag)
);
alter table community_consultation_opinion_tags enable row level security;
