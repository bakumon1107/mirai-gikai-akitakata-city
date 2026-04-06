-- AI機能ごとのモデル設定を保持するテーブル
create table if not exists ai_settings (
  feature_id text primary key,
  model text not null,
  updated_at timestamp with time zone not null default now()
);

-- updated_at 自動更新トリガー
drop trigger if exists update_ai_settings_updated_at on ai_settings;
create trigger update_ai_settings_updated_at
  before update on ai_settings
  for each row execute function update_updated_at_column();

-- RLS有効化（ポリシーなし = デフォルト全拒否、Service Role経由でアクセス）
alter table ai_settings enable row level security;

-- 初期データ: 現在のデフォルト値を投入（既存行はスキップ）
insert into ai_settings (feature_id, model) values
  ('interview-chat', 'openai/gpt-5.2'),
  ('config-generation', 'openai/gpt-5.2'),
  ('topic-analysis', 'google/gemini-3-flash-preview'),
  ('bill-enrichment', 'anthropic/claude-cli'),
  ('ai-collection', 'anthropic/claude-cli'),
  ('thumbnail-generation', 'openai/dall-e-3')
on conflict (feature_id) do nothing;
