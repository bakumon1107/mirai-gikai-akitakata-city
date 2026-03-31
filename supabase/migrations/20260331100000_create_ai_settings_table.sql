-- AI機能ごとのモデル設定を保持するテーブル
create table ai_settings (
  feature_id text primary key,
  model text not null,
  updated_at timestamp with time zone not null default now()
);

-- updated_at 自動更新トリガー
create trigger update_ai_settings_updated_at
  before update on ai_settings
  for each row execute function update_updated_at_column();

-- RLS有効化（ポリシーなし = デフォルト全拒否、Service Role経由でアクセス）
alter table ai_settings enable row level security;

-- 初期データ: 現在のデフォルト値を投入
insert into ai_settings (feature_id, model) values
  ('interview-chat', 'openai/gpt-5.2'),
  ('config-generation', 'openai/gpt-5.2'),
  ('topic-analysis', 'google/gemini-3-flash-preview');
