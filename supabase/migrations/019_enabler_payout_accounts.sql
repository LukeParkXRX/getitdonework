-- ============================================================
-- 019_enabler_payout_accounts.sql
-- Enabler Stripe Connect Express 정산 계정
-- ============================================================

-- ─── ENUM ─────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payout_account_status') THEN
    CREATE TYPE payout_account_status AS ENUM ('pending', 'incomplete', 'active', 'restricted', 'rejected');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tax_form_type') THEN
    CREATE TYPE tax_form_type AS ENUM ('w9', 'w8ben', 'w8ben_e', 'none');
  END IF;
END $$;

-- ─── TABLE ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS enabler_payout_accounts (
  user_id                UUID          PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  stripe_account_id      TEXT          UNIQUE,                         -- acct_...
  status                 payout_account_status NOT NULL DEFAULT 'pending',
  onboarding_completed   BOOLEAN       NOT NULL DEFAULT false,
  charges_enabled        BOOLEAN       NOT NULL DEFAULT false,
  payouts_enabled        BOOLEAN       NOT NULL DEFAULT false,
  details_submitted      BOOLEAN       NOT NULL DEFAULT false,
  tax_form_type          tax_form_type NOT NULL DEFAULT 'none',
  tax_form_completed     BOOLEAN       NOT NULL DEFAULT false,
  bank_country           TEXT,                                         -- 'US' / 'KR' / etc
  bank_account_last4     TEXT,
  bank_currency          TEXT,                                         -- 'usd' / 'krw'
  requirements_pending   TEXT[],                                       -- Stripe requirements.currently_due
  raw_payload            JSONB,                                        -- account 객체 마지막 snapshot
  created_at             TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enabler_payout_accounts_status
  ON enabler_payout_accounts(status);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE enabler_payout_accounts ENABLE ROW LEVEL SECURITY;

-- 본인 SELECT
CREATE POLICY "epa_select_own" ON enabler_payout_accounts FOR SELECT
  USING (auth.uid() = user_id);

-- 본인 INSERT
CREATE POLICY "epa_insert_own" ON enabler_payout_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인 UPDATE
CREATE POLICY "epa_update_own" ON enabler_payout_accounts FOR UPDATE
  USING (auth.uid() = user_id);

-- super_admin ALL
CREATE POLICY "epa_super_admin" ON enabler_payout_accounts FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
  );

-- ─── invoices 테이블 컬럼 추가 ─────────────────────────────────────────────────
-- Sprint 15: Stripe Transfer 결과 저장

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
-- USD 기반 Stripe Transfer 금액 (1 USD = credit_rate 원 / 환율로 환산해서 저장)
-- NULL이면 PATCH 시 total_net을 기본 환율(1350)로 나눠 계산
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total_net_usd NUMERIC(12,2);

-- enabler_earnings에 'paid' 상태 추가
DO $$ BEGIN
  ALTER TYPE earning_status ADD VALUE IF NOT EXISTS 'paid';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
