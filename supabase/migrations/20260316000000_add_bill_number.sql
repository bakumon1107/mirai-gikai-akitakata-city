-- bills テーブルに議案番号カラムを追加
-- 方針: 必須・一意だが既存データ入力のため一旦 default=0 で追加
alter table bills
  add column bill_number integer not null default 0;

comment on column bills.bill_number is '議案番号（第N号のN部分）。表示時は「第N号」形式で使用する。';
