# Deployment Guide

운영 환경 첫 셋업(한 번) + 일상 배포 절차 + 모니터링 가이드

**목차:**
1. [첫 운영 셋업](#1-첫-운영-셋업-한-번만) (10~15분, 한 번만)
2. [일상 배포](#2-일상-배포) (자동)
3. [정식 오픈 체크리스트](#3-정식-오픈-체크리스트)
4. [일상 운영](#4-일상-운영)
5. [환경변수 전체 목록](#5-환경변수-전체-목록)

---

## 1. 첫 운영 셋업 (한 번만)

### 1-1. Vercel 연결

**GitHub 리포 import:**

1. [vercel.com](https://vercel.com) 로그인
2. "New Project" → "Import Git Repository"
3. `github.com/LukeParkXRX/getitdonework` 선택
4. 프로젝트 이름: `getitdonework` (또는 원하는 이름)
5. Framework: **Next.js** (자동 감지됨)
6. Root directory: `/` (기본값)
7. **Build Command**: `bun run build` (자동 감지됨)
8. **Start Command**: `bun start` (자동)
9. **Output Directory**: `.next` (자동)
10. **Install command**: `bun install` (자동)

**도메인 연결:**

1. Project Settings → Domains
2. Add → "Custom Domain"
3. `getitdonework.com` 입력
4. DNS 레코드 추가 (Vercel 가이드 따라):
   - **A 레코드**: `getitdonework.com` → Vercel IP (약 76.76.19.165 등)
   - **CNAME**: `www.getitdonework.com` → `cname.vercel-dns.com.`
5. DNS 전파 대기 (10분~1시간)

---

### 1-2. Supabase 생성 & 마이그레이션

**프로젝트 생성:**

1. [supabase.com](https://supabase.com) 로그인
2. "New project"
3. **Organization**: 본인 계정 또는 팀
4. **Project name**: `getitdonework-prod` (또는 이름)
5. **Region**: `ap-northeast-2` (Seoul, 권장)
6. **Database password**: 강력한 비밀번호 (별도 보관 필수!)
7. Create → 5~10분 대기

**마이그레이션 적용:**

1. Supabase 대시보드 → SQL Editor
2. `supabase/migrations/` 폴더의 SQL 파일들을 **010부터 040까지 순서대로** 실행
   ```
   010_initial_schema.sql
   011_functions.sql
   012_auth_hooks.sql
   ...
   040_webhook_idempotency.sql
   ```

   또는 **Supabase CLI 사용** (권장):
   ```bash
   # 로컬에서
   supabase db push --linked  # 운영 프로젝트 연결 후 실행
   ```

   **중요**: 순서를 지키지 않으면 외래키 에러 발생. 반드시 010→040 순서.

**인증 설정:**

1. Authentication → URL Configuration
   - **Site URL**: `https://getitdonework.com`
   - **Redirect URLs**: (각각 새줄)
     ```
     https://getitdonework.com/auth/callback
     https://getitdonework.com/reset-password
     ```
   - Save

2. Authentication → Providers → Google
   - **Enabled**: ON
   - **Client ID**: `xxx.apps.googleusercontent.com` (Google Cloud Console에서 생성)
   - **Client Secret**: `GOCSPX_xxx` (Google Cloud Console)
   - Save

   > **Google OAuth 설정 방법**: [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0 Client ID (Web application) 생성 → Authorized JavaScript origins: `https://getitdonework.com` & `https://xxx.supabase.co` → Authorized redirect URIs: `https://xxx.supabase.co/auth/v1/callback`

**API Keys 복사:**

1. Settings → API
2. **Project URL**: 복사 (NEXT_PUBLIC_SUPABASE_URL에 사용)
3. **Anon key**: 복사 (NEXT_PUBLIC_SUPABASE_ANON_KEY)
4. **Service role key**: 복사 (SUPABASE_SERVICE_ROLE_KEY, 서버 전용)

---

### 1-3. Resend (이메일)

**계정 생성 & API Key:**

1. [resend.com](https://resend.com) 가입
2. Dashboard → API Keys
3. "Create API Key" → Name: `getitdonework-prod`
4. **API Key**: 복사 (RESEND_API_KEY)

**도메인 인증:**

1. Domains → Add Domain
2. `getitdonework.com` 입력
3. DNS 레코드 추가 (Resend 대시보드의 지침 따라):
   - **CNAME** (메일 인증):
     ```
     dkim._domainkey.getitdonework.com → CNAME: 
     [Resend에서 제공하는 CNAME]
     ```
   - **TXT** (도메인 인증):
     ```
     [Resend에서 제공하는 TXT 레코드]
     ```
   - **MX** (수신 메일, 선택사항):
     ```
     10 aspmx.l.google.com
     20 alt1.aspmx.l.google.com
     (Google Workspace 이메일 수신 시)
     ```
4. "Verify" 버튼으로 DNS 전파 확인 (보통 몇 분)

**발신자 주소:**

1. Verified senders → Add domain complete 후 자동 활성화
2. `noreply@getitdonework.com` 사용 가능
3. `RESEND_FROM=noreply@getitdonework.com` (Vercel env에 설정)

> **도메인 미인증 중**: 임시로 `onboarding@resend.dev`에서 발신. 받는 사람 스팸 폴더 확인 필요.

---

### 1-4. Stripe (결제)

**계정 생성:**

1. [stripe.com](https://stripe.com) 가입
2. Email verification + 국가 설정
3. **사업자 인증**: Activate Your Account
   - 사업자 등록 정보 입력 (1~2주 심사)

**Live Keys 발급 (사업자 인증 후):**

1. Dashboard → Developers → API keys
2. **Secret Key**: `sk_live_xxx` 복사 (STRIPE_SECRET_KEY)
3. **Publishable Key**: `pk_live_xxx` 복사 (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

**Webhooks 설정:**

1. Developers → Webhooks
2. "Add endpoint"
3. **URL**: `https://getitdonework.com/api/webhooks/stripe`
4. **Events to send**:
   ```
   checkout.session.completed
   payment_intent.payment_failed
   charge.refunded
   account.updated (Stripe Connect 이벤트)
   ```
5. "Add endpoint" → Signing secret 복사 (STRIPE_WEBHOOK_SECRET)

**Stripe Connect (Enabler 정산):**

1. Settings → Connect settings
2. "Request to use Connect"
3. **Express account type** 선택
4. 사용 약관 동의 → 1~2일 추가 심사
5. 활성화 후 `account.updated` webhook 수신 시작

---

### 1-5. Sentry (에러 모니터링, 선택사항)

1. [sentry.io](https://sentry.io) 가입
2. Organization → New Project
3. **Framework**: `Next.js`
4. **Alert frequency**: 기본값 유지
5. **Project URL**: `https://sentry.io/organizations/xxx/projects/getitdonework/`
6. **DSN**: 복사 (NEXT_PUBLIC_SENTRY_DSN)
7. **Auth Token**: Settings → Auth Tokens → Generate → 복사 (SENTRY_AUTH_TOKEN)

---

### 1-6. Upstash Redis (Rate limit, 선택사항)

1. [upstash.com](https://upstash.com) 가입
2. Create Database
3. **Name**: `getitdonework-ratelimit`
4. **Region**: `ap-northeast-1` (Tokyo, 가장 가까움)
5. **Type**: Standalone
6. Create
7. **REST API**:
   - **URL**: 복사 (UPSTASH_REDIS_REST_URL)
   - **Token**: 복사 (UPSTASH_REDIS_REST_TOKEN)
   - Vercel Marketplace로 연결하면 `KV_REST_API_URL`, `KV_REST_API_TOKEN` 이름으로 자동 생성될 수 있습니다.

---

### 1-7. Web Push (VAPID 키, 선택사항)

로컬에서 1회 실행 (production도 같은 키 사용):

```bash
bun run scripts/generate-vapid.ts
```

출력:
```
Public Key: BG_xxx
Private Key: xxx
```

저장 위치:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: Public Key
- `VAPID_PRIVATE_KEY`: Private Key (서버 전용, 절대 노출 금지)
- `VAPID_SUBJECT`: `mailto:admin@getitdonework.com`

---

### 1-8. Vercel 환경변수 추가

**Project Settings → Environment Variables**

```env
# === Supabase (필수) ===
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0...
SUPABASE_SERVICE_ROLE_KEY=eyJ0...

# === 앱 설정 ===
NEXT_PUBLIC_APP_URL=https://getitdonework.com
ADMIN_EMAILS=admin@getitdonework.com,luke@xrx.studio,sson@xrx.studio
PAYMENT_SETUP_RECIPIENTS=admin@getitdonework.com,luke@xrx.studio,sson@xrx.studio

# === Resend (이메일) ===
RESEND_API_KEY=re_xxx
RESEND_FROM=noreply@getitdonework.com

# === Stripe ===
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# === Sentry (선택) ===
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=sntrys_xxx
SENTRY_ORG=yourorg
SENTRY_PROJECT=getitdonework

# === GA4 (선택) ===
NEXT_PUBLIC_GA_ID=G-XXXXXXX

# === Upstash Redis (선택) ===
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AAA...
# Vercel Marketplace Upstash 연결 시 자동 생성될 수 있음
KV_REST_API_URL=https://xxx.upstash.io
KV_REST_API_TOKEN=AAA...

# === Cron & 보안 ===
CRON_SECRET=<32자 이상 랜덤 문자열>
UNSUBSCRIBE_SECRET=<32자 이상 랜덤 문자열>
IMPERSONATION_SECRET=<32자 이상 랜덤 문자열>

# === Web Push (선택) ===
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BG_xxx
VAPID_PRIVATE_KEY=xxx
VAPID_SUBJECT=mailto:admin@getitdonework.com
```

**각 변수 추가 후 "Save"**

---

### 1-9. DNS 최종 확인

도메인 레지스트라에서:

```
A     getitdonework.com              76.76.19.165 (Vercel IP)
CNAME www.getitdonework.com          cname.vercel-dns.com
CNAME dkim._domainkey.getitdonework  [Resend CNAME]
TXT   [Resend domain verification]
MX    10 aspmx.l.google.com (Google Workspace 시)
```

---

### 1-10. super_admin 계정 생성

**Supabase SQL Editor에서:**

```sql
-- 운영자 이메일로 회원가입 또는 Google 로그인 후 실행
UPDATE users 
SET role = 'super_admin' 
WHERE email IN ('admin@getitdonework.com', 'luke@xrx.studio');
```

---

## 2. 일상 배포

### 자동 배포 (대부분의 경우)

1. 로컬에서 작업 → commit → push to `main`
2. Vercel 자동 감지 → 빌드 시작 (약 2~3분)
3. Preview 자동 생성 (PR 시)
4. Main 배포 자동 시작
5. 배포 완료 → https://getitdonework.com에 반영

**배포 상태 모니터링:**
- Vercel Dashboard에서 "Deployments" 탭 확인
- 에러 발생 시 로그 클릭 → 에러 메시지 확인

### Supabase 마이그레이션 추가 (데이터 스키마 변경 시)

1. 로컬: `supabase/migrations/041_name.sql` 작성
2. 로컬 Supabase에서 테스트:
   ```bash
   supabase db push
   ```
3. 테스트 통과 → commit & push to `main`
4. Vercel 배포 후, **운영 Supabase SQL Editor에서 해당 SQL 직접 실행**
   - 또는 `supabase db push --linked` (권장)

---

## 3. 정식 오픈 체크리스트

정식 오픈 **24시간 전**에 다음 확인:

- [ ] 모든 마이그레이션 적용 (010~040) — Supabase Logs에서 확인
- [ ] Stripe Live keys 활성화 + webhook 수신 (최근 "account.updated" 이벤트 있는지 확인)
- [ ] Resend 도메인 인증 완료 (Verified ✓) + RESEND_FROM 변경 (`noreply@getitdonework.com`)
- [ ] Sentry DSN 설정 + 테스트 (에러 페이지 방문 후 Sentry에 표시되는지 확인)
- [ ] CRON_SECRET, UNSUBSCRIBE_SECRET, IMPERSONATION_SECRET 모두 강력한 랜덤 문자열 (**32자 이상**)
- [ ] VAPID 키 설정 (Web Push 활성화)
- [ ] `NEXT_PUBLIC_SHOW_TEST_DATA=false` 또는 미설정 (**운영에서는 코드상 무시됨**)
- [ ] 약관/개인정보/환불 페이지 사업자 정보 입력
  - Legal name
  - Address
  - Contact email
- [ ] PWA 아이콘 추가:
  - `public/icon-192.png` (192×192)
  - `public/icon-512.png` (512×512)
- [ ] next.config.ts 이미지 도메인 확인 (Supabase Storage, AWS S3 등)
- [ ] 부하 테스트 1회 통과 (k6) — [docs/LOAD_TESTING.md](./LOAD_TESTING.md) 참고
- [ ] DNS TTL 낮춤 (배포 직전 → 30초, 안정화 후 → 3600초 원복)
- [ ] Uptime 모니터링 설정 (선택, [uptimerobot.com](https://uptimerobot.com) 권장)

---

## 4. 일상 운영

### 마이그레이션 추가

새 기능이 DB 스키마 변경을 필요로 할 때:

```bash
# 1. 로컬에서 작성
cat > supabase/migrations/041_feature_name.sql <<'EOF'
-- 변경사항 기술
ALTER TABLE table_name ADD COLUMN new_column TYPE;
EOF

# 2. 로컬 테스트
supabase db push

# 3. 커밋 & 푸시
git add supabase/migrations/041_feature_name.sql
git commit -m "feat: add feature_name migration"
git push origin main

# 4. 배포 후, 운영 Supabase에서 실행
# (SQL Editor에 파일 내용 복사 + 실행, 또는 supabase db push --linked)
```

### 핫픽스

긴급 버그 수정:

```bash
# 1. 새 브랜치
git checkout -b fix/critical-bug
# 2. 수정 & commit
# 3. PR 생성 → 빠른 리뷰 & approve
# 4. Merge to main
# 5. Vercel 자동 배포
```

**주의**: hotfix도 빌드 성공 필수 (`bun run build`).

### 백업

**자동 백업** (Supabase):
- Free tier: 7일 보관
- Pro tier: 30일 보관

**수동 백업** (월 1회 권장):

```bash
# Supabase에서 SQL dump 다운로드
supabase db pull --db-only > backup-2026-05-06.sql
# 또는 Supabase 대시보드에서 Settings → Backups → Download
```

자세한 정책: [docs/BACKUP_POLICY.md](./BACKUP_POLICY.md)

### 모니터링 & 운영

**Vercel Analytics:**
- Project → Analytics
- 트래픽, 성능 메트릭 확인

**Sentry (에러 추적):**
- Alerts → Issues
- 실시간 에러 감지 및 팀 알림 설정

**Stripe Dashboard:**
- Payments → Transactions (결제 내역)
- Payouts → 매월 Enabler 정산 확인

**/admin 대시보드:**
- `/admin/dashboard` — 30일 KPI (매칭률, 전환율, ARPU)
- `/admin/analytics` — funnel 분석
- `/admin/audit-log` — 운영자 액션 로그
- `/admin/webhooks` — Stripe webhook 이력

---

## 5. 환경변수 전체 목록

| 변수 | 용도 | 필수? | 예시 |
|------|------|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | ✅ | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 공개 키 | ✅ | `eyJ0...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서버 키 | ✅ | `eyJ0...` |
| `NEXT_PUBLIC_APP_URL` | 앱 도메인 | ✅ | `https://getitdonework.com` |
| `ADMIN_EMAILS` | 관리자 알림 이메일 목록 | ✅ | `admin@getitdonework.com,luke@xrx.studio,sson@xrx.studio` |
| `PAYMENT_SETUP_RECIPIENTS` | 결제 셋업 폼 수신 이메일 목록 | ⭕ | `admin@getitdonework.com,luke@xrx.studio,sson@xrx.studio` |
| `RESEND_API_KEY` | Resend API 키 | ⭕ | `re_xxx` |
| `RESEND_FROM` | 발신자 이메일 | ⭕ | `noreply@getitdonework.com` |
| `STRIPE_SECRET_KEY` | Stripe 비밀 키 | ⭕ | `sk_live_xxx` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe 공개 키 | ⭕ | `pk_live_xxx` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook 서명 | ⭕ | `whsec_xxx` |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry 진단 URL | ⭕ | `https://xxx@xxx.ingest.sentry.io/xxx` |
| `SENTRY_AUTH_TOKEN` | Sentry 인증 토큰 | ⭕ | `sntrys_xxx` |
| `SENTRY_ORG` | Sentry 조직명 | ⭕ | `yourorg` |
| `SENTRY_PROJECT` | Sentry 프로젝트명 | ⭕ | `getitdonework` |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 추적 ID | ⭕ | `G-XXXXXXX` |
| `UPSTASH_REDIS_REST_URL` 또는 `KV_REST_API_URL` | Redis REST 엔드포인트 | ⭕ | `https://xxx.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` 또는 `KV_REST_API_TOKEN` | Redis REST 토큰 | ⭕ | `AAA...` |
| `CRON_SECRET` | Cron 호출 인증 토큰 | ✅ | `<32자 랜덤>` |
| `UNSUBSCRIBE_SECRET` | 이메일 구독 해제 토큰 | ✅ | `<32자 랜덤>` |
| `IMPERSONATION_SECRET` | 관리자 impersonation 토큰 | ✅ | `<32자 랜덤>` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push 공개 키 | ⭕ | `BG_xxx` |
| `VAPID_PRIVATE_KEY` | Web Push 비밀 키 | ⭕ | `xxx` |
| `VAPID_SUBJECT` | Web Push 발신자 | ⭕ | `mailto:admin@getitdonework.com` |
| `NEXT_PUBLIC_SHOW_TEST_DATA` | 비운영 테스트 데이터 표시 | ⭕ | `false` |

**범례:**
- ✅ 필수 (기능 작동)
- ⭕ 선택 (해당 기능 비활성화 가능)

---

## 🚨 배포 문제 해결

### Vercel 빌드 실패

**TypeScript 에러:**
```bash
# 로컬에서 확인
bun run build
# 에러 메시지 읽고 수정
```

**Dependencies 없음:**
- `bun.lock` 삭제 후 Vercel Redeploy

### Supabase 마이그레이션 에러

**"relation does not exist":**
- 이전 마이그레이션이 적용 안 됨. SQL Editor에서 누락된 파일 실행.

**"constraint violation":**
- 기존 데이터와 충돌. SQL 생성 단계를 staging Supabase에서 테스트 후 운영 적용.

### Stripe webhook 수신 실패

1. Stripe Dashboard → Webhooks → Recent attempts
2. 실패 항목 클릭 → 상세 에러 읽기 (보통 URL 오류, signing secret 오류)
3. `/admin/webhooks` 페이지에서 수신 이력 확인

---

## 📞 지원

배포 문제 발생:
1. [docs/TROUBLESHOOTING.md](./TROUBLESHOOTING.md) 먼저 확인
2. Vercel/Supabase/Stripe 대시보드 로그 확인
3. admin@getitdonework.com 또는 GitHub Issues
