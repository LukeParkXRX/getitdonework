# Get It Done at Work

> 한국 스타트업 ↔ 미국 MBA Enabler 매칭 마켓플레이스

**도메인**: https://getitdonework.com  
**리포**: https://github.com/LukeParkXRX/getitdonework  
**문의**: luke@xrx.studio

---

## Overview

| 항목 | 내용 |
|------|------|
| **무엇을** | 한국 스타트업과 미국 MBA 출신 Enabler(파트너)를 연결하는 B2B 매칭 플랫폼 |
| **누구를 위해** | 미국 진출을 준비하는 한국 스타트업 팀 + 전문 지식을 제공할 MBA 인재 |
| **핵심 가치** | 검증된 전문가(Enabler)와 빠른 1:1 매칭 → Chemistry Call → 유상 세션 |

### 주요 기능

- **1:1 매칭**: 한국 스타트업 ↔ 미국 MBA Enabler 자동 탐색 및 필터링
- **Chemistry Call**: 15분 무료 화상 상담 (LiveKit 기반)
- **유상 세션**: Standard / Project 타입 세션 결제 (Stripe, 크레딧 단위)
- **Enabler 정산**: Stripe Connect Express로 USD 자동 입금
- **실시간 메시징**: Supabase Realtime 기반 1:1 채팅
- **멀티채널 알림**: 인앱 + 이메일 (Resend) + Web Push (VAPID)
- **자동 다국어**: IP 지역 감지 → 한국(ko) / 미국(en) 자동 전환 (next-intl)
- **관리자 도구**: KPI 대시보드, Dispute 처리, 공지 발송, 감사 로그, 사용자 가장(impersonation)
- **Insights**: MBA 전문가 아티클 (7개+)
- **Launch Dashboard**: 런칭 현황 대시보드 (팀 전용)

---

## Quick Start

### 요구사항

