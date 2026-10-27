-- press_conference_turns.speaker に担当課職員区分 'staff' を追加する
-- 会見で担当課の職員が回答したターンを、市長・記者と別の話者として扱う。
-- 既存の check 制約はインライン定義のため、Postgres の自動命名
-- （press_conference_turns_speaker_check）を対象に張り替える。
alter table press_conference_turns
  drop constraint if exists press_conference_turns_speaker_check;

alter table press_conference_turns
  add constraint press_conference_turns_speaker_check
    check (speaker in ('mayor', 'reporter', 'staff'));

-- RLS を有効化（ポリシーは定義しない。アクセスは createAdminClient 経由）
alter table press_conference_turns enable row level security;
