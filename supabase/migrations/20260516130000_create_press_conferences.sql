create table press_conferences (
  id           uuid        primary key default gen_random_uuid(),
  slug         text        not null unique,
  title        text        not null,
  held_at      date        not null,
  youtube_url  text,
  status       text        not null default 'draft'
                 check (status in ('draft', 'structuring', 'review', 'published', 'error')),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table press_conferences enable row level security;

create index on press_conferences (slug);
create index on press_conferences (held_at desc);
create index on press_conferences (status);

create table press_conference_items (
  id                   uuid        primary key default gen_random_uuid(),
  press_conference_id  uuid        not null references press_conferences(id) on delete cascade,
  item_type            text        not null check (item_type in ('announcement', 'qa')),
  order_index          int         not null,
  title                text        not null,
  summary              text,
  created_at           timestamptz default now()
);

alter table press_conference_items enable row level security;

create index on press_conference_items (press_conference_id, order_index);

create table press_conference_turns (
  id                        uuid        primary key default gen_random_uuid(),
  press_conference_item_id  uuid        not null references press_conference_items(id) on delete cascade,
  speaker                   text        not null check (speaker in ('mayor', 'reporter')),
  speaker_name              text,
  content                   text        not null,
  order_index               int         not null,
  created_at                timestamptz default now()
);

alter table press_conference_turns enable row level security;

create index on press_conference_turns (press_conference_item_id, order_index);
