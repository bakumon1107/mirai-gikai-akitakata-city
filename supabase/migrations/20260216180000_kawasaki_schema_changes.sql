-- ============================================================
-- 川崎市議会版スキーマ変更マイグレーション
-- Phase 2: 国会固有スキーマの削除・市議会用スキーマへの変更
-- ============================================================

-- ----------------------------------------
-- 1. house_enum と originating_house カラム削除
-- ----------------------------------------
DROP INDEX IF EXISTS idx_bills_originating_house;
ALTER TABLE bills DROP COLUMN originating_house;
DROP TYPE house_enum;

-- ----------------------------------------
-- 2. bills.shugiin_url 削除
-- ----------------------------------------
ALTER TABLE bills DROP COLUMN shugiin_url;

-- ----------------------------------------
-- 3. bill_status_enum を市議会用に更新
--    introduced → submitted
--    in_originating_house → in_committee
--    in_receiving_house → plenary_session
--    enacted → approved
-- ----------------------------------------
ALTER TABLE bills ALTER COLUMN status TYPE text;

UPDATE bills SET status = CASE status
    WHEN 'introduced' THEN 'submitted'
    WHEN 'in_originating_house' THEN 'in_committee'
    WHEN 'in_receiving_house' THEN 'plenary_session'
    WHEN 'enacted' THEN 'approved'
    ELSE status
END;

ALTER TYPE bill_status_enum RENAME TO bill_status_enum_old;

CREATE TYPE bill_status_enum AS ENUM (
    'preparing',
    'submitted',
    'in_committee',
    'plenary_session',
    'approved',
    'rejected'
);

ALTER TABLE bills ALTER COLUMN status TYPE bill_status_enum USING status::bill_status_enum;
DROP TYPE bill_status_enum_old;

-- ----------------------------------------
-- 4. diet_sessions → council_sessions リネーム
-- ----------------------------------------
ALTER TABLE diet_sessions RENAME TO council_sessions;
ALTER TABLE council_sessions RENAME COLUMN shugiin_url TO council_url;
ALTER TABLE bills RENAME COLUMN diet_session_id TO council_session_id;

-- rename index
ALTER INDEX IF EXISTS idx_bills_diet_session_id RENAME TO idx_bills_council_session_id;
ALTER INDEX IF EXISTS idx_diet_sessions_date_range RENAME TO idx_council_sessions_date_range;

-- set_active_diet_session → set_active_council_session
CREATE OR REPLACE FUNCTION set_active_council_session(target_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE council_sessions
  SET is_active = (id = target_session_id)
  WHERE id IS NOT NULL;
END;
$$;

DROP FUNCTION IF EXISTS set_active_diet_session(uuid);

-- ----------------------------------------
-- 5. 委員会テーブル追加
-- ----------------------------------------
CREATE TABLE committees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE committees ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_committees_updated_at
    BEFORE UPDATE ON committees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE bills ADD COLUMN committee_id UUID REFERENCES committees(id);
CREATE INDEX idx_bills_committee_id ON bills(committee_id);

-- ----------------------------------------
-- 6. 会派マスターテーブル追加
-- ----------------------------------------
CREATE TABLE factions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    logo_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE factions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_factions_updated_at
    BEFORE UPDATE ON factions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------
-- 7. 会派見解テーブル（1議案に複数会派の見解を登録可能）
-- ----------------------------------------
CREATE TABLE faction_stances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    type stance_type_enum NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(bill_id, faction_id)
);

ALTER TABLE faction_stances ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_faction_stances_bill_id ON faction_stances(bill_id);
CREATE INDEX idx_faction_stances_faction_id ON faction_stances(faction_id);

CREATE TRIGGER set_faction_stances_updated_at
    BEFORE UPDATE ON faction_stances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------
-- 8. mirai_stances テーブル削除
-- ----------------------------------------
DROP TABLE mirai_stances;
