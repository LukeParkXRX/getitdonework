-- ============================================================
-- 033 funnel views — 분석용 뷰 (직접 집계, INSERT 없음)
-- ============================================================

-- 일별 funnel (최근 30일)
CREATE OR REPLACE VIEW v_daily_funnel AS
SELECT
  date_trunc('day', d.day)::date AS day,
  COALESCE(s.signups, 0)   AS signups,
  COALESCE(p.purchases, 0) AS purchases,
  COALESCE(b.bookings, 0)  AS bookings,
  COALESCE(c.completed, 0) AS completed,
  COALESCE(r.reviews, 0)   AS reviews
FROM (
  SELECT generate_series(
    date_trunc('day', now()) - interval '29 days',
    date_trunc('day', now()),
    interval '1 day'
  ) AS day
) d
LEFT JOIN (
  SELECT date_trunc('day', created_at)::date AS day, COUNT(*) AS signups
  FROM users GROUP BY 1
) s ON s.day = d.day::date
LEFT JOIN (
  SELECT date_trunc('day', paid_at)::date AS day, COUNT(*) AS purchases
  FROM credit_purchases WHERE status = 'paid' GROUP BY 1
) p ON p.day = d.day::date
LEFT JOIN (
  SELECT date_trunc('day', created_at)::date AS day, COUNT(*) AS bookings
  FROM bookings GROUP BY 1
) b ON b.day = d.day::date
LEFT JOIN (
  SELECT date_trunc('day', completed_at)::date AS day, COUNT(*) AS completed
  FROM bookings WHERE status = 'completed' AND completed_at IS NOT NULL GROUP BY 1
) c ON c.day = d.day::date
LEFT JOIN (
  SELECT date_trunc('day', created_at)::date AS day, COUNT(*) AS reviews
  FROM reviews GROUP BY 1
) r ON r.day = d.day::date
ORDER BY d.day;

-- 전체 conversion 카운트 (lifetime)
CREATE OR REPLACE VIEW v_funnel_totals AS
SELECT
  (SELECT COUNT(*) FROM users)                                        AS total_signups,
  (SELECT COUNT(*) FROM credit_purchases WHERE status = 'paid')       AS total_paid_users,
  (SELECT COUNT(DISTINCT startup_id) FROM bookings)                   AS total_booking_users,
  (SELECT COUNT(*) FROM bookings)                                     AS total_bookings,
  (SELECT COUNT(*) FROM bookings WHERE status = 'completed')          AS total_completed,
  (SELECT COUNT(*) FROM reviews)                                      AS total_reviews;

GRANT SELECT ON v_daily_funnel  TO authenticated;
GRANT SELECT ON v_funnel_totals TO authenticated;