- **Bun** 1.x (권장) — [bun.sh](https://bun.sh)
- **Git**
- **Supabase** 계정 (클라우드) 또는 Docker (로컬)

### 1. 클론 & 설치

```bash
git clone https://github.com/LukeParkXRX/getitdonework
cd getitdonework
bun install
```

### 2. 환경변수 설정

```bash
cp .env.local.example .env.local
```

필수 항목 입력:

```env
# Supabase (필수)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# 앱 기본 설정
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=you@example.com

# 베타 모드 — TestLoginPanel 활성화
NEXT_PUBLIC_SHOW_TEST_DATA=true
```

전체 변수 목록 + 설명 + 발급 위치: [`.env.local.example`](./.env.local.example) (정본). 배포 가이드는 [docs/DEPLOY.md](./docs/DEPLOY.md).

### 3. Supabase 마이그레이션 (첫 실행 시)

마이그레이션 파일 47개를 순서대로 실행합니다 (`001` → `048`).

```bash
# Supabase 콘솔 SQL Editor에서 supabase/migrations/ 폴더 파일을 순번 순으로 실행
# 또는 supabase CLI 사용:
supabase db push
```

주요 마이그레이션:

| 번호 | 내용 |
|------|------|
| 001 | 초기 스키마 (users, enablers, bookings, reviews) |
| 010 | 지원서(application_intake) |
| 020 | 결제 및 크레딧 시스템 |
| 030 | 실시간 메시징 + 알림 |
| 036 | 2FA (Two-Factor Auth) |
| 038 | Impersonation 감사 로그 |
| 041 | 세션 이벤트 로그 |
| 044 | Launch Dashboard |
| 045 | Launch Hub (외부 서비스 + 계정 관리) |
| 046 | 2FA passed_at 타임스탬프 |
| 047 | 세무 서류(W-9/W-8BEN) 스토리지 |
| 048 | 런칭 체크리스트 파일 업로드 |

### 4. 테스트 데이터 주입

```bash
bun run seed:reset
# 17명 생성 (Enabler 10 + Startup 5 + admin 2), 35 bookings, 30 reviews
```

### 5. 개발 서버 실행

```bash
bun run dev
# http://localhost:3000 (Turbopack + HMR)
```

빠른 테스트 로그인 (`NEXT_PUBLIC_SHOW_TEST_DATA=true` 필요):
- `/login` → `TEST MODE` 패널 → `Startup 01 — B2B SaaS` 클릭
- 공통 비밀번호: `Test!GetItDone2026`

---

## Tech Stack

| 계층 | 기술 |
|------|------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4 |
| **Backend** | Supabase (Postgres + Auth + Realtime + Storage) |
| **결제** | Stripe API + Stripe Connect Express |
| **화상** | LiveKit (WebRTC 기반 화상 상담) |
| **이메일** | Resend (도메인 인증 발신) |
| **모니터링** | Sentry (에러 추적) |
| **캐시/Rate Limit** | Upstash Redis + in-memory fallback |
| **배포** | Vercel (auto-deploy on main push) |
| **빌드** | Bun 1.x, Turbopack |
| **테스트** | Playwright E2E (28 tests), Storybook, Vitest |
| **Cron** | Vercel Cron Jobs |

---

## Architecture

### 라우트 구조

```
src/app/
├── (public)/          공개 페이지 — 인증 불필요
│   ├── enablers/      Enabler 탐색 + 검색
│   ├── insights/      MBA 아티클 목록 + 상세 ([id])
│   ├── about/
│   ├── faq/
│   └── ...
├── (auth)/            인증 페이지
│   ├── login/         이메일 + Google OAuth + TestLoginPanel
│   ├── signup/        이메일 가입 + 역할 선택
│   └── ...
├── (dashboard)/       Startup 사용자 대시보드
│   ├── my/            홈
│   ├── enablers/[id]  Enabler 상세 + 예약/메시지
│   ├── bookings/      예약 내역
│   └── messages/      1:1 채팅
├── (enabler)/         Enabler 대시보드
│   ├── enabler-dashboard/
│   ├── profile/
│   ├── earnings/
│   └── availability/
├── (org)/             조직 어드민
├── (admin)/admin/     Super Admin (15+ 페이지)
│   ├── dashboard/     KPI funnel
│   ├── users/
│   ├── disputes/
│   └── broadcasts/
├── launch/            Launch Dashboard (팀 전용)
├── api/               60+ REST API 라우트
├── onboarding/        신규 가입 온보딩
└── meeting/           LiveKit 화상 회의
```

### DB 스키마 핵심

```
users (auth.users 연동)
  └─ enablers (프로필, 가격, 전문분야)
  └─ startups (스타트업 정보)
  └─ bookings (세션 예약, status: pending/confirmed/completed)
        └─ reviews (별점, 텍스트)
        └─ session_events (입장/퇴장 로그)
  └─ conversations + messages (1:1 채팅)
  └─ notifications (인앱 알림)
  └─ credits + credit_transactions (결제 단위)
  └─ audit_log (관리자 작업 감사)
```

---

## Launch Dashboard 사용법

> **팀 전용 내부 도구** — 런칭 체크리스트·현황·서비스 계정 통합 관리

- **URL**: https://getitdonework.com/launch
- **인증**: 이메일 화이트리스트 (`luke@xrx.studio`, `woosub@xrx.studio`, `sson@xrx.studio`)
- **로컬 접근**: `http://localhost:3000/launch` (화이트리스트 이메일로 로그인)

### 10개 메뉴

| 메뉴 | 설명 |
|------|------|
| **Checklist** | 런칭 전 체크리스트 (카테고리별, 진행률 표시) |
| **Updates** | 개발 일지 / Daily Updates (스프린트별 그룹 + 무한스크롤) |
| **About** | 프로젝트 개요 |
| **Features** | 구현된 기능 목록 |
| **Credits** | 기여자 및 오픈소스 크레딧 |
| **Pages** | 전체 페이지 썸네일 갤러리 |
| **Services** | 외부 서비스 16종 (상태 + 링크) |
| **Accounts** | 서비스 계정 16개 (이메일, 역할, 상태) |
| **Dev Timeline** | Sprint 1~56 타임라인 |
| **Notes** | 팀 노트 |

### 스크립트

```bash
# 개발 일지 등록 (Claude 자동 실행)
bun run log:update --title "Sprint 57" --body "내용" --type sprint

# 페이지 썸네일 갱신 (Playwright 스크린샷)
bun run capture:thumbs

# Launch Dashboard 체크리스트 시드
bun run seed:launch

# 외부 서비스 + 계정 시드
bun run seed:hub
```

---

## 환경변수

전체 키 목록·설명·발급 위치는 **[`.env.local.example`](./.env.local.example) 가 정본**입니다. 새 키를 추가하거나 누락 여부를 확인할 때 이 파일을 기준으로 사용하세요.

```bash
cp .env.local.example .env.local
# 그리고 빈 값을 채우세요
```

런타임에 키 누락을 사전 점검하려면:

```bash
bun run audit:prod
```

---

## 시드 + 운영 스크립트

```bash
# 테스트 데이터 초기화 + 재주입
bun run seed:reset

# 테스트 데이터만 주입
bun run seed:test

# 테스트 데이터 제거
bun run seed:clear

# AI 생성 아바타 주입 (nano-banana 스타일)
bun run seed:avatars

# Launch Dashboard 체크리스트 시드
bun run seed:launch

# 외부 서비스 + 계정 시드
bun run seed:hub

# 런칭 직전 점검 (보안, 성능, 환경변수 체크)
bun run audit:prod

# 페이지 썸네일 스크린샷 (Playwright)
bun run capture:thumbs

# 개발 일지 등록
bun run log:update
```

---

## 테스트

```bash
# TypeScript 타입 체크
bunx tsc --noEmit

# ESLint
bun run lint

# E2E 테스트 (Playwright) — 28 tests, 7 specs
E2E_BASE_URL=http://localhost:3001 bunx playwright test

# E2E 특정 spec
bunx playwright test tests/e2e/05-signup.spec.ts

# E2E UI 모드 (시각적 디버깅)
bunx playwright test --ui

# Storybook 컴포넌트 문서
bun run storybook
```

### E2E 스펙 목록

| 파일 | 케이스 수 | 내용 |
|------|-----------|------|
| `01-public-pages.spec.ts` | 8 | 공개 페이지 전체 접근 확인 |
| `02-language-toggle.spec.ts` | 3 | 언어 전환 (ko ↔ en) |
| `03-enablers-search.spec.ts` | 4 | Enabler 탐색·검색·필터 |
| `04-cookie-consent.spec.ts` | 3 | Cookie Consent 배너 |
| `05-signup.spec.ts` | 4 | 회원가입 폼 검증 |
| `06-enabler-detail.spec.ts` | 2 | Enabler 상세 페이지 (인증 후) |
| `07-insights-detail.spec.ts` | 4 | Insights 목록 + 상세 |

---

## 배포

```bash
# 자동 배포: main 브랜치 push → Vercel auto-deploy
git push origin main
```

- **도메인**: getitdonework.com (`vercel.json` 설정)
- **환경변수**: Vercel Dashboard → Project Settings → Environment Variables
- **Supabase 마이그레이션**: Supabase 콘솔 SQL Editor에서 순번 순 수동 적용 (또는 `supabase db push`)
- **Stripe Webhook**: 배포 후 [docs/DEPLOY.md](./docs/DEPLOY.md) 섹션 1-4 따라 endpoint 등록 필수

자세한 배포 절차: [docs/DEPLOY.md](./docs/DEPLOY.md)

---

## 프로젝트 구조

```
src/
├── app/
│   ├── (admin)/admin/     Super Admin — 15+ 페이지
│   ├── (auth)/            인증 (login, signup, reset)
│   ├── (dashboard)/       Startup 사용자
│   ├── (enabler)/         Enabler 사용자
│   ├── (org)/             조직 어드민
│   ├── (public)/          공개 페이지 (enablers, insights, about, faq ...)
│   ├── api/               60+ API 라우트
│   ├── launch/            Launch Dashboard (팀 전용)
│   ├── meeting/           LiveKit 화상 회의
│   └── onboarding/        신규 가입 온보딩
├── components/
│   ├── ui/                기본 UI (button, input, badge, toast ...)
│   ├── layout/            Navbar, Sidebar
│   ├── dashboard/         Startup 전용
│   └── admin/             Admin 전용
├── lib/
│   ├── emails/templates/  Resend 이메일 템플릿 (12종)
│   ├── supabase/          client, server, middleware, guards
│   ├── stripe/            결제 헬퍼
│   └── auth/              roles, ROLE_HOME
├── messages/              next-intl 다국어 (ko.json, en.json)
└── middleware.ts           인증 + 다국어 감지

supabase/
└── migrations/            001~048 SQL (47개, 순번 순 적용)

scripts/
├── seed-test-data.ts      테스트 사용자·예약·리뷰 생성
├── seed-launch-checklist.ts
├── seed-launch-hub.ts     외부 서비스 + 계정 시드
├── generate-avatars.ts    AI 아바타 생성
├── audit-prod-readiness.ts 런칭 점검
├── capture-page-thumbs.ts 페이지 썸네일
└── log-daily-update.ts    개발 일지 등록

tests/
└── e2e/                   Playwright E2E (7 specs, 28 tests)

docs/
├── DEPLOY.md              배포 + 환경변수 전체 가이드
├── API.md                 60+ API 라우트 명세
├── TROUBLESHOOTING.md     흔한 이슈 해결법
├── RESEND_DOMAIN_SETUP.md 이메일 도메인 인증
├── BACKUP_POLICY.md       백업·복구 정책
├── LOAD_TESTING.md        k6 부하 테스트
└── TEST_DATA.md           테스트 데이터 스키마
```

---

## 디자인 시스템

단일 진실: [DESIGN.md](./DESIGN.md)

- **테마**: 다크 모드 (검정 배경, `var(--color-dark)`)
- **액센트**: 라임 그린 (`#d4f000`, `var(--color-accent)`)
- **타이포**: Instrument Sans (헤딩), Inter (본문)
- **스타일**: Tailwind CSS v4 + CSS 변수 + inline style 혼합
- **그리드**: 12칼럼, rem 단위, 모바일 우선

---

## 보안

- **Security Headers**: CSP / HSTS / X-Frame-Options — `next.config.ts`
- **RLS**: Row Level Security 전 테이블 적용
- **2FA**: 사용자 자체 활성화 가능 (`users.two_factor_enabled`)
- **Audit Log**: Admin 작업 전체 추적 (`audit_log` 테이블)
- **Impersonation**: Admin이 사용자로 보기 — 감사 로그 동반 (`impersonation_log`)
- **Rate Limit**: API 엔드포인트 Upstash Redis 기반 제한

---

## 문서

| 문서 | 목적 |
|------|------|
| [DESIGN.md](./DESIGN.md) | 디자인 시스템 토큰 + 컴포넌트 규칙 |
| [CLAUDE.md](./CLAUDE.md) | AI 개발 가이드 (Claude Code 룰) |
| [docs/DEPLOY.md](./docs/DEPLOY.md) | 첫 운영 셋업 + 일상 배포 (★ 필독) |
| [docs/API.md](./docs/API.md) | 60+ API 라우트 명세 |
| [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) | 흔한 이슈 & 해결법 |
| [docs/RESEND_DOMAIN_SETUP.md](./docs/RESEND_DOMAIN_SETUP.md) | 이메일 도메인 인증 |
| [docs/BACKUP_POLICY.md](./docs/BACKUP_POLICY.md) | 백업·복구 정책 |
| [docs/LOAD_TESTING.md](./docs/LOAD_TESTING.md) | k6 부하 테스트 |

---

## 자주 하는 실수

1. **마이그레이션 순서 무시**: `001` → `048` 반드시 순번 순으로 실행. 의존성 있음.
2. **환경변수 미주입 후 빌드**: `NEXT_PUBLIC_*`는 빌드 시점 주입. 변경 후 `bun run build` 재실행.
3. **Stripe Webhook 미설정**: 결제 기능은 webhook 없이 불완전. Vercel 배포 후 endpoint 등록 필수.
4. **RLS 우회 주의**: `service_role` 사용 시 RLS bypass. 사용자 세션도 별도 테스트.
5. **테스트 데이터 미정리**: CI/CD 전 `bun run seed:clear` 실행.

---

## 개발 현황

- **Sprint**: 1~56 완료
- **마이그레이션**: 47개 (`001_initial_schema` ~ `048_launch_checklist_uploads`)
- **API 라우트**: 60+
- **E2E 테스트**: 28 tests (7 specs) — 전부 green
- **시드 데이터**: 17 유저 (Enabler 10, Startup 5, Admin 2), 35 bookings, 30 reviews

---

## 라이선스

Proprietary © 2026 Get It Done at Work. 모든 권리 보유.

---

## Contributors

- **Korea Engineering Team**: luke@xrx.studio, woosub@xrx.studio, sson@xrx.studio
- **AI 개발 보조**: Claude Code (Anthropic)
- **US Business Partner**: TBD (Launch Dashboard → Checklist 1.6)

---

## 문의

**창업자**: Luke Park  
**이메일**: luke@xrx.studio  
**GitHub**: https://github.com/LukeParkXRX/getitdonework
