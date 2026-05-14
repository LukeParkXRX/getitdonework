# Troubleshooting Guide

흔한 오류·이슈와 해결법. **문제 발생 시 먼저 여기를 읽으세요.**

**빠른 네비게이션:**
- [페이지 오류](#페이지-오류) — UI 렌더링, 네비게이션 문제
- [API & 통신](#api--통신) — 요청 실패, 타임아웃
- [인증 & 세션](#인증--세션) — 로그인, 권한 오류
- [결제](#결제) — Stripe 관련
- [이메일](#이메일) — 메일 전송 실패
- [채팅 & 실시간](#채팅--실시간) — 메시지 동기화, WebSocket
- [다국어](#다국어) — 언어 감지, 전환
- [데이터베이스](#데이터베이스) — RLS, 마이그레이션
- [배포](#배포) — 빌드, 환경변수
- [Cron](#cron) — 자동화 작업 실행 안 됨
- [성능](#성능) — 느린 로딩, 메모리 누수

---

## 페이지 오류

### `Could not find the table 'public.xxx' in the schema cache`

**원인**: Supabase 테이블이 존재하지 않음 (마이그레이션 미적용)

**해결:**
1. Supabase 대시보드 → SQL Editor 열기
2. `supabase/migrations/` 폴더에서 해당 테이블을 생성하는 SQL 파일 찾기
   - 예: `users` 테이블 → `010_initial_schema.sql`
3. 010부터 040까지 **순서대로** 실행 (미적용된 것부터)
4. 실행 후 5~10분 정도 기다림 (schema cache 갱신)
5. 페이지 새로고침

**예시:**
```sql
-- SQL Editor에 복사해서 실행
\i 010_initial_schema.sql
\i 011_functions.sql
... (040까지)
```

---

### `/login` 진입 시 자동 redirect되거나 TestLoginPanel 안 보임

**원인**: 베타 모드가 비활성화됨

**해결:**
1. Vercel Project Settings → Environment Variables
2. `NEXT_PUBLIC_SHOW_TEST_DATA` 찾기
3. 없으면 **Add** → Name: `NEXT_PUBLIC_SHOW_TEST_DATA`, Value: `true`
4. "Save" → "Redeploy" 클릭
5. 배포 완료 후 (약 2분) `/login` 새로고침

---

### `500 Internal Server Error` / 흰색 에러 페이지

**원인**: 서버 에러 (환경변수 누락, 함수 오류 등)

**해결:**
1. **브라우저 개발자 도구** (F12) → Console 탭 확인
2. **Vercel Logs**: Project → Deployments → 현재 배포 → Logs 탭
3. **에러 메시지 읽기** — 어느 단계에서 실패했는지 확인
4. 일반적인 원인:
   - `NEXT_PUBLIC_SUPABASE_URL` 미설정 → DEPLOY.md 섹션 1-8 참고
   - Supabase 마이그레이션 미적용 → 위의 "테이블 찾을 수 없음" 참고
   - 환경변수 변경 후 Redeploy 안 함 → Vercel에서 "Redeploy" 클릭

---

### `Page not found (404)` / 404 페이지

**원인**: 라우트 경로 오류 또는 권한 부족

**확인:**
1. 주소창의 URL 확인 (타이포 없는지)
2. 권한 부족이 아닌지 (예: `/admin` 페이지는 super_admin만)
3. 페이지가 실제로 구현되어 있는지 (src/app에서 폴더 구조 확인)

**관리자 페이지 접근 안 됨:**
```sql
-- Supabase SQL Editor에서 현재 사용자의 role 확인
SELECT email, role FROM users WHERE email = 'your@email.com';

-- super_admin으로 변경
UPDATE users SET role = 'super_admin' WHERE email = 'your@email.com';
```

---

### 스타일이 적용되지 않음 / 레이아웃 깨짐

**원인**: Tailwind CSS 또는 CSS 변수 로드 실패

**해결:**
1. 브라우저 캐시 삭제 (Ctrl+Shift+Delete 또는 Cmd+Shift+Delete)
2. Vercel 환경변수 다시 확인 (변수 변경 후 Redeploy 필수)
3. `next.config.ts`의 Tailwind 설정 확인

---

## API & 통신

### `429 Too Many Requests`

**원인**: Rate limit 초과

**해결:**
1. **잠시 대기** (보통 1~5분)
2. 비정상적인 요청 패턴 확인 (루프, 자동화 도구 등)
3. Upstash Redis 설정 확인 (rate limit 정책은 `src/lib/ratelimit.ts`에 정의)

---

### `401 Unauthorized` / 인증 실패

**원인**: Supabase 세션 만료 또는 토큰 오류

**해결:**
1. 재로그인 (`/login`)
2. 여전히 안 되면:
   ```bash
   # 로컬 개발 시
   rm -rf .next  # Next.js 캐시 삭제
   bun run dev   # 다시 시작
   ```
3. 운영 환경:
   - Supabase → Settings → Security → Sessions 확인
   - 세션 타임아웃 정책 검토

---

### `403 Forbidden` / 권한 부족

**원인**: RLS 정책 또는 role 권한 부족

**확인:**
1. **RLS 정책**: Supabase 대시보드 → Tables → 각 테이블의 RLS 설정
   - `SELECT` 정책이 현재 role에 허용하는지 확인
2. **Role 확인**:
   ```sql
   SELECT role FROM users WHERE id = 'current_user_id';
   ```
3. **Service role 테스트**: service role로는 RLS bypass됨. 사용자 세션과 함께 테스트하기.

---

### API 응답이 너무 느림 (timeout)

**원인**: 느린 쿼리, 대용량 응답, 네트워크 지연

**해결:**
1. **쿼리 최적화**:
   ```sql
   -- 인덱스 확인
   SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public';
   
   -- 느린 쿼리 로그 활성화
   -- Supabase Settings → Database → Logs
   ```
2. **응답 크기 줄이기**: pagination 적용, 불필요한 필드 제외
3. **Vercel Functions 메모리 증가** (고급): project.json에서 memory 설정

---

## 인증 & 세션

### `User not found` 에러

**원인**: Supabase users 테이블에 사용자 없음

**해결:**
1. 마이그레이션 적용 확인 (`010_initial_schema.sql` 실행)
2. `SUPABASE_SERVICE_ROLE_KEY` 올바른지 확인
3. 회원가입 후 users 테이블에 데이터 있는지:
   ```sql
   SELECT COUNT(*) FROM users;
   ```

---

### Google OAuth 로그인 실패 / `redirect_uri_mismatch`

**원인**: Google Cloud Console 설정과 Supabase 리다이렉트 URL 불일치

**해결:**
1. Google Cloud Console (console.cloud.google.com)
2. APIs & Services → Credentials → OAuth 2.0 Client ID (Web application)
3. **Authorized redirect URIs** 확인:
   ```
   https://YOUR_SUPABASE_URL/auth/v1/callback
   ```
   예: `https://xxx.supabase.co/auth/v1/callback`
4. **Authorized JavaScript origins**:
   ```
   https://getitdonework.com
   https://xxx.supabase.co
   ```
5. Save → Supabase도 동일하게 설정 확인

---

### 세션 쿠키 오류 / "Secure cookies require HTTPS"

**원인**: 로컬 개발에서 secure cookies 강제

**해결:**
1. 로컬 개발: `localhost`는 HTTPS 미필요 (일반적으로 자동 무시)
2. 여전히 오류면:
   ```bash
   # .env.local에 추가
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODE_ENV=development
   ```

---

## 결제

### 결제 페이지 진입 시 `503 Service Unavailable` 또는 "현재 점검 중"

**원인**: Stripe 키 미설정 또는 invalid

**해결:**
1. Vercel Environment Variables 확인:
   - `STRIPE_SECRET_KEY` (sk_live_xxx 또는 sk_test_xxx)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_live_xxx 또는 pk_test_xxx)
2. 키가 맞는지 Stripe Dashboard에서 다시 복사
3. 변수 저장 후 **Vercel에서 "Redeploy" 클릭**

---

### Stripe webhook 수신 실패 (결제는 되지만 토큰 안 줌)

**원인**: webhook endpoint 미설정 또는 signing secret 불일치

**해결:**
1. Stripe Dashboard → Developers → Webhooks
2. Endpoint 확인:
   - **URL**: `https://getitdonework.com/api/webhooks/stripe` (정확히 이대로)
   - **Events**: `checkout.session.completed` 포함
3. **Signing secret** 복사 → Vercel `STRIPE_WEBHOOK_SECRET`에 입력
4. Redeploy 후, 작은 금액으로 테스트 결제
5. Stripe Dashboard → Webhooks → Recent attempts에서 "Delivered ✓" 확인

**Webhook 테스트:**
```bash
# 로컬에서
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# 다른 터미널
stripe trigger checkout.session.completed
```

---

### 환불 후 토큰이 회수 안 됨

**원인**: 마이그레이션 016 미적용 또는 사용자가 이미 토큰 사용함

**해결:**
1. 마이그레이션 016 (`016_refund_rpc.sql`) 적용 확인
2. SQL에서 환불 함수 확인:
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_name LIKE '%refund%';
   ```
3. 사용자가 이미 토큰을 사용했으면 회수 불가 (정책상 의도)

---

### Stripe Connect (Enabler 정산) 작동 안 함

**원인**: Connect Express 활성화 미완료 또는 webhook 미설정

**해결:**
1. Stripe Dashboard → Settings → Connect settings → Express 활성화 확인
2. 가맹점 활성화 이후 3일 정도 경과 확인
3. `account.updated` webhook 수신 이력:
   - Stripe Dashboard → Webhooks → 최근 이벤트에서 `account.updated` 있는지 확인
4. `/admin/webhooks` 페이지에서 수신 기록 확인

---

## 이메일

### 메일이 도착하지 않음

**원인**: API key, 도메인 미인증, RESEND_FROM 오류 등

**해결 순서:**

1. **RESEND_API_KEY 확인**:
   - Vercel Environment Variables에서 입력 확인
   - Resend 대시보드 → API Keys에서 올바른 키 복사

2. **Resend 로그 확인**:
   - Resend 대시보드 → Logs
   - 최근 발송 항목 클릭 → 상세 에러 읽기
   - 일반적 에러:
     - `invalid_from_address`: RESEND_FROM이 검증되지 않음
     - `invalid_email`: 받는 사람 이메일 형식 오류
     - `rate_limit`: 분당 발송 한도 초과

3. **도메인 인증 확인**:
   - Resend 대시보드 → Domains
   - `getitdonework.com` 상태: "Verified" ✓ 확인
   - 미인증 시 DNS 레코드 추가 (Resend 가이드 따라)

4. **RESEND_FROM 값 확인**:
   - 미인증 도메인: `onboarding@resend.dev` 사용 (받는 사람 스팸 폴더 확인)
   - 인증 후: `noreply@getitdonework.com` (또는 인증된 도메인의 다른 주소)

5. **스팸 폴더 확인**:
   - 메일이 발송되었지만 스팸 폴더로 갔을 수 있음
   - SPF/DKIM/DMARC 레코드가 모두 설정되었는지 Resend에서 확인

---

### 테스트 이메일 발송하기

```bash
# API로 직접 테스트
curl -X POST https://api.resend.com/emails \
  -H 'Authorization: Bearer re_YOUR_KEY' \
  -d '{"from":"noreply@getitdonework.com","to":"test@example.com","subject":"Test","html":"<h1>Hello</h1>"}'
```

---

## 채팅 & 실시간

### 채팅 메시지가 실시간 갱신 안 됨 (refresh 하면 보임)

**원인**: Supabase Realtime subscription 미설정 또는 RLS 차단

**해결:**

1. **Realtime 활성화 확인**:
   - Supabase 대시보드 → Database → Replication
   - `messages` 테이블 활성화 ✓
   - `conversations` 테이블 활성화 ✓

2. **RLS 정책 확인**:
   - Database → Tables → `messages` → RLS
   - SELECT 정책이 대화 참여자에게만 허용하는지 확인
   - migration 013 (`013_messaging.sql`) 적용 확인

3. **브라우저 콘솔에서 WebSocket 확인**:
   ```javascript
   // F12 → Console에서 실행
   // 정상 연결 확인
   supabaseClient.channel('realtime').subscribe()
   ```

4. **클라이언트 코드 확인**:
   - `src/lib/supabase/client.ts`에서 `onAuthStateChange` 설정
   - subscription cleanup 확인 (memory leak 방지)

---

### "Socket closed with code 1000"

**원인**: WebSocket 연결 종료 (정상적인 경우도 있음)

**확인:**
- 1회면 정상 (reconnect 자동)
- 반복되면 네트워크 문제 (모뎀 재시작, VPN 확인)

---

## 다국어

### 다국어 자동 감지가 안 됨

**원인**: Vercel geo header 부족 또는 로컬 개발 환경

**상황별 해결:**

1. **로컬 개발 (VPN 없음)**:
   - IP 지역 감지 미지원
   - Accept-Language 헤더 사용 (브라우저 언어 설정)
   - 또는 LocaleSwitcher에서 수동 전환

2. **운영 환경 (Vercel)**:
   - `geolocation` header 자동 제공
   - CloudFlare 또는 이중 프록시 차단 시 작동 안 할 수 있음

3. **강제 변경**:
   - 헤더에 LocaleSwitcher 있음 (한국어/English)
   - 선택 후 쿠키에 저장됨

---

## 데이터베이스

### RLS 정책으로 silent null 반환 (에러 안 남, 그냥 데이터 없음)

**원인**: SELECT 권한 없음

**확인:**
1. 본인이 해당 테이블의 행에 SELECT 권한 있는지
   ```sql
   SELECT * FROM information_schema.table_privileges 
   WHERE table_name = 'your_table';
   ```
2. Service role로 테스트할 때: service_role은 RLS bypass → 사용자 세션도 함께 테스트
3. RLS 정책 다시 읽기 (조건이 맞는지)

---

### 마이그레이션 적용 후 "query failed: relation does not exist"

**원인**: 마이그레이션 실행 순서 잘못됨

**확인:**
1. 어느 테이블이 없는지 에러 메시지 읽기
2. 그 테이블을 생성하는 마이그레이션 찾기 (보통 010~015)
3. 누락된 모든 마이그레이션을 010부터 순서대로 실행

---

### 외래키 제약 조건 위반

**원인**: 참조하는 행이 없음

**예:**
```
ERROR: insert or update on table "bookings" violates 
foreign key constraint "bookings_user_id_fkey"
```

**해결:**
1. 부모 테이블(users)에 해당 id가 있는지 확인
2. 데이터 삽입 순서 확인 (부모 먼저, 자식 나중)

---

## 배포

### `bun run build` 실패

**TypeScript 에러:**
```bash
error TS2339: Property 'xxx' does not exist
```

**해결:**
1. 에러 메시지의 파일과 줄 번호 확인
2. 해당 파일 열기 → 오류 수정
3. `bun run build` 재시도

**의존성 에러:**
```bash
error Module not found: Can't resolve 'xxx'
```

**해결:**
1. `bun install` 재실행
2. `bun.lock` 삭제 후 `bun install`

---

### Vercel 배포 빌드 실패 (로컬은 OK)

**원인**: 환경변수 빌드 타임에 필요 또는 Node.js 버전 차이

**해결:**
1. **환경변수 확인**:
   - `NEXT_PUBLIC_*`로 시작하는 변수는 빌드 시점에 필요
   - Vercel Environment Variables 확인 후 Redeploy
2. **Node.js 버전**:
   - Vercel 대시보드 → Settings → Build & Development Settings
   - Node.js Version 확인 (20.x 권장)

---

### Sentry source map 업로드 실패

**원인**: SENTRY_AUTH_TOKEN 미설정 (선택사항이라 무시 가능)

**해결:**
- Sentry를 사용하지 않으면 무시
- 사용하려면 Sentry Dashboard → Settings → Auth Tokens → Generate

---

## Cron

### Cron 작업이 실행되지 않음

**원인**: CRON_SECRET 미설정, Vercel 설정 오류, 또는 schedule 부분 값 오류

**확인:**

1. **Vercel Cron Jobs 등록 확인**:
   - Project Settings → Cron Jobs
   - Job 나열되어 있는지 확인

2. **CRON_SECRET 설정**:
   ```bash
   # Vercel Environment Variables
   CRON_SECRET=<32자 이상 랜덤 문자열>
   ```
   - 설정 후 Redeploy

3. **Schedule 형식**:
   - `0 2 * * *` (매일 2시) — 올바름
   - `2` (숫자만) — 오류
   - [Cron format](https://crontab.guru) 검증

4. **로그 확인**:
   - Vercel Project → Deployments → Logs
   - `POST /api/cron/...` 요청 있는지 확인

---

### Cron 실행 후 오류 (기록은 있는데 작동 안 함)

**원인**: 함수 내 에러

**확인:**
1. Vercel Logs에서 해당 cron job 클릭 → Response 읽기
2. 스택 트레이스 파악 후 `src/app/api/cron/` 파일 수정
3. Redeploy

---

## 성능

### 페이지 로딩 느림 (TTFB, LCP 높음)

**원인**: 느린 쿼리, 대용량 번들, 이미지 미최적화 등

**해결:**

1. **이미지 최적화**:
   - `<Image>` 컴포넌트 사용 (Next.js 내장)
   - `next/image`에서 `priority`, `sizes` 설정
   - WebP 포맷 권장

2. **코드 분할 (dynamic import)**:
   ```javascript
   const HeavyComponent = dynamic(() => import('./heavy'), { 
     loading: () => <Skeleton /> 
   });
   ```

3. **Vercel Analytics 확인**:
   - Project → Analytics
   - TTFB, FCP, LCP 메트릭 읽기

4. **Supabase 쿼리 최적화**:
   ```sql
   -- 인덱스 추가
   CREATE INDEX idx_users_role ON users(role);
   ```

---

### 메모리 누수 / 과다한 메모리 사용

**원인**: cleanup 누락, 무한 loop, 큰 캐시

**확인:**
1. 브라우저 DevTools → Performance 탭 → Memory profiler
2. Supabase realtime subscription cleanup:
   ```javascript
   useEffect(() => {
     const subscription = supabase
       .channel('messages')
       .on('*', () => { /* ... */ })
       .subscribe();
     
     return () => {
       subscription.unsubscribe(); // ← cleanup 중요
     };
   }, []);
   ```

---

### 무한 로딩 / 응답 타임아웃

**원인**: 쿼리 hang, circular dependency, deadlock

**확인:**
1. Network 탭에서 요청 상태 (pending, cancelled 등)
2. Supabase SQL Editor에서 `pg_stat_activity` 확인:
   ```sql
   SELECT pid, usename, application_name, state, query 
   FROM pg_stat_activity 
   WHERE state != 'idle';
   ```
3. long-running query 있으면 cancel: `SELECT pg_terminate_backend(pid);`

---

## 추가 도움말

### 문제를 분명히 하기 위해 수집할 정보

GitHub Issue 또는 이메일 보낼 때:

1. **에러 메시지** (정확히 복사)
2. **스크린샷** (UI 오류 시)
3. **재현 단계** (어떤 행동을 했는지)
4. **환경**: 로컬 / 운영 / 스테이징
5. **브라우저**: Chrome / Safari / Firefox + 버전
6. **Vercel/Supabase Logs** (발췌)

### 외부 문서

- [Supabase 문서](https://supabase.com/docs)
- [Stripe API 문서](https://stripe.com/docs/api)
- [Resend 문서](https://resend.com/docs)
- [Vercel 배포](https://vercel.com/docs)
- [Next.js 문서](https://nextjs.org/docs)

### 연락처

여전히 해결 안 되면:
- **이메일**: luke@xrx.studio
- **GitHub Issues**: https://github.com/LukeParkXRX/getitdonework/issues

문제 제목: `[Issue Type] 간단한 설명`  
예: `[Bug] Stripe webhook 받지 못함`, `[Question] Realtime 메시지 지연`
