-- 請願・意見書向けのステータスを追加
-- adopted: 採択（請願が採択された）
-- partially_adopted: 趣旨採択（請願の趣旨が採択された）

ALTER TYPE bill_status_enum ADD VALUE 'adopted';
ALTER TYPE bill_status_enum ADD VALUE 'partially_adopted';

-- status_order の GENERATED COLUMN を再作成して新ステータスを含める
ALTER TABLE bills DROP COLUMN status_order;

ALTER TABLE bills ADD COLUMN status_order INT GENERATED ALWAYS AS (
  CASE status
    WHEN 'approved'          THEN 0
    WHEN 'adopted'           THEN 0
    WHEN 'partially_adopted' THEN 1
    WHEN 'rejected'          THEN 2
    WHEN 'plenary_session'   THEN 3
    WHEN 'in_committee'      THEN 4
    WHEN 'submitted'         THEN 5
    WHEN 'preparing'         THEN 6
  END
) STORED;

CREATE INDEX idx_bills_status_order ON bills(status_order);
