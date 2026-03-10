-- billsテーブルにstatusのソート順を表すgenerated columnを追加
-- 審議進行度順で並べるための整数カラム（川崎市議会版ステータス対応）
ALTER TABLE bills ADD COLUMN status_order INT GENERATED ALWAYS AS (
  CASE status
    WHEN 'approved'        THEN 0
    WHEN 'rejected'        THEN 1
    WHEN 'plenary_session' THEN 2
    WHEN 'in_committee'    THEN 3
    WHEN 'submitted'       THEN 4
    WHEN 'preparing'       THEN 5
  END
) STORED;

CREATE INDEX idx_bills_status_order ON bills(status_order);
