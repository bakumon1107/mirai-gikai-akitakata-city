-- ----------------------------------------
-- 会派の別名カラム追加
-- display_name を正式名称とし、略称・旧称等の別名を管理する
-- ----------------------------------------

ALTER TABLE factions ADD COLUMN alternative_names TEXT[] NOT NULL DEFAULT '{}';
