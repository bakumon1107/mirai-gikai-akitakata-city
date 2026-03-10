-- council_sessions.end_date を任意項目に変更（終了日未確定の定例会に対応）
ALTER TABLE council_sessions
  ALTER COLUMN end_date DROP NOT NULL;
