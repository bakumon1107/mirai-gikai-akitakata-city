-- bill_numberのユニーク制約をグローバルからセッション単位に変更
-- 変更理由: 安芸高田市は年度ごとに議案番号がリセットされるため（例: r8-1は第2〜37号、r9-1も第1号〜始まる）
-- グローバルユニークのままだと翌年の議案登録時に duplicate key エラーが発生する
DROP INDEX IF EXISTS bills_bill_number_unique;

-- (bill_number, council_session_id) の複合ユニーク制約に変更
-- 空文字の bill_number は複数存在し得るため PARTIAL INDEX を維持
CREATE UNIQUE INDEX bills_bill_number_council_session_unique
  ON bills (bill_number, council_session_id)
  WHERE bill_number != '';
