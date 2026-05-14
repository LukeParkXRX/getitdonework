# Get It Done at Work

> 한국 스타트업의 미국 진출 파트너 — US Market Enabler 1:1 매칭 플랫폼

**도메인**: https://getitdonework.com  
**리포**: https://github.com/LukeParkXRX/getitdonework  
**문의**: luke@xrx.studio

---

## ✨ 주요 기능

- **1:1 매칭**: 한국 스타트업 ↔ 미국 MBA Enabler (파트너) 자동 매칭
- **Chemistry Call**: 15분 무료 상담 (자동 배분)
- **결제 세션**: Standard / Project 종류별 토큰 기반 결제 (Stripe)
- **Enabler 정산**: Stripe Connect Express로 USD 자동 입금
- **실시간 메시징**: Supabase Realtime 기반 1:1 채팅
- **멀티채널 알림**: 인앱 + 이메일 (Resend) + Web Push (VAPID)
- **자동 다국어**: IP 지역 감지 → 한국(ko) / 미국(en) 자동 선택
- **관리자 도구**:
  - Dispute 처리 및 사용자 관리
  - 공지사항 발송 (알림 + 이메일 + Push)
  - 30일 KPI funnel (매칭률, 전환율, ARPU)
  - 활동 로그 및 감사(audit) 추적
  - 글로벌 사용자/세션 검색
  - Stripe webhook 수신 이력

---

## 🛠 기술 스택

| 계층 | 기술 |
|------|------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS |
| **Backend** | Supabase (Postgres + Auth + Realtime + Storage) |
| **결제** | Stripe API + Stripe Connect Express |
| **이메일** | Resend (도메인 기반 발신) |
| **음성/영상** | LiveKit (화상 상담) |
| **모니터링** | Sentry (에러 추적, 선택사항) |
| **분석** | GA4 (이벤트, 선택사항) |
| **캐시/Rate limit** | Upstash Redis (선택사항) + in-memory fallback |
| **배포** | Vercel (auto-deploy on main) |
| **빌드 도구** | Bun (npm/pnpm 미권장), Turbopack |
| **테스트** | Playwright E2E, Storybook |
| **Cron** | Vercel Cron Jobs |

---

## 🚀 로컬 개발 시작

### 요구사항
- **Node.js** 20+ 또는 **Bun** (권장)
- **Git**

### 1. 클론 & 의존성 설치

```bash
git clone https://github.com/LukeParkXRX/getitdonework
cd getitdonework
bun install
```

### 2. 환경변수 설정

```bash
cp .env.example .env.local
```

`.env.local`에 필수 항목 입력:

```env
# Supabase (필수)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# 앱 기본설정
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=you@example.com

# Resend (이메일 활성화)
RESEND_API_KEY=re_xxx
RESEND_FROM=noreply@yourdomain.com

# Stripe (결제 활성화)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# 선택사항
NEXT_PUBLIC_SHOW_TEST_DATA=true    # 베타 모드 (로그인 테스트 UI 활성화)
SENTRY_DSN=https://...             # 에러 모니터링
NEXT_PUBLIC_GA_ID=G-...            # Google Analytics
```

완전한 변수 목록: [docs/DEPLOY.md](./docs/DEPLOY.md) 참고

### 3. Supabase 설정

로컬 개발 또는 클라우드 Supabase 사용:

