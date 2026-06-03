-- 058: users 테이블 anon(로그아웃) 컬럼 권한 제한 — 이메일/2FA 등 민감 정보 노출 차단
--
-- 문제: 001_initial_schema.sql:193 의 users_select 정책이 USING (true) 라,
--   RLS 상으로 모든 행 SELECT 허용. Supabase 기본 GRANT 로 anon 역할이 전체 컬럼 SELECT 가능.
--   → 익명(로그아웃) 요청이 anon 키로 `SELECT email, two_factor_enabled, ... FROM users` 전체 덤프 가능.
--     이메일/2FA 상태/알림설정 등 민감 정보 internet-facing 노출. (최고 심각도)
--
-- 핵심: createServerSupabaseClient 는 anon 키를 쓰지만, 로그인 사용자는 JWT 로 `authenticated`
--   역할로 승격됨. 따라서 anon 컬럼 권한 회수는 "로그아웃 방문자"에만 영향.
--   로그인 사용자(본인 프로필 email 읽기 등)·관리자(service_role)·앱 내부 읽기는 영향 없음.
--
-- 공개 페이지가 anon 으로 실제 읽는 users 컬럼 (근거):
--   - src/app/page.tsx:48                      users!inner ( full_name, avatar_url, is_test )
--   - src/app/(public)/enablers/page.tsx:62    users!inner ( full_name, avatar_url, role, is_test )
--   - src/app/(public)/enablers/page.tsx:121   users!inner ( is_test, role )
--   - src/app/(public)/search/page.tsx:69      users!inner ( full_name, avatar_url )
--   - src/app/(public)/credits/page.tsx:29     users.role  → if(user) 가드 안이라 authenticated 역할
--
-- 수정: anon 의 users 전체 SELECT 회수 후, 공개 표시에 필요한 비민감 컬럼만 재허용.
--   (id 는 조인/키 용도로 비민감. role/full_name/avatar_url/is_test 는 공개 enabler 표시에 필요)
--
-- 참고(후속): "authenticated 사용자가 타인 email 조회 가능"(USING true)은 별도 행단위 정책 강화 과제.
--   본 마이그레이션은 익명 노출(최고 심각도)만 차단.

REVOKE SELECT ON public.users FROM anon;
GRANT SELECT (id, full_name, avatar_url, role, is_test) ON public.users TO anon;
