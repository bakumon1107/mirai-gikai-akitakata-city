-- 請願・意見書向けのステータスを追加
-- adopted: 採択（請願が採択された）
-- partially_adopted: 趣旨採択（請願の趣旨が採択された）
-- NOTE: ADD VALUE は同一トランザクション内で使用不可のため、status_order の再作成は次のファイルで実施

ALTER TYPE bill_status_enum ADD VALUE IF NOT EXISTS 'adopted';
ALTER TYPE bill_status_enum ADD VALUE IF NOT EXISTS 'partially_adopted';
