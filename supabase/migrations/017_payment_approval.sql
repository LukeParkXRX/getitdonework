-- ============================================================
-- 017_payment_approval.sql
-- 관리자 승인 결제 흐름
-- credit_purchases 테이블 확장 + payment_settings + approve RPC
-- ============================================================

-- 기존 status check constraint 교체 (enum이 아닌 text check)
-- 먼저 constraint 이름 확인 후 drop → re-add
ALTER TABLE credit_purchases
  DROP CONSTRAINT IF EXISTS credit_purchases_status_check;

ALTER TABLE credit_purchases
  ADD CONSTRAINT credit_purchases_status_check
    CHECK (status IN ('pending', 'completed', 'refunded', 'failed',
                      'paid_pending_admin', 'rejected', 'expired'));

-- 새 컬럼 추가
ALTER TABLE credit_purchases
  ADD COLUMN IF NOT EXISTS approved_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason  TEXT,
  ADD COLUMN IF NOT EXISTS expires_at        TIMESTAMPTZ;

-- 승인 대기 인덱스
CREATE INDEX IF NOT EXISTS idx_credit_purchases_pending_admin
  ON credit_purchases(status, expires_at)
  WHERE status = 'paid_pending_admin';

-- ============================================================
-- 결제 정책 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_settings (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  auto_approve_threshold_cents INT         NOT NULL DEFAULT 1000000,
  auto_approve_currency       TEXT        NOT NULL DEFAULT 'krw',
  approval_expiry_days        INT         NOT NULL DEFAULT 7,
  is_active                   BOOLEAN     NOT NULL DEFAULT true,
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                  UUID        REFERENCES users(id) ON DELETE SET NULL
);

ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

-- super_admin만 읽기/쓰기 (service role은 RLS 우회)
CREATE POLICY "payment_settings_super_admin" ON payment_settings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
  );

-- 초기 시드 (KRW 100만원 임계, 7일 만료)
INSERT INTO payment_settings (auto_approve_threshold_cents, auto_approve_currency, approval_expiry_days, is_active)
VALUES (1000000, 'krw', 7, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- RPC: approve_pending_purchase
-- 관리자 승인 시 호출. 크레딧 충전 + status 업데이트.
-- ============================================================
CREATE OR REPLACE FUNCTION approve_pending_purchase(
  p_purchase_id UUID,
  p_admin_id    UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_purchase credit_purchases%ROWTYPE;
BEGIN
  SELECT * INTO v_purchase
    FROM credit_purchases
   WHERE id = p_purchase_id
     FOR UPDATE;

  IF v_purchase.id IS NULL THEN
    RAISE EXCEPTION '결제 기록을 찾을 수 없습니다.';
  END IF;

  IF v_purchase.status <> 'paid_pending_admin' THEN
    RAISE EXCEPTION '승인 대기 상태가 아닙니다 (현재: %).', v_purchase.status;
  END IF;

  -- 크레딧 트랜잭션 기록
  INSERT INTO credit_transactions (
    org_id,
    startup_id,
    tx_type,
    amount,
    description
  )
  VALUES (
    v_purchase.org_id,
    v_purchase.startup_id,
    'purchase',
    v_purchase.credits,
    '관리자 승인 후 크레딧 충전 — purchase: ' || p_purchase_id::TEXT
  );

  -- purchase 상태 업데이트
  UPDATE credit_purchases
     SET status       = 'completed',
         completed_at = now(),
         approved_by  = p_admin_id,
         approved_at  = now(),
         updated_at   = now()
   WHERE id = p_purchase_id;

  RETURN json_build_object(
    'ok', true,
    'purchase_id', p_purchase_id,
    'credits', v_purchase.credits
  );
END;
$$;
