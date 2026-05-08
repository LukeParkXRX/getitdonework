-- ============================================================
-- 018_enabler_payouts.sql
-- Enabler 정산 시스템
-- payout_settings / enabler_earnings / invoices 테이블 + RPC
-- ============================================================

-- ============================================================
-- 1. payout_settings 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS payout_settings (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  enabler_id      UUID        REFERENCES users(id) ON DELETE CASCADE,
  -- NULL = 글로벌 기본값, NOT NULL = enabler-specific override
  platform_fee_pct NUMERIC(5,2) NOT NULL DEFAULT 20 CHECK (platform_fee_pct >= 0 AND platform_fee_pct <= 100),
  credit_rate      NUMERIC(10,2) NOT NULL DEFAULT 5  CHECK (credit_rate > 0),
  -- 1 크레딧 = credit_rate 원
  min_payout       NUMERIC(12,2) NOT NULL DEFAULT 50 CHECK (min_payout >= 0),
  -- 최소 지급액 (원 기준)
  effective_from   TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to     TIMESTAMPTZ,
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payout_settings_period_check CHECK (
    effective_to IS NULL OR effective_to > effective_from
  )
);

-- 글로벌 default: enabler_id IS NULL, 최신 1건 유효
CREATE INDEX IF NOT EXISTS idx_payout_settings_global
  ON payout_settings(effective_from DESC)
  WHERE enabler_id IS NULL AND effective_to IS NULL;

CREATE INDEX IF NOT EXISTS idx_payout_settings_enabler
  ON payout_settings(enabler_id, effective_from DESC)
  WHERE enabler_id IS NOT NULL AND effective_to IS NULL;

-- 글로벌 시드 (기본 정책)
INSERT INTO payout_settings (enabler_id, platform_fee_pct, credit_rate, min_payout, effective_from)
VALUES (NULL, 20, 5, 50, now())
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. earning_status ENUM
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'earning_status'
  ) THEN
    CREATE TYPE earning_status AS ENUM ('accrued', 'invoiced', 'reversed');
  END IF;
END $$;

-- ============================================================
-- 3. enabler_earnings 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS enabler_earnings (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  enabler_id      UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id      UUID          NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  credits_earned  NUMERIC(12,2) NOT NULL CHECK (credits_earned >= 0),
  -- 세션에서 사용된 크레딧 (플랫폼 수수료 공제 전)
  fee_pct         NUMERIC(5,2)  NOT NULL CHECK (fee_pct >= 0 AND fee_pct <= 100),
  -- 당시 적용된 플랫폼 수수료 %
  net_amount      NUMERIC(12,2) NOT NULL CHECK (net_amount >= 0),
  -- 실 지급액 (원): credits_earned * credit_rate * (1 - fee_pct/100)
  credit_rate     NUMERIC(10,2) NOT NULL CHECK (credit_rate > 0),
  -- 당시 크레딧 단가 (원)
  status          earning_status NOT NULL DEFAULT 'accrued',
  invoice_id      UUID,
  -- invoices.id FK — 나중에 추가 (순환 참조 방지)
  accrued_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE (booking_id)
  -- 1 booking = 1 earning 보장
);

CREATE INDEX IF NOT EXISTS idx_enabler_earnings_enabler
  ON enabler_earnings(enabler_id, status, accrued_at DESC);

CREATE INDEX IF NOT EXISTS idx_enabler_earnings_invoice
  ON enabler_earnings(invoice_id)
  WHERE invoice_id IS NOT NULL;

-- ============================================================
-- 4. invoice_status ENUM
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'invoice_status'
  ) THEN
    CREATE TYPE invoice_status AS ENUM ('pending', 'approved', 'cancelled');
  END IF;
END $$;

-- ============================================================
-- 5. invoices 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  enabler_id      UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start    DATE          NOT NULL,
  period_end      DATE          NOT NULL,
  total_credits   NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_credits >= 0),
  total_net       NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_net >= 0),
  -- 실 지급 합계 (원)
  status          invoice_status NOT NULL DEFAULT 'pending',
  approved_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at     TIMESTAMPTZ,
  cancelled_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  cancelled_at    TIMESTAMPTZ,
  cancel_reason   TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE (enabler_id, period_start)
  -- 동일 기간 중복 방지
);

