-- bill_number を integer から text に変更
-- 「報告第1号」のような形式に対応するため
alter table bills
  alter column bill_number type text using case when bill_number = 0 then '' else bill_number::text end,
  alter column bill_number set default '';

comment on column bills.bill_number is '議案番号（例: 「第1号」「報告第1号」など）。空文字は未設定を示す。';
