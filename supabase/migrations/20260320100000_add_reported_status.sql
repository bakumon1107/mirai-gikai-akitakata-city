-- 専決処分報告向けのステータスを追加
-- reported: 専決処分報告（地方自治法第180条に基づく事後報告。承認不要で確定扱い）
-- NOTE: ADD VALUE は同一トランザクション内で使用不可のため、status_order の再作成は次のファイルで実施

ALTER TYPE bill_status_enum ADD VALUE IF NOT EXISTS 'reported';
