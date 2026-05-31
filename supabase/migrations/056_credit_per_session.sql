-- 056: 크레딧 모델 단순화 — "1 크레딧 = 세션 1회"
--
-- 기획 결정: 세션 종류와 무관하게 유료 세션 1회 = 1 크레딧. Chemistry는 무료(0).
-- 기존: standard=2, project=5 → 카피("1 크레딧 = 세션 1회")와 모순. 정렬.
-- 영향: 예약 API(credit_settings 기반 차감)·매칭 카드(credit_settings 조회)는 자동 반영.
--       전문가별 credit_rate 는 과금 미사용(표시 통일 완료). 환영 크레딧(2)은 이제 '무료 세션 2회' 의미.

UPDATE credit_settings SET credits_required = 1 WHERE session_type = 'standard';
UPDATE credit_settings SET credits_required = 1 WHERE session_type = 'project';
-- chemistry 는 0(무료) 유지
