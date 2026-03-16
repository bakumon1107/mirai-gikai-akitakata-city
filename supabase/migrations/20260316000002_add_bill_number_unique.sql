-- bill_numberの空文字を除外したPARTIAL UNIQUE INDEXを追加
-- 空文字の議案が複数存在し得るため、通常のUNIQUE制約ではなくPARTIAL INDEXを使用
CREATE UNIQUE INDEX bills_bill_number_unique
  ON bills (bill_number)
  WHERE bill_number != '';