CREATE INDEX IF NOT EXISTS idx_invoices_enabler
  ON invoices(enabler_id, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_status
  ON invoices(status, created_at DESC);

-- ============================================================
-- 6. enabler_earnings.invoice_id FK 추가
-- ============================================================
ALTER TABLE enabler_earnings
  ADD CONSTRAINT fk_enabler_earnings_invoice
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;

-- ============================================================
-- 7. RPC: accrue_enabler_earning(p_booking_id)
-- ============================================================
CREATE OR REPLACE FUNCTION accrue_enabler_earning(p_booking_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_enabler_id   UUID;
  v_credits      NUMERIC;
  v_setting      RECORD;
  v_fee_pct      NUMERIC;
  v_credit_rate  NUMERIC;
  v_net          NUMERIC;
BEGIN
  -- 1. booking에서 enabler_id + credits_amount 조회
  SELECT enabler_id, credits_amount
    INTO v_enabler_id, v_credits
    FROM bookings
   WHERE id = p_booking_id
     AND status = 'confirmed';

  IF v_enabler_id IS NULL THEN
    RAISE EXCEPTION 'booking % not found or not confirmed', p_booking_id;
  END IF;

  -- 2. 이미 적립 기록이 있으면 skip (idempotent)
  IF EXISTS (
    SELECT 1 FROM enabler_earnings WHERE booking_id = p_booking_id
  ) THEN
    RETURN;
  END IF;

  -- 3. 정책 조회: enabler-specific 우선 → 없으면 global
  SELECT platform_fee_pct, credit_rate
    INTO v_fee_pct, v_credit_rate
    FROM payout_settings
   WHERE (enabler_id = v_enabler_id OR enabler_id IS NULL)
     AND effective_to IS NULL
   ORDER BY
     (CASE WHEN enabler_id = v_enabler_id THEN 0 ELSE 1 END),
     effective_from DESC
   LIMIT 1;

  IF v_credit_rate IS NULL THEN
    RAISE EXCEPTION 'no payout_settings found for enabler %', v_enabler_id;
  END IF;

  -- 4. net 계산
  v_net := v_credits * v_credit_rate * (1 - v_fee_pct / 100.0);

  -- 5. INSERT
  INSERT INTO enabler_earnings (
    enabler_id, booking_id, credits_earned, fee_pct, net_amount, credit_rate, status
  ) VALUES (
    v_enabler_id, p_booking_id, v_credits, v_fee_pct, v_net, v_credit_rate, 'accrued'
  );
END;
$$;

-- ============================================================
-- 8. RPC: generate_monthly_invoices(p_period_start, p_period_end)
-- ============================================================
CREATE OR REPLACE FUNCTION generate_monthly_invoices(
  p_period_start DATE,
  p_period_end   DATE
)
RETURNS TABLE (
  enabler_id   UUID,
  invoice_id   UUID,
  total_net    NUMERIC,
  created_new  BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row       RECORD;
  v_invoice   RECORD;
  v_is_new    BOOLEAN;
BEGIN
  -- accrued earnings를 enabler별로 집계
  FOR v_row IN
    SELECT
      ee.enabler_id,
      SUM(ee.credits_earned) AS sum_credits,
      SUM(ee.net_amount)     AS sum_net
    FROM enabler_earnings ee
    WHERE ee.status = 'accrued'
      AND ee.accrued_at >= p_period_start::TIMESTAMPTZ
      AND ee.accrued_at <  p_period_end::TIMESTAMPTZ + INTERVAL '1 day'
    GROUP BY ee.enabler_id
    HAVING SUM(ee.net_amount) > 0
  LOOP
    v_is_new := FALSE;

    -- invoices INSERT (ON CONFLICT: 이미 있으면 skip)
    INSERT INTO invoices (
      enabler_id, period_start, period_end,
      total_credits, total_net, status
    ) VALUES (
      v_row.enabler_id,
      p_period_start,
      p_period_end,
      v_row.sum_credits,
      v_row.sum_net,
      'pending'
    )
    ON CONFLICT (enabler_id, period_start) DO NOTHING
    RETURNING id INTO v_invoice;

    IF v_invoice.id IS NOT NULL THEN
      v_is_new := TRUE;
    ELSE
      -- 이미 존재하는 invoice id 조회
      SELECT id INTO v_invoice
        FROM invoices
       WHERE enabler_id = v_row.enabler_id
         AND period_start = p_period_start;
    END IF;

    -- earnings에 invoice_id 연결 + status → invoiced
    UPDATE enabler_earnings
       SET invoice_id = v_invoice.id,
           status     = 'invoiced'
     WHERE enabler_id = v_row.enabler_id
       AND status     = 'accrued'
       AND accrued_at >= p_period_start::TIMESTAMPTZ
       AND accrued_at <  p_period_end::TIMESTAMPTZ + INTERVAL '1 day';

    -- 결과 행 반환
    enabler_id  := v_row.enabler_id;
    invoice_id  := v_invoice.id;
    total_net   := v_row.sum_net;
    created_new := v_is_new;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- ============================================================
-- 9. RLS
-- ============================================================

-- payout_settings: super_admin ALL / 공개 없음
ALTER TABLE payout_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_payout_settings"
  ON payout_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
       WHERE id = auth.uid()
         AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
       WHERE id = auth.uid()
         AND role = 'super_admin'
    )
  );

-- enabler_earnings: 본인 SELECT / super_admin ALL
ALTER TABLE enabler_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enabler_own_earnings_select"
  ON enabler_earnings
  FOR SELECT
  TO authenticated
  USING (enabler_id = auth.uid());

CREATE POLICY "super_admin_all_enabler_earnings"
  ON enabler_earnings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
       WHERE id = auth.uid()
         AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
       WHERE id = auth.uid()
         AND role = 'super_admin'
    )
  );

-- invoices: 본인 SELECT / super_admin ALL
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enabler_own_invoices_select"
  ON invoices
  FOR SELECT
  TO authenticated
  USING (enabler_id = auth.uid());

CREATE POLICY "super_admin_all_invoices"
  ON invoices
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
       WHERE id = auth.uid()
         AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
       WHERE id = auth.uid()
         AND role = 'super_admin'
    )
  );
