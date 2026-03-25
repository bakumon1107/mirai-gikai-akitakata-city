-- bills テーブルに議案PDF URLカラムを追加
-- Web検索補完時にPDFの内容を直接参照するために使用する
alter table bills
  add column pdf_url text;

comment on column bills.pdf_url is '議案PDFのURL。Web検索補完時にPDF内容の取得に使用する。';
