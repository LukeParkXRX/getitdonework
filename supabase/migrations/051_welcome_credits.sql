-- 051: 신규 스타트업 가입 시 런치 환영 크레딧 자동 지급
--
-- 배경: 첫 오픈 단계에서 결제 모듈 전이고, 가입자가 바로 유료 흐름을 테스트할 수
--       있도록 신규 startup 에게 기본 크레딧을 지급한다.
-- 크레딧 체계: Chemistry(15분)=0크레딧(무료), Standard(60분)=2크레딧.
--   → 2크레딧 = Standard 1회. (15분 체험은 원래 무료라 별도 지급 불필요)
-- 조정: welcome_credits 상수만 바꾸면 됨. 운영 안정화 후 줄이거나 0으로.
-- 적용 범위: 신규 가입자만. 기존 사용자 영향 없음. enabler 는 크레딧 미사용이라 제외.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta_role public.user_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
  welcome_credits CONSTANT INT := 2; -- 런치 환영 크레딧 (Standard 60분 1회분)
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    meta_role
  );

  IF meta_role = 'startup' THEN
    INSERT INTO public.startup_profiles (user_id, credit_balance)
    VALUES (NEW.id, welcome_credits)
    ON CONFLICT (user_id) DO NOTHING;

    -- 거래 기록(allocate) — 추적/감사용
    INSERT INTO public.credit_transactions (tx_type, amount, startup_id, description, balance_after)
    VALUES ('allocate', welcome_credits, NEW.id, '런치 환영 크레딧', welcome_credits);
  ELSIF meta_role = 'enabler' THEN
    INSERT INTO public.enabler_profiles (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed: % %', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;