**클라우드 사용 시:**
1. [supabase.com](https://supabase.com) 가입 후 프로젝트 생성
2. SQL Editor에서 `supabase/migrations/` 폴더의 010~040 SQL 순서대로 실행
3. 생성된 URL과 API Key를 `.env.local`에 입력

**로컬 개발 시:**
```bash
supabase start  # Docker 필요, Supabase CLI 설치 필수
```

### 4. 개발 서버 실행

```bash
bun run dev
# http://localhost:3000 자동 오픈
```

**테스트 계정으로 빠르게 시작** (베타 모드):
- `NEXT_PUBLIC_SHOW_TEST_DATA=true` 설정 후
- `/login` 페이지에서 `TestLoginPanel` 클릭
- 사전 정의된 테스트 계정으로 로그인

---

## 📋 주요 명령어

```bash
# 개발
bun run dev             # 개발 서버 (Turbopack with HMR)
bun run build           # production 빌드
bun run start           # production 모드 실행

# 품질 관리
bun run lint            # ESLint (TypeScript 검사)
bun run e2e             # Playwright E2E 테스트 실행
bun run e2e:ui          # E2E 테스트 UI 모드 (시각적 디버깅)
bun run storybook       # Storybook 컴포넌트 문서 (포트 6006)

# 데이터 (개발 전용)
bun run seed:test       # 테스트 데이터 주입
bun run seed:clear      # 테스트 데이터 제거
bun run seed:reset      # 전체 초기화 후 테스트 데이터 재주입
```

---

## 🗂 프로젝트 구조

```
src/
├── app/
│   ├── (admin)/admin/           # super_admin 전용 페이지 (15+)
│   │   ├── dashboard            # KPI 대시보드
│   │   ├── users                # 사용자 관리 & 검색
│   │   ├── disputes             # 분쟁 처리
│   │   ├── broadcasts           # 공지사항 발송
│   │   └── ...
│   ├── (auth)/                  # 인증 페이지
│   │   ├── login
│   │   ├── signup
│   │   ├── forgot-password
│   │   └── reset-password
│   ├── (dashboard)/             # Startup 사용자
│   ├── (enabler)/               # Enabler 사용자
│   ├── (org)/                   # 조직 어드민
│   ├── (public)/                # 공개 페이지
│   │   ├── home
│   │   ├── pricing
│   │   ├── careers
│   │   ├── terms
│   │   ├── privacy
│   │   └── refund-policy
│   ├── api/                     # 60+ API 라우트
│   │   ├── auth/
│   │   ├── bookings/
│   │   ├── payments/
│   │   ├── webhooks/
│   │   └── ...
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Index (리다이렉트)
│   └── error.tsx                # Global error boundary
├── components/
│   ├── ui/                      # 기본 UI 컴포넌트 (button, input, etc)
│   ├── layout/                  # 레이아웃 (header, nav, sidebar)
│   ├── dashboard/               # 대시보드 전용
│   └── admin/                   # 관리자 전용
├── lib/
│   ├── emails/templates/        # Resend 이메일 템플릿 (12종)
│   ├── supabase/
│   │   ├── client.ts            # Supabase 클라이언트
│   │   ├── server.ts            # 서버 전용 client
│   │   ├── middleware.ts        # Next.js middleware
│   │   └── service.ts           # Service role helper
│   ├── stripe/                  # Stripe 유틸리티
│   ├── auth/                    # 인증 헬퍼
│   └── utils.ts                 # 범용 유틸리티
├── messages/                    # next-intl 다국어
│   ├── ko.json                  # 한국어 메시지
│   └── en.json                  # 영어 메시지
├── i18n/
│   ├── routing.ts               # 다국어 라우팅
│   └── request.ts               # 요청 객체
└── middleware.ts                # 인증 + 다국어 감지

supabase/
├── migrations/                  # 010~040 SQL 마이그레이션 (순서 중요)
├── functions/                   # Edge Functions (선택사항)
└── seed.sql                     # 초기 데이터 (not used in prod)

docs/
├── API.md                       # API 라우트 명세
├── DEPLOY.md                    # 운영 배포 가이드 (★ 필독)
├── TROUBLESHOOTING.md           # 흔한 이슈 & 해결법 (★ 필독)
├── BACKUP_POLICY.md             # 백업·복구 정책
├── LOAD_TESTING.md              # k6 부하 테스트
├── PARTNER_TEST_GUIDE_2026-05.md # 베타 테스터 가이드
├── PAYMENT_SETUP_INFO.md        # Stripe 가맹 정보
└── TEST_DATA.md                 # 테스트 데이터 스키마

tests/
├── e2e/                         # Playwright E2E 시나리오
└── load/                        # k6 부하 테스트

public/
├── fonts/                       # Instrument Sans, Inter
├── icons/                       # PWA 아이콘
└── ...

.storybook/                     # Storybook 설정
playwright.config.ts           # E2E 설정
next.config.ts                 # Next.js 설정
tsconfig.json                  # TypeScript 설정 (strict mode)
```

---

## 🎨 디자인 시스템

**단일 진실**: [DESIGN.md](./DESIGN.md)

### 핵심 규칙
- **테마**: 다크 모드 (검정 배경)
- **액센트 색상**: 라임 그린 (`#d4f000`, `var(--color-lime)`)
- **타이포그래피**: Instrument Sans (헤딩), Inter (본문)
- **스타일 기법**: Tailwind CSS + CSS 변수 (`var(--color-*)`) + inline style 혼합
- **그리드**: 12칼럼, rem 단위 (모바일 우선)

컴포넌트 개발 시 항상 DESIGN.md 먼저 확인하세요.

---

## 📚 추가 문서

**신입 개발자 체크리스트:**

1. ✅ **이 README** — 프로젝트 전체 개요
2. ✅ **[DESIGN.md](./DESIGN.md)** — 디자인 시스템 (UI 개발 전 필독)
3. ✅ **[docs/API.md](./docs/API.md)** — 60+ API 라우트 명세
4. ✅ **[docs/DEPLOY.md](./docs/DEPLOY.md)** — 첫 운영 셋업 + 일상 배포 (운영팀 필독)
5. ✅ **[docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)** — 흔한 이슈 & 해결법 (문제 발생 시 먼저 읽기)

**추가 참고:**

| 문서 | 목적 |
|------|------|
| [docs/BACKUP_POLICY.md](./docs/BACKUP_POLICY.md) | 백업·복구 정책 및 운영 가이드 |
| [docs/LOAD_TESTING.md](./docs/LOAD_TESTING.md) | k6 부하 테스트 (배포 전 검증) |
| [docs/PARTNER_TEST_GUIDE_2026-05.md](./docs/PARTNER_TEST_GUIDE_2026-05.md) | 베타 테스터용 가이드 |
| [docs/PAYMENT_SETUP_INFO.md](./docs/PAYMENT_SETUP_INFO.md) | Stripe 가맹점 정보 요청 |
| [docs/TEST_DATA.md](./docs/TEST_DATA.md) | 테스트 데이터 스키마 |

---

## 🔐 환경변수 체크리스트

로컬 개발 필수:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# 앱
NEXT_PUBLIC_APP_URL=http://localhost:3000 (로컬) 또는 https://getitdonework.com (배포)
ADMIN_EMAIL=

# 테스트 활성화 (베타 모드)
NEXT_PUBLIC_SHOW_TEST_DATA=true
```

운영 배포 시 추가로 필요한 모든 변수: **[docs/DEPLOY.md](./docs/DEPLOY.md)** 섹션 1-8 참고

---

## ⚠️ 자주 하는 실수

1. **환경변수 없이 빌드**: `NEXT_PUBLIC_*`로 시작하는 변수는 빌드 시점에 주입됩니다. 변경 후 `bun run build` 재실행 필수.

2. **Supabase 마이그레이션 순서 무시**: 010~040은 의존성이 있습니다. **반드시 순번 순서**로 실행하세요.

3. **테스트 데이터 정리 안 함**: CI/CD 전에 `bun run seed:clear` 실행.

4. **RLS 정책 우회**: service_role 사용 시 RLS bypass. 사용자 세션도 함께 테스트하세요.

5. **Stripe webhook 미설정**: 결제 기능은 webhook 없이 불완전합니다. Vercel deploy 후 **반드시 [docs/DEPLOY.md](./docs/DEPLOY.md) 섹션 1-4**를 따라 webhook endpoint 추가.

---

## 🆘 문제 해결

**먼저 확인:**
1. [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) 읽기
2. GitHub Issues 검색
3. 콘솔 에러 확인 (`F12` → Console)

**여전히 안 되면:**
- luke@xrx.studio 이메일
- GitHub Issues 신규 생성 (error log, 재현 단계 포함)

---

## 📊 배포 현황

| 환경 | 상태 | 도메인 |
|------|------|--------|
| **Production** | ✅ Live | https://getitdonework.com |
| **Staging** | ✅ Available | Vercel preview (PR 기반) |
| **Development** | ✅ Local | http://localhost:3000 |

자세한 배포 절차: [docs/DEPLOY.md](./docs/DEPLOY.md)

---

## 🤝 기여

1. 새 기능은 `feature/{name}` 브랜치에서 작업
2. PR 생성 시 변경사항 명확히 기술 (what / why)
3. ESLint 통과 확인: `bun run lint`
4. E2E 테스트 추가 (가능하면)
5. DESIGN.md와 스타일 일관성 확인
6. main merge 전 빌드 성공 필수: `bun run build`

---

## 📝 라이선스

Proprietary © 2026 Get It Done at Work. 모든 권리 보유.

---

## 📞 문의

**창업자**: Luke Park  
**이메일**: luke@xrx.studio  
**GitHub**: https://github.com/LukeParkXRX/getitdonework
