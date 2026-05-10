CREATE TYPE dispute_status AS ENUM ('open', 'in_review', 'resolved_refund', 'resolved_partial', 'resolved_dismissed', 'cancelled');
CREATE TYPE dispute_filer AS ENUM ('startup', 'enabler');

CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  filer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filer_role dispute_filer NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  evidence_urls TEXT[] DEFAULT '{}',                -- 증빙 이미지/링크 (옵션)
  status dispute_status NOT NULL DEFAULT 'open',
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  refund_amount INT,                                -- 부분환불 시 환불 토큰 수
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_disputes_status ON disputes(status, created_at DESC);
CREATE INDEX idx_disputes_filer ON disputes(filer_id);

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- 본인이 신청한 분쟁만 SELECT, 양쪽 (startup/enabler) 모두 본인 booking의 분쟁 SELECT
CREATE POLICY "disputes_select_party" ON disputes FOR SELECT
  USING (
    auth.uid() = filer_id
    OR EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = disputes.booking_id
        AND (auth.uid() = b.startup_id OR auth.uid() = b.enabler_id)
    )
  );

CREATE POLICY "disputes_insert_party" ON disputes FOR INSERT
  WITH CHECK (
    auth.uid() = filer_id
    AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = disputes.booking_id
        AND (auth.uid() = b.startup_id OR auth.uid() = b.enabler_id)
        AND b.status = 'completed'
    )
  );

-- super_admin은 ALL
CREATE POLICY "disputes_super_admin" ON disputes FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin'));

-- ═══════════════════════════════════════════════════════
-- RPC: 분쟁 환불 처리 (전액 또는 부분)
-- ═══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION resolve_dispute_refund(
  p_dispute_id UUID,
  p_admin_id UUID,
  p_refund_amount INT,        -- 환불할 토큰 수 (전액이면 booking.credits_amount 동일)
  p_notes TEXT DEFAULT '분쟁 환불 처리'
) RETURNS disputes AS $$
DECLARE
  v_dispute disputes;
  v_booking bookings;
  v_balance INT;
  v_status dispute_status;
BEGIN
  SELECT * INTO v_dispute FROM disputes WHERE id = p_dispute_id FOR UPDATE;
  IF v_dispute.id IS NULL THEN RAISE EXCEPTION 'Dispute not found'; END IF;
  IF v_dispute.status NOT IN ('open', 'in_review') THEN
    RAISE EXCEPTION 'Already resolved (status: %).', v_dispute.status;
  END IF;

  SELECT * INTO v_booking FROM bookings WHERE id = v_dispute.booking_id;
  IF p_refund_amount < 0 OR p_refund_amount > v_booking.credits_amount THEN
    RAISE EXCEPTION 'Invalid refund amount (max: %)', v_booking.credits_amount;
  END IF;

  IF p_refund_amount > 0 THEN
    -- startup에게 토큰 환불
    UPDATE startup_profiles
      SET credit_balance = credit_balance + p_refund_amount
      WHERE user_id = v_booking.startup_id
      RETURNING credit_balance INTO v_balance;

    INSERT INTO credit_transactions (
      tx_type, amount, startup_id, enabler_id, booking_id, description, balance_after
    ) VALUES (
      'refund', p_refund_amount, v_booking.startup_id, v_booking.enabler_id, v_booking.id,
      '분쟁 환불 — ' || p_notes, v_balance
    );

    -- Enabler earnings reversal (해당 booking)
    UPDATE enabler_earnings
      SET status = 'reversed', reversed_at = now()
      WHERE booking_id = v_booking.id AND status = 'accrued';
  END IF;

  -- status 분류
  IF p_refund_amount = v_booking.credits_amount THEN
    v_status := 'resolved_refund';
  ELSIF p_refund_amount > 0 THEN
    v_status := 'resolved_partial';
  ELSE
    v_status := 'resolved_dismissed';
  END IF;

  UPDATE disputes
    SET status = v_status,
        resolved_by = p_admin_id,
        resolved_at = now(),
        resolution_notes = p_notes,
        refund_amount = p_refund_amount
    WHERE id = p_dispute_id
    RETURNING * INTO v_dispute;

  RETURN v_dispute;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
