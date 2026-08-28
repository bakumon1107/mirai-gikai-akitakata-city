alter table press_conference_items
  add column resource_urls jsonb not null default '[]'::jsonb;
