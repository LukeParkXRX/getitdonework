-- Fix: 신규 가입 시 역할(role)이 항상 'startup'으로 저장되던 버그
--
-- 원인:
--   006_onboarding_gate 에서 트리거가 role 없이 INSERT 하도록 바꿨으나,
--   users.role 컬럼의 DEFAULT 'startup' 을 제거하지 않아 컬럼 기본값이 적용됨.
--   → 가입 폼이 보낸 메타데이터 role(enabler 등)이 무시되고 전부 startup 으로 저장.
--   → 전문가(enabler) 가입자가 /my(스타트업 홈)로 잘못 랜딩.
--
-- 수정:
--   1) role 컬럼 DEFAULT 제거 (없으면 NULL → 온보딩 역할선택 플로우 유지)
--   2) 트리거: 이메일 가입(메타데이터 role 존재)은 role + 해당 profiles 행 생성,
--      OAuth(role 없음)는 role NULL 유지 → /onboarding/role 로 분기.
--
-- 호환성: 기존 사용자(이미 role 세팅됨) 영향 없음. 신규 가입자만 적용.

-- 1) 컬럼 기본값 제거
ALTER TABLE public.users ALTER COLUMN role DROP DEFAULT;

-- 2) 트리거 재작성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta_role public.user_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
BEGIN
  -- role 은 메타데이터에 있으면 그 값, 없으면 NULL (OAuth → 온보딩에서 선택)
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    meta_role
  );

  -- 역할이 정해진 이메일 가입자는 해당 profile 행도 즉시 생성 (온보딩은 중복 방지)
  IF meta_role = 'startup' THEN
    INSERT INTO public.startup_profiles (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
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
