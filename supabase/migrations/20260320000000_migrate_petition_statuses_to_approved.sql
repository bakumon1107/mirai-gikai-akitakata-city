-- 採択・趣旨採択を可決（approved）に統合し、詳細をstatus_noteに記録する
-- adopted → approved + status_note = "採択"
UPDATE bills
SET
  status = 'approved',
  status_note = CASE
    WHEN status_note IS NULL OR status_note = '' THEN '採択'
    ELSE status_note
  END
WHERE status = 'adopted';

-- partially_adopted → approved + status_note = "趣旨採択"
UPDATE bills
SET
  status = 'approved',
  status_note = CASE
    WHEN status_note IS NULL OR status_note = '' THEN '趣旨採択'
    ELSE status_note
  END
WHERE status = 'partially_adopted';
